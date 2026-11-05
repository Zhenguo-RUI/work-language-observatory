import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';

const output=resolve('.sites-runtime/model-stream-tests');mkdirSync(output,{recursive:true});
writeFileSync(resolve(output,'package.json'),'{"type":"commonjs"}');
const built=spawnSync(process.execPath,[resolve('node_modules/typescript/bin/tsc'),'--target','ES2022','--module','commonjs','--moduleResolution','node','--esModuleInterop','--skipLibCheck','--strict','--outDir',output,'lib/model-client.ts'],{encoding:'utf8'});
if(built.status!==0){process.stderr.write(built.stdout+built.stderr);process.exit(1);}
const require=createRequire(import.meta.url),{requestModelJson}=require(resolve(output,'model-client.js'));
const encoder=new TextEncoder();
const options={provider:'deepseek',apiKey:'synthetic-not-live',model:'deepseek-flash',instructions:'Return JSON.',input:{synthetic:true},schema:{type:'object'},schemaName:'synthetic',maxOutputTokens:100,timeoutMs:1000};
const chunk=(content,finish_reason=null,extra={})=>`data: ${JSON.stringify({choices:[{index:0,delta:{...(content===undefined?{}:{content}),...extra},finish_reason}]})}\n\n`;
const end='data: [DONE]\n\n';
function response(text,{fragment=Infinity,fail=false}={}){
 const bytes=encoder.encode(text);let offset=0;
 return new Response(new ReadableStream({pull(controller){if(offset>=bytes.length){if(fail)controller.error(new Error('synthetic body terminated'));else controller.close();return;}const next=Math.min(offset+fragment,bytes.length);controller.enqueue(bytes.slice(offset,next));offset=next;}}),{headers:{'Content-Type':'text/event-stream; charset=utf-8'}});
}
const run=(res,extra={})=>requestModelJson({...options,...extra,request:async()=>res});
const checks=[];async function check(name,fn){await fn();checks.push({name,passed:true});}

await check('DeepSeek requests upstream streaming and consumes only final content deltas',async()=>{let sent;const answer=await requestModelJson({...options,request:async(url,init)=>{sent=JSON.parse(init.body);assert.equal(url,'https://api.deepseek.com/chat/completions');return response(chunk(undefined,null,{reasoning_content:'private thought must not become JSON'})+chunk('{"ok":')+chunk('true}', 'stop')+end);}});assert.equal(sent.stream,true);assert.equal(sent.thinking.type,'enabled');assert.equal(answer,'{"ok":true}');assert.ok(!answer.includes('private'));});
await check('UTF-8 characters and SSE lines survive one-byte transport fragmentation',async()=>{const answer=await run(response(chunk('{"词":"')+chunk('沟通🙂"}')+chunk(undefined,'stop')+end,{fragment:1}));assert.deepEqual(JSON.parse(answer),{词:'沟通🙂'});});
await check('CRLF boundaries split across chunks retain event framing',async()=>{const answer=await run(response((chunk('{"ok":true}')+chunk(undefined,'stop')+end).replace(/\n/g,'\r\n'),{fragment:1}));assert.equal(answer,'{"ok":true}');});
await check('comments, event labels and usage-only frames do not corrupt answer',async()=>{const text=': keepalive\n\nevent: message\n'+chunk('{"ok":true}')+chunk(undefined,'stop')+'data: {"choices":[],"usage":{"total_tokens":10}}\n\n'+end;assert.equal(await run(response(text,{fragment:7})),'{"ok":true}');});
await check('multi-line SSE data fields are joined according to SSE framing',async()=>{const text='data: {"choices":\ndata: [{"delta":{"content":"{}"},"finish_reason":"stop"}]}\n\n'+end;assert.equal(await run(response(text)),'{}');});
await check('stop without terminal DONE is rejected',async()=>assert.rejects(()=>run(response(chunk('{"ok":true}','stop'))),/model_incomplete_stream/));
await check('DONE without an explicit stop reason is rejected',async()=>assert.rejects(()=>run(response(chunk('{"ok":true}')+end)),/model_incomplete_stream/));
await check('length termination never returns partial JSON even if it parses',async()=>assert.rejects(()=>run(response(chunk('{}','length')+end)),/model_incomplete_output/));
for(const reason of ['content_filter','tool_calls','insufficient_system_resource','aborted'])await check(`${reason} termination is rejected`,async()=>assert.rejects(()=>run(response(chunk('{}',reason)+end)),/model_empty_or_refused/));
await check('reasoning-only stream is not accepted as an answer',async()=>assert.rejects(()=>run(response(chunk(undefined,null,{reasoning_content:'{"not":"the answer"}'})+chunk(undefined,'stop')+end)),/model_empty_or_refused/));
await check('blank JSON-mode answer is rejected',async()=>assert.rejects(()=>run(response(chunk('   ','stop')+end)),/model_empty_or_refused/));
await check('stream refusal is rejected without returning its text',async()=>assert.rejects(()=>run(response(chunk(undefined,null,{refusal:'synthetic refusal detail'})+end)),/model_empty_or_refused/));
await check('provider error event exposes only a fixed error code',async()=>assert.rejects(()=>run(response('data: {"error":{"message":"private provider detail"}}\n\n')),e=>e.message==='model_stream_error'));
await check('malformed SSE JSON fails rather than being silently skipped',async()=>assert.rejects(()=>run(response('data: {invalid}\n\n'+end)),/model_invalid_stream/));
await check('invalid content delta type is rejected',async()=>assert.rejects(()=>run(response(chunk({bad:'type'},'stop')+end)),/model_invalid_stream/));
await check('content arriving after stop is rejected',async()=>assert.rejects(()=>run(response(chunk('{}','stop')+chunk('suffix')+end)),/model_invalid_stream/));
await check('body stream errors never return a partial answer',async()=>assert.rejects(()=>run(response(chunk('{"ok":true}'),{fragment:13,fail:true})),/synthetic body terminated/));
await check('a stalled response body is cancelled at the request deadline',async()=>{let cancelled=false;const res=new Response(new ReadableStream({start(c){c.enqueue(encoder.encode(chunk(undefined,null,{reasoning_content:'working'})));},cancel(){cancelled=true;}}),{headers:{'Content-Type':'text/event-stream'}});const started=Date.now();const keeper=setTimeout(()=>{},1500);try{await assert.rejects(()=>run(res,{timeoutMs:25}),e=>e.name==='TimeoutError');assert.ok(cancelled);assert.ok(Date.now()-started<1000);}finally{clearTimeout(keeper);}});
await check('a completed DONE marker does not wait for an open producer to close',async()=>{let cancelled=false;const res=new Response(new ReadableStream({start(c){c.enqueue(encoder.encode(chunk('{}','stop')+end));},cancel(){cancelled=true;}}),{headers:{'Content-Type':'text/event-stream'}});assert.equal(await run(res),'{}');assert.ok(cancelled);});
await check('oversized unterminated SSE frame is rejected',async()=>assert.rejects(()=>run(response('data: '+ 'x'.repeat(600*1024))),/model_response_too_large/));
await check('oversized accumulated answer is rejected',async()=>{const text=Array.from({length:12},()=>chunk('x'.repeat(100_000))).join('')+chunk(undefined,'stop')+end;await assert.rejects(()=>run(response(text,{fragment:8192})),/model_response_too_large/);});
await check('overall stream bytes remain bounded even for discarded reasoning',async()=>{const text=Array.from({length:175},()=>chunk(undefined,null,{reasoning_content:'x'.repeat(100_000)})).join('')+chunk('{}','stop')+end;await assert.rejects(()=>run(response(text,{fragment:65536})),/model_response_too_large/);});
await check('non-streaming JSON fixture remains supported with strict stop reason',async()=>{assert.equal(await run(Response.json({choices:[{finish_reason:'stop',message:{content:'{"ok":true}',reasoning_content:'private'}}]})),'{"ok":true}');await assert.rejects(()=>run(Response.json({choices:[{finish_reason:'length',message:{content:'{}'}}]})),/model_incomplete_output/);});
await check('OpenAI Responses JSON adapter remains unchanged',async()=>{const answer=await requestModelJson({...options,provider:'openai',request:async(_url,init)=>{const body=JSON.parse(init.body);assert.equal(body.stream,undefined);assert.equal(body.store,false);return Response.json({output:[{content:[{type:'output_text',text:'{}'}]}]});}});assert.equal(answer,'{}');});

console.log(JSON.stringify({passed:checks.length,paid_calls:0,checks},null,2));
