// Offline recovery regression suite. Uses synthetic JDs and provider responses only.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const out=resolve('.sites-runtime/model-recovery-tests');mkdirSync(out,{recursive:true});writeFileSync(out+'/package.json','{"type":"commonjs"}');
const compiled=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','--target','ES2022','--module','commonjs','--moduleResolution','node','--esModuleInterop','--skipLibCheck','--strict','--outDir',out,'lib/model-reading.ts'],{encoding:'utf8'});
if(compiled.status!==0){console.error(compiled.stdout+compiled.stderr);process.exit(1);}
const require=createRequire(import.meta.url),{runModelReading}=require(out+'/model-reading.js'),{ruleDraft}=require(out+'/analysis-engine.js');
const checks=[];
async function check(name,fn){await fn();checks.push({name,passed:true});}
const raw='广告投放实习岗位。为商家测试广告素材，分析点击与成交数据，提出预算调整建议，预算由经理批准。与设计团队沟通并独立完成复盘。';
const valid=ruleDraft(raw,'广告投放实习',[]);valid.depth.basis='model';valid.questions=[{zh:'预算建议怎样验收？',en:'How are budget recommendations assessed?'}];valid.depth.questionTests=[{questionIndex:0,quote:'提出预算调整建议',answerA:{zh:'单独评估建议的证据。',en:'Assess evidence for the recommendation separately.'},answerB:{zh:'只评估整体成交结果。',en:'Assess only overall sales.'},difference:{zh:'前者评价判断依据，后者评价总结果，个人成果认定不同。',en:'The first evaluates the judgment basis; the second evaluates the overall outcome, changing attribution of individual work.'}}];
const invalid=structuredClone(valid);invalid.terms[0].quote='NOT A SOURCE QUOTE';
const time='2026-11-05T00:00:00.000Z',snippet='Meituan is an internet company connecting merchants and consumers.';
const match={id:'wiki-Q15907772',title:'Meituan',url:'https://www.wikidata.org/wiki/Q15907772',snippet,kind:'encyclopedia',retrievedAt:time,match:'exact',nameZh:'美团',nameEn:'Meituan'};
const context={company:{name:{zh:'美团',en:'Meituan'},relationship:'employer',description:{zh:'公司资料预览。',en:'Company source preview.'},basis:'retrieved'},industry:{name:{zh:'广告投放',en:'Ad delivery'},description:{zh:'按JD识别。',en:'Identified from the JD.'},basis:'jd'},implication:{zh:'原文预算由经理批准。',en:'The JD assigns budget approval to the manager.'},sources:[{id:match.id,title:match.title,url:match.url,retrievedAt:time,kind:match.kind,excerpt:snippet}],status:'sourced',evidence:[],notice:{zh:'合成测试资料。',en:'Synthetic test source.'},lookup:{query:'美团',status:'matched',provider:'Synthetic test provider',searchedAt:time,selectedId:match.id,matches:[match]},briefBasis:'source'};
const brief={nameEn:'Meituan',overview:{zh:'测试资料描述了连接商家与消费者的互联网业务。',en:'The test source describes an internet business connecting merchants and consumers.'},relevance:{zh:'广告素材与点击分析服务于商家，预算仍由经理批准。',en:'Creative and click analysis serves merchants, while budget approval remains with the manager.'},anchors:[{sourceId:match.id,quote:'Meituan is an internet company'}]};
const invalidBrief={...structuredClone(brief),overview:{zh:'绝不可展示的错误公司简介。',en:'INVALID COMPANY SUMMARY MUST NEVER BE SHOWN.'},anchors:[{sourceId:match.id,quote:'An invented source quotation'}]};
const deep=value=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}]});
const open=value=>Response.json({output:[{content:[{type:'output_text',text:JSON.stringify(value)}]}]});
const providerError=status=>Response.json({error:{message:'Synthetic provider failure'}},{status});
const networkError=()=>new TypeError('fetch failed',{cause:{code:'ECONNRESET'}});
const readInput=body=>JSON.parse(body.messages?.[1]?.content||body.input);
function corePreserved(result){for(const key of ['headline','role','terms','sociology','questions','depth'])assert.deepEqual(result[key],valid[key]);}
function sourcePreviewOnly(result){corePreserved(result);assert.notEqual(result.context?.briefBasis,'model');assert.notDeepEqual(result.context?.company.description,invalidBrief.overview);assert(!result.context?.companyEvidence?.some(a=>a.quote==='An invented source quotation'));}

async function scenario(responder,extra={}){
 let clock=1_000_000;const requests=[],budgets=[],stages=[];
 const originalTimeout=AbortSignal.timeout;
 AbortSignal.timeout=ms=>{budgets.push(ms);return new AbortController().signal;};
 const opts={provider:'deepseek',apiKey:'synthetic-not-live',model:'deepseek-flash',raw,title:'广告投放实习',comparators:[],methodNote:'',now:()=>clock,onProgress:stage=>stages.push(stage),...extra,request:async(url,init)=>{const body=JSON.parse(init.body),index=requests.length;requests.push({url,body,input:readInput(body)});return responder({index,body,input:readInput(body),advance:ms=>{clock+=ms;}});}};
 try{return {value:await runModelReading(opts),requests,budgets,stages};}
 catch(error){error.testRequests=requests;error.testBudgets=budgets;throw error;}
 finally{AbortSignal.timeout=originalTimeout;}
}

await check('first DeepSeek request retains high reasoning with a 32K completion allowance and 150-second budget',async()=>{
 const r=await scenario(()=>deep(valid));assert.equal(r.value.calls,1);assert.equal(r.requests[0].body.reasoning_effort,'high');assert.equal(r.requests[0].body.max_tokens,32768);assert.equal(r.budgets[0],150000);corePreserved(r.value.result);
});
for(const [name,failure] of [['network failure',()=>{throw networkError();}],['HTTP 429',()=>providerError(429)],['HTTP 500',()=>providerError(500)],['HTTP 503',()=>providerError(503)],['truncated output',()=>Response.json({choices:[{finish_reason:'length',message:{content:'{}'}}]})]]){
 await check(`${name} receives one complete low-reasoning recovery without accepting partial output`,async()=>{
  const r=await scenario(({index})=>index===0?failure():deep(valid));assert.equal(r.value.calls,2);assert.equal(r.requests.length,2);assert.equal(r.requests[1].body.reasoning_effort,'low');assert.equal(r.requests[1].body.max_tokens,24576);assert(r.budgets[1]<=90000);corePreserved(r.value.result);
 });
}
await check('a network interruption during a provider stream discards the broken answer and retries once',async()=>{
 const encoder=new TextEncoder();let pulls=0;
 const broken=()=>new Response(new ReadableStream({pull(controller){if(pulls++===0)controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"{\\"unsafePartial\\":"},"finish_reason":null}]}\n\n'));else controller.error(new TypeError('terminated',{cause:{code:'UND_ERR_SOCKET'}}));}}),{headers:{'Content-Type':'text/event-stream'}});
 const r=await scenario(({index})=>index===0?broken():deep(valid));assert.equal(r.requests.length,2);corePreserved(r.value.result);assert(!JSON.stringify(r.value.result).includes('unsafePartial'));
});
for(const status of [400,401,402,422])await check(`HTTP ${status} is not retried`,async()=>{
 await assert.rejects(()=>scenario(()=>providerError(status)),error=>{assert.equal(error.testRequests.length,1);return error.message===`model_http_${status}`;});
});
await check('a model refusal is not retried',async()=>{
 await assert.rejects(()=>scenario(()=>Response.json({choices:[{finish_reason:'content_filter',message:{refusal:'Synthetic refusal'}}]})),error=>{assert.equal(error.testRequests.length,1);return /refused/.test(error.message);});
});
await check('a repeated transient failure stops after two provider requests',async()=>{
 await assert.rejects(()=>scenario(()=>providerError(503)),error=>{assert.equal(error.testRequests.length,2);return error.message==='model_http_503';});
});
await check('a failed core contract receives its previous final JSON and specific repair requirements',async()=>{
 const r=await scenario(({index})=>deep(index===0?invalid:valid));const repair=r.requests[1].input;assert(repair.repairRequirements.length);assert(repair.previousFinalJson);const previous=typeof repair.previousFinalJson==='string'?JSON.parse(repair.previousFinalJson):repair.previousFinalJson;assert.equal(previous.terms[0].quote,'NOT A SOURCE QUOTE');assert(!('reasoning_content' in repair));assert.equal(r.requests[1].body.reasoning_effort,'low');corePreserved(r.value.result);
});
await check('a slow first generation still leaves a full bounded recovery allowance',async()=>{
 const r=await scenario(({index,advance})=>{if(index===0){advance(149000);return deep(invalid);}return deep(valid);});assert.equal(r.budgets[0],150000);assert.equal(r.budgets[1],90000);assert.equal(r.value.calls,2);
});
await check('the total deadline prevents starting a request when almost no time remains',async()=>{
 await assert.rejects(()=>scenario(({advance})=>{advance(238000);return deep(invalid);}),error=>{assert.equal(error.testRequests.length,1);return /deadline|timeout/i.test(error.message);});
});
await check('a core that remains unsupported is rejected after the bounded repair',async()=>{
 await assert.rejects(()=>scenario(()=>deep(invalid)),error=>{assert.equal(error.testRequests.length,2);return /invalid_after_one_repair/.test(error.message);});
});
await check('an invalid company brief repairs only that field while retaining a validated JD core',async()=>{
 const r=await scenario(({index,body})=>{if(index===0)return deep({...valid,companyBrief:invalidBrief});const marker='matching this JSON schema: ';const schema=JSON.parse(body.messages[0].content.split(marker)[1]);assert.deepEqual(Object.keys(schema.properties),['companyBrief']);return deep({companyBrief:brief});},{context});assert.equal(r.requests.length,2);assert(r.budgets[1]<=30000);corePreserved(r.value.result);assert.equal(r.value.result.context.briefBasis,'model');assert.deepEqual(r.value.result.context.companyEvidence,brief.anchors);
});
await check('a twice-invalid company brief cannot downgrade or overwrite the validated core',async()=>{
 const r=await scenario(({index})=>deep(index===0?{...valid,companyBrief:invalidBrief}:{companyBrief:invalidBrief}),{context});assert.equal(r.requests.length,2);sourcePreviewOnly(r.value.result);
});
await check('a company-only repair network error preserves the validated core and source preview',async()=>{
 const r=await scenario(({index})=>{if(index===0)return deep({...valid,companyBrief:invalidBrief});throw networkError();},{context});assert.equal(r.requests.length,2);sourcePreviewOnly(r.value.result);
});
await check('a valid recovered core with an invalid company brief cannot trigger a third provider request',async()=>{
 const r=await scenario(({index})=>{if(index===0)throw networkError();return deep({...valid,companyBrief:invalidBrief});},{context});assert.equal(r.requests.length,2);sourcePreviewOnly(r.value.result);
});
await check('the non-DeepSeek adapter keeps its existing 52-second shared contract-repair behavior',async()=>{
 const r=await scenario(({index,advance})=>{if(index===0)advance(1000);return open(index===0?invalid:valid);},{provider:'openai',model:'mock'});assert.equal(r.value.calls,2);assert.equal(r.budgets[0],52000);assert.equal(r.budgets[1],51000);corePreserved(r.value.result);
});

writeFileSync('model-recovery-checks.json',JSON.stringify({passed:true,count:checks.length,checks,paid_calls:0},null,2)+'\n');console.log(JSON.stringify({model_recovery_checks:checks.length,passed:true,paid_calls:0}));
