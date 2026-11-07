import {withOperationalModelFields} from './fixtures/operational-model.mjs';
import {quotedEnglishRepair} from './fixtures/quoted-english-repair.mjs';
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
const {resultSchema,deepEvidenceErrors}=require(out+'/analysis-contract.js'),{planEnglishRepair,applyEnglishRepair}=require(out+'/english-field-repair.js');
const checks=[];
async function check(name,fn){await fn();checks.push({name,passed:true});}
const raw='广告投放实习岗位。为商家测试广告素材，分析点击与成交数据，提出预算调整建议，预算由经理批准。与设计团队沟通并独立完成复盘。';
const valid=withOperationalModelFields(ruleDraft(raw,'广告投放实习',[]),raw,'advertising');valid.questions=[{zh:'预算建议怎样验收？',en:'How are budget recommendations assessed?'}];valid.depth.questionTests=[{questionIndex:0,quote:'提出预算调整建议',answerA:{zh:'单独评估建议的证据。',en:'Assess evidence for the recommendation separately.'},answerB:{zh:'只评估整体成交结果。',en:'Assess only overall sales.'},difference:{zh:'前者评价判断依据，后者评价总结果，个人成果认定不同。',en:'The first evaluates the judgment basis; the second evaluates the overall outcome, changing attribution of individual work.'}}];
const invalid=structuredClone(valid);invalid.terms[0].quote='NOT A SOURCE QUOTE';
const time='2026-11-05T00:00:00.000Z',snippet='Meituan is an internet company connecting merchants and consumers.';
const match={id:'wiki-Q15907772',title:'Meituan',url:'https://www.wikidata.org/wiki/Q15907772',snippet,kind:'encyclopedia',retrievedAt:time,match:'exact',nameZh:'美团',nameEn:'Meituan'};
const context={company:{name:{zh:'美团',en:'Meituan'},relationship:'employer',description:{zh:'公司资料预览。',en:'Company source preview.'},basis:'retrieved'},industry:{name:{zh:'广告投放',en:'Ad delivery'},description:{zh:'按JD识别。',en:'Identified from the JD.'},basis:'jd'},implication:{zh:'原文预算由经理批准。',en:'The JD assigns budget approval to the manager.'},sources:[{id:match.id,title:match.title,url:match.url,retrievedAt:time,kind:match.kind,excerpt:snippet}],status:'sourced',evidence:[],notice:{zh:'合成测试资料。',en:'Synthetic test source.'},lookup:{query:'美团',status:'matched',provider:'Synthetic test provider',searchedAt:time,selectedId:match.id,matches:[match]},briefBasis:'source'};
const brief={nameEn:'Meituan',overview:{zh:'测试资料描述了连接商家与消费者的互联网业务。',en:'The test source describes an internet business connecting merchants and consumers.'},relevance:{zh:'广告素材与点击分析服务于商家，预算仍由经理批准。',en:'Creative and click analysis serves merchants, while budget approval remains with the manager.'},anchors:[{sourceId:match.id,quote:'Meituan is an internet company'}]};
const invalidBrief={...structuredClone(brief),overview:{zh:'绝不可展示的错误公司简介。',en:'INVALID COMPANY SUMMARY MUST NEVER BE SHOWN.'},anchors:[{sourceId:match.id,quote:'An invented source quotation'}]};
const deep=value=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}]});
const deepText=content=>Response.json({choices:[{finish_reason:'stop',message:{content}}]});
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
// R7-shaped syntax failure: depth closes early and companyBrief trails a closed
// root. Synthetic values only; the fixture is never auto-reparented or accepted.
const misplaced=structuredClone(valid);
for(const key of ['preparation','example','sociologySummary','sociologyConceptId','sociologyQuotes','questionTests']){misplaced[key]=misplaced.depth[key];delete misplaced.depth[key];}
const malformed=JSON.stringify(misplaced)+',"companyBrief":null}';
await check('malformed nesting regenerates from the source and explicit hierarchy without replaying the broken answer',async()=>{
 const r=await scenario(({index,input})=>{
  if(index===0)return deepText(malformed);
  assert.equal(input.jd,raw);assert(!('previousFinalJson' in input));
  const feedback=input.repairRequirements.join('\n');
  assert(feedback.includes('depth.questionTests'));assert(feedback.includes('root companyBrief'));
  assert(feedback.includes('Do not put preparation or questionTests at root'));
  assert(feedback.includes('fresh complete bilingual reading'));
  return deep(valid);
 });
 assert.equal(r.value.calls,2);assert.equal(r.requests[1].body.reasoning_effort,'low');
 assert(r.budgets[1]<=90000);corePreserved(r.value.result);
});
await check('repeated malformed nesting remains rejected at the two-request ceiling',async()=>{
 await assert.rejects(()=>scenario(()=>deepText(malformed)),error=>{assert.equal(error.testRequests.length,2);return error.message==='model_contract_invalid_after_one_repair';});
});
await check('fresh syntax recovery must still pass exact-source evidence validation',async()=>{
 await assert.rejects(()=>scenario(({index})=>index===0?deepText(malformed):deep(invalid)),error=>{assert.equal(error.testRequests.length,2);return error.message==='model_contract_invalid_after_one_repair';});
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

const mixed=structuredClone(valid);
mixed.depth.workMap.tools.en+=' 测试';mixed.depth.deliverables[0].action.en+=' 数据';
const translations=[{path:'depth.workMap.tools.en',en:valid.depth.workMap.tools.en},{path:'depth.deliverables.0.action.en',en:valid.depth.deliverables[0].action.en}];
const patch={translations};
const parsedMixed=resultSchema.parse(mixed),parsedValid=resultSchema.parse(valid);
const englishPlan=planEnglishRepair(parsedMixed,deepEvidenceErrors(parsedMixed,raw,true,true,true),null);
assert(englishPlan);

await check('English-only repair sends just two fields, preserves all other bytes, and uses a small bounded call',async()=>{
 const before=JSON.stringify(mixed);
 const r=await scenario(({index,body,input})=>{
  if(index===0)return deep(mixed);
  assert.deepEqual(Object.keys(input).sort(),['fields','jd','title']);
  assert.deepEqual(input.fields.map(field=>field.path).sort(),translations.map(field=>field.path).sort());
  assert(!('previousFinalJson' in input));
  const marker='matching this JSON schema: ',schema=JSON.parse(body.messages[0].content.split(marker)[1]);
  assert.deepEqual(Object.keys(schema.properties),['translations']);
  assert.deepEqual(schema.properties.translations.items.properties.path.enum.sort(),translations.map(field=>field.path).sort());
  assert.deepEqual(body.thinking,{type:'disabled'});assert.equal(body.max_tokens,4000);
  return deep(patch);
 });
 assert.equal(r.value.calls,2);assert(r.budgets[1]<=30000);
 assert.equal(JSON.stringify(r.value.result),JSON.stringify(parsedValid));
 assert.equal(JSON.stringify(mixed),before);
 assert.deepEqual(deepEvidenceErrors(r.value.result,raw,true,true,true),[]);
});
await check('patch allowlist rejects extra, non-English, duplicate and prototype paths atomically',async()=>{
 const before=JSON.stringify(englishPlan.result);
 const malicious=[
  {...patch,role:{zh:'REPLACED',en:'REPLACED'}},
  {translations:[...translations,{path:'role.en',en:'REPLACED'}]},
  {translations:[{...translations[0],path:'depth.workMap.tools.zh'},translations[1]]},
  {translations:[translations[0],translations[0]]},
  {translations:[{...translations[0],path:'__proto__.en'},translations[1]]},
  {translations:[{...translations[0],path:'constructor.prototype.en'},translations[1]]},
  JSON.parse('{"translations":[],"__proto__":{"polluted":true}}'),
  {translations:[{...translations[0],extra:'unexpected'},translations[1]]},
  {translations:[translations[0]]},
  {translations:[{...translations[0],en:''},translations[1]]},
  {translations:[{...translations[0],en:123},translations[1]]}
 ];
 for(const value of malicious){assert.equal(applyEnglishRepair(englishPlan,value),undefined);assert.equal(JSON.stringify(englishPlan.result),before);}
 assert.equal(Object.prototype.polluted,undefined);assert.equal(Object.prototype.en,undefined);
});
await check('a full regenerated answer is rejected in the English-patch slot without a third call',async()=>{
 await assert.rejects(()=>scenario(({index})=>deep(index===0?mixed:valid)),error=>{assert.equal(error.testRequests.length,2);return /invalid_after_one_repair/.test(error.message);});
});
await check('English patches are rechecked for untranslated prose rather than accepted by shape',async()=>{
 await assert.rejects(()=>scenario(({index})=>deep(index===0?mixed:{translations:[{...translations[0],en:'仍有中文'},translations[1]]})),error=>{assert.equal(error.testRequests.length,2);return /invalid_after_one_repair/.test(error.message);});
});
await check('a translated patch still undergoes source-aligned semantic boundary validation',async()=>{
 const bad=structuredClone(valid);bad.conditions.push({zh:'至少3年项目管理经验。',en:'Have 至少 3 years of project-management experience.'});const path=`conditions.${bad.conditions.length-1}.en`;
 await assert.rejects(()=>scenario(({index})=>deep(index===0?bad:{translations:[{path,en:'Have over 3 years of project-management experience.'}]}),{raw:raw+'要求3年以上项目管理经验。'}),error=>{assert.equal(error.testRequests.length,2);return /invalid_after_one_repair/.test(error.message);});
});
await check('a source error plus untranslated English takes ordinary contract repair, never a language-only patch',async()=>{
 const both=structuredClone(mixed);both.terms[0].quote='NOT A SOURCE QUOTE';
 const r=await scenario(({index,input})=>{if(index===0)return deep(both);assert(input.previousFinalJson);assert(!('fields' in input));return deep(valid);});corePreserved(r.value.result);
});
await check('the total deadline prevents an English patch when less than five seconds remain',async()=>{
 await assert.rejects(()=>scenario(({advance})=>{advance(238000);return deep(mixed);}),error=>{assert.equal(error.testRequests.length,1);return error.message==='analysis_deadline';});
});
await check('transport recovery cannot spend a third request on a later English-only failure',async()=>{
 await assert.rejects(()=>scenario(({index})=>{if(index===0)throw networkError();return deep(mixed);}),error=>{assert.equal(error.testRequests.length,2);return /invalid_after_one_repair/.test(error.message);});
});
await check('a valid English patch retains the original verified company candidate',async()=>{
 const r=await scenario(({index})=>deep(index===0?{...mixed,companyBrief:brief}:patch),{context});assert.equal(r.value.calls,2);corePreserved(r.value.result);assert.deepEqual(r.value.result.context.companyEvidence,brief.anchors);assert.equal(r.value.result.context.briefBasis,'model');
});
await check('a valid English patch cannot spend a third call repairing an invalid company candidate',async()=>{
 const r=await scenario(({index})=>deep(index===0?{...mixed,companyBrief:invalidBrief}:patch),{context});assert.equal(r.value.calls,2);sourcePreviewOnly(r.value.result);
});
await check('a failed English patch request never returns the untranslated core',async()=>{
 await assert.rejects(()=>scenario(({index})=>{if(index===0)return deep(mixed);throw networkError();}),error=>{assert.equal(error.testRequests.length,2);return /fetch failed/.test(error.message);});
});
await check('non-DeepSeek language patch also retains its shared deadline and complete validation',async()=>{
 const r=await scenario(({index,advance})=>{if(index===0){advance(40000);return open(mixed);}return open(patch);},{provider:'openai',model:'mock'});assert.equal(r.value.calls,2);assert.equal(r.budgets[1],12000);assert.equal(JSON.stringify(r.value.result),JSON.stringify(parsedValid));
});

await check('R5 quoted Chinese remains invalid even when a targeted patch changes the surrounding English',async()=>{
 const candidate=structuredClone(valid);candidate.questions[0]={zh:quotedEnglishRepair.questionZh,en:quotedEnglishRepair.initialEnglish};
 const source=raw+'\n'+quotedEnglishRepair.sourceSuffix;
 await assert.rejects(()=>scenario(({index,input})=>{
  if(index===0)return deep(candidate);
  assert.deepEqual(input.fields.map(field=>field.path),['questions.0.en']);
  return deep({translations:[{path:'questions.0.en',en:quotedEnglishRepair.failedEnglish}]});
 },{raw:source}),error=>{assert.equal(error.testRequests.length,2);return error.message==='model_contract_invalid_after_one_repair';});
});
await check('an English translation of the truncated quote is accepted without deleting the question or changing other fields',async()=>{
 const candidate=structuredClone(valid);candidate.questions[0]={zh:quotedEnglishRepair.questionZh,en:quotedEnglishRepair.initialEnglish};
 const source=raw+'\n'+quotedEnglishRepair.sourceSuffix;
 const r=await scenario(({index})=>deep(index===0?candidate:{translations:[{path:'questions.0.en',en:quotedEnglishRepair.correctedEnglish}]}),{raw:source});
 const expected=resultSchema.parse(candidate);expected.questions[0].en=quotedEnglishRepair.correctedEnglish;
 assert.equal(JSON.stringify(r.value.result),JSON.stringify(expected));
 assert.equal(r.value.calls,2);assert.deepEqual(deepEvidenceErrors(r.value.result,source,true,true,true),[]);
 assert(r.value.result.questions[0].en.includes("'AI model internship experi…'"));
 assert(r.value.result.questions[0].en.includes('required or advantageous?'));assert(r.value.result.questions[0].en.includes('What does PE mean in this team?'));
 assert.equal(r.value.result.questions[0].zh,quotedEnglishRepair.questionZh);
});

writeFileSync('model-recovery-checks.json',JSON.stringify({passed:true,count:checks.length,checks,paid_calls:0},null,2)+'\n');console.log(JSON.stringify({model_recovery_checks:checks.length,passed:true,paid_calls:0}));
