import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
const dir=resolve('.sites-runtime/transport-tests');mkdirSync(dir,{recursive:true});writeFileSync(resolve(dir,'package.json'),'{"type":"commonjs"}');
const c=spawnSync(process.execPath,[resolve('node_modules/typescript/bin/tsc'),'--target','ES2022','--module','commonjs','--moduleResolution','node','--esModuleInterop','--skipLibCheck','--strict','--outDir',dir,'lib/analysis-stream.ts','lib/analysis-request-cache.ts'],{encoding:'utf8'});if(c.status)throw Error(c.stdout+c.stderr);
const require=createRequire(import.meta.url),{requestAnalysis}=require(resolve(dir,'analysis-stream.js')),{createAnalysisRequestCache}=require(resolve(dir,'analysis-request-cache.js'));
const result={analysis:{id:'test-only'}},ok=()=>Response.json(result),body={rawText:'Synthetic test JD only',useModel:true};let count=0,seen=[],stages=[];
await requestAnalysis(body,()=>{},undefined,async()=>{count++;return ok()});assert.equal(count,1);
count=0;await requestAnalysis(body,s=>stages.push(s),undefined,async(_u,o)=>{seen.push(o);if(++count===1)throw new TypeError('network error');return ok()});assert.equal(count,2);assert.equal(seen[0].body,seen[1].body);assert.equal(seen[0].headers['X-WLO-Request-Id'],seen[1].headers['X-WLO-Request-Id']);assert(stages.includes('reconnecting'));
count=0;await requestAnalysis(body,()=>{},undefined,async()=>++count===1?new Response('event: stage\ndata: {"stage":"analysis"}\n\n',{headers:{'content-type':'text/event-stream'}}):ok());assert.equal(count,2);
for(const status of [401,422,429]){count=0;await assert.rejects(()=>requestAnalysis(body,()=>{},undefined,async()=>{count++;return Response.json({error:'business error'},{status})}));assert.equal(count,1);}
count=0;await assert.rejects(()=>requestAnalysis(body,()=>{},undefined,async()=>{count++;throw new TypeError('network error')}));assert.equal(count,2);
const abort=new AbortController();abort.abort();count=0;await assert.rejects(()=>requestAnalysis(body,()=>{},abort.signal,async()=>{count++;return ok()}));assert.equal(count,0);
count=0;const cache=createAnalysisRequestCache();let release;const wait=new Promise(r=>release=r);const run=async()=>{count++;await wait;return {ok:true}};const a=cache('same-actor-input-id',run),b=cache('same-actor-input-id',run);release();assert.deepEqual(await a,await b);assert.equal(count,1);await cache('different-actor-input-id',run);assert.equal(count,2);
const rejected=createAnalysisRequestCache();count=0;for(let i=0;i<2;i++)await assert.rejects(()=>rejected('x',async()=>{count++;throw Error('failed')}));assert.equal(count,2);
const oldTimeout=AbortSignal.timeout,expired=new AbortController();AbortSignal.timeout=()=>expired.signal;count=0;try{await assert.rejects(()=>requestAnalysis(body,()=>{},undefined,async()=>{count++;expired.abort(new DOMException('timeout','TimeoutError'));throw expired.signal.reason}),/analysis_deadline/);assert.equal(count,1)}finally{AbortSignal.timeout=oldTimeout;}
count=0;let chunks=0;const completeThenCut=new ReadableStream({pull(c){if(chunks++===0)c.enqueue(new TextEncoder().encode('event: result\ndata: '+JSON.stringify(result)+'\n\n'));else c.error(new TypeError('network error'))}});assert.deepEqual(await requestAnalysis(body,()=>{},undefined,async()=>{count++;return new Response(completeThenCut,{headers:{'content-type':'text/event-stream'}})}),result);assert.equal(count,1);
count=0;const transient=createAnalysisRequestCache(1000,32,()=>false);await transient('fail',async()=>++count);await transient('fail',async()=>++count);assert.equal(count,2);
count=0;await requestAnalysis(body,()=>{},undefined,async()=>++count===1?new Response('<html>gateway error</html>',{status:200}):ok());assert.equal(count,2);
count=0;await assert.rejects(()=>requestAnalysis(body,()=>{},undefined,async()=>{count++;return new Response('<html>rate limit</html>',{status:429})}),/analysis_rate_limited/);assert.equal(count,1);
count=0;await assert.rejects(()=>requestAnalysis(body,()=>{},undefined,async()=>{count++;return new Response('event: failure\ndata: {"error":"字段无效","status":422}\n\n',{headers:{'content-type':'text/event-stream'}})}),/字段无效/);assert.equal(count,1);
const route=readFileSync('app/api/[...path]/route.ts','utf8');assert(route.includes('send("stage",{stage:"accepted"})'));assert(route.includes('},5000)'));assert(route.includes('request.headers.get("cookie")'));assert(route.includes('request.headers.get("origin")'));
console.log(JSON.stringify({passed:true,checks:19,live_model_calls:0}));
