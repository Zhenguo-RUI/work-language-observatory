// Real API/database paths with a synthetic model response. No network or paid calls.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),require=createRequire(root+'/package.json'),ts=require('typescript'),{PGlite}=require('@electric-sql/pglite');
const out=resolve('.sites-runtime/analysis-cache-tests');mkdirSync(out,{recursive:true});writeFileSync(out+'/package.json','{"type":"commonjs"}');
const built=spawnSync(process.execPath,[resolve('node_modules/typescript/bin/tsc'),'--target','ES2022','--module','commonjs','--moduleResolution','node','--esModuleInterop','--skipLibCheck','--strict','--outDir',out,'lib/analysis-cache.ts','lib/analysis-contract.ts','lib/analysis-engine.ts','lib/reading-export.ts','lib/local-readings.ts','lib/database-core.ts','lib/database-schema.ts','lib/usage-contract.ts','lib/usage-diagnostics.ts'],{encoding:'utf8'});
if(built.status!==0){process.stderr.write(built.stdout+built.stderr);process.exit(1);}
const {ANALYSIS_CONTRACT_REVISION}=require(out+'/current-reading-contract.js');
const {ANALYSIS_VERSION}=require(out+'/analysis-prompt.js'),{canReuseAnalysis}=require(out+'/analysis-cache.js'),{resultSchema,modelOutputSchema}=require(out+'/analysis-contract.js'),engine=require(out+'/analysis-engine.js');
const {Database}=require(out+'/database-core.js'),{initializeSchema}=require(out+'/database-schema.js'),{readingMarkdown,readingBlocks}=require(out+'/reading-export.js'),{saveLocalReading,loadLocalReadings}=require(out+'/local-readings.js');
const db=new PGlite(),database=new Database(async()=>({execute:async q=>{const r=await db.query(q.text,q.values);return {rows:r.rows,rowCount:r.affectedRows??r.rows.length}},transaction:async qs=>db.transaction(async tx=>{const rs=[];for(const q of qs){const r=await tx.query(q.text,q.values);rs.push({rows:r.rows,rowCount:r.affectedRows??r.rows.length})}return rs})}));
await initializeSchema(database);await db.query("INSERT INTO settings VALUES ('initialized','public-v1','now'),('model','synthetic-model','now')");
const raw='测试岗位：协助整理行业资料并核对数据，撰写研究报告初稿，与团队讨论资料中的问题。要求能够细心检查来源，清晰写出研究过程。',title='Synthetic research role';
const draft=()=>engine.ruleDraft(raw,title,[]);
const context={company:{name:{zh:'测试公司',en:'Example company'},relationship:'employer',description:{zh:'仅测试',en:'Test only'},basis:'jd'},industry:{name:{zh:'研究',en:'Research'},description:{zh:'研究资料',en:'Research material'},basis:'jd'},implication:{zh:'仅测试',en:'Test only'},sources:[],status:'jd_only',evidence:[],notice:{zh:'仅测试',en:'Test only'},briefBasis:'model',lookup:{query:'测试公司',status:'matched',provider:'synthetic',searchedAt:'2026-11-08T00:00:00.000Z',matches:[]}};
let identity={userId:'github:cache-test',displayName:'Synthetic',email:''},modelCalls=0;
const mocks={
 './database':{databaseConfigured:()=>true,getDatabase:()=>database,ensureDatabase:async()=>{}},
 './identity':{getUser:async()=>identity},'./identity-policy':{authenticationConfigured:()=>true,githubAuthenticationConfigured:()=>true,isOperatorIdentity:()=>identity.userId==='operator:owner'},
 './operator-access':{operatorAccessConfigured:()=>true},'./request-origin':{sameRequestOrigin:()=>true},'./seed-data':{seeds:[],seedTranslations:[]},
 './model-client':{modelRuntime:()=>({provider:'deepseek',apiKey:'synthetic-key',model:'synthetic-model'})},
 './model-reading':{runModelReading:async()=>{modelCalls++;return {calls:1,result:{...draft(),context:structuredClone(context),analysisVersion:'untrusted-model-version',analysisContractRevision:'untrusted-contract-revision'}}}},
 './company-context':{enrichCompanyContext:async()=>structuredClone(context)},
 './jd-translation':{originalEnglish:async()=>undefined},'./public-demo':{PUBLIC_DEMO:{rawZh:'unrelated demo'}},
 './usage-store':{startUsageRun:async()=>null,finishUsageRun:async()=>{},UsageRateLimitError:class extends Error{}},
 './model-quota':{ModelBudgetError:class extends Error{}},
};
function moduleFor(p){if(p in mocks)return mocks[p];if(p.startsWith('@/data/'))return JSON.parse(readFileSync(root+'/'+p.slice(2),'utf8'));if(p.startsWith('./'))return require(out+'/'+p.slice(2)+'.js');return require(p);}
const compiled=ts.transpileModule(readFileSync('lib/observatory-server.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const mod={exports:{}};new Function('require','module','exports',compiled)(moduleFor,mod,mod.exports);const {handleApi}=mod.exports;
async function request(path,method='GET',value){const r=await handleApi(new Request('http://localhost/api/'+path,{method,headers:value?{'Content-Type':'application/json'}:{},body:value?JSON.stringify(value):undefined}),path.split('/'));assert(r.ok,`${path} HTTP ${r.status}`);return {body:await r.json(),status:r.status};}
async function seed({version=ANALYSIS_VERSION,contractRevision=ANALYSIS_CONTRACT_REVISION,kind='model',company='',companyContext,owner=identity.userId}={}){
 await db.query('TRUNCATE analyses CASCADE');modelCalls=0;
 const result={...draft(),...(version===null?{}:{analysisVersion:version}),...(contractRevision===null?{}:{analysisContractRevision:contractRevision}),...(companyContext?{context:structuredClone(companyContext)}:{})};
 const stamp='2026-11-01T00:00:00.000Z';
 await db.query("INSERT INTO analyses(id,owner_id,title,company,raw_text,source_url,text_hash,status,engine,result_json,revision,change_id,created_at,updated_at) VALUES($1,$2,$3,$4,$5,'',$6,'draft',$7,$8,1,'seed',$9,$9)",['cached',owner,title,company,raw,await engine.textHash(raw),kind,JSON.stringify(result),stamp]);
 return {id:'cached',title,company,raw_text:raw,source_url:'',text_hash:await engine.textHash(raw),status:'draft',engine:kind,result,revision:1,created_at:stamp,updated_at:stamp};
}
const create=(useModel=true,company='')=>request('analyses','POST',{title,company,rawText:raw,sourceUrl:'',useModel});
const checks=[];async function check(name,fn){await fn();checks.push(name);}
await check('current model result is reused by the owner without a model call',async()=>{const a=await seed();assert(canReuseAnalysis(a,true,''));const {body,status}=await create();assert.equal(status,200);assert.equal(body.reused,true);assert.equal(body.analysis.id,'cached');assert.equal(body.analysis.result.analysisVersion,ANALYSIS_VERSION);assert.equal(modelCalls,0);});
await check('an obsolete model version regenerates and receives a server version stamp',async()=>{const a=await seed({version:'work-language-v10'});assert(!canReuseAnalysis(a,true,''));const {body}=await create();assert.notEqual(body.analysis.id,'cached');assert.equal(body.analysis.result.analysisVersion,ANALYSIS_VERSION);assert.equal(modelCalls,1);assert(!body.reused);assert.equal((await request('analyses/cached')).body.analysis.result.analysisVersion,'work-language-v10');});
await check('unversioned old model results regenerate but remain readable',async()=>{const a=await seed({version:null});assert(!canReuseAnalysis(a,true,''));assert(resultSchema.safeParse(a.result).success);const {body}=await create();assert.equal(modelCalls,1);assert.equal(body.analysis.result.analysisVersion,ANALYSIS_VERSION);assert.equal((await request('analyses/cached')).body.analysis.result.analysisVersion,undefined);});
await check('same-version results without the current contract revision regenerate but remain readable',async()=>{for(const contractRevision of [null,'prior-contract','numbered-duty-scope-v1']){const a=await seed({contractRevision});assert(!canReuseAnalysis(a,true,''));assert(resultSchema.safeParse(a.result).success);const {body}=await create();assert.equal(modelCalls,1);assert.equal(body.analysis.result.analysisVersion,ANALYSIS_VERSION);assert.equal(body.analysis.result.analysisContractRevision,ANALYSIS_CONTRACT_REVISION);assert.equal((await request('analyses/cached')).body.analysis.result.analysisContractRevision,contractRevision??undefined);}});
await check('rules and curated records cannot satisfy a model request even with a current marker',async()=>{for(const kind of ['rules','curated']){const a=await seed({kind});assert(!canReuseAnalysis(a,true,''));const {body}=await create();assert.equal(modelCalls,1);assert.equal(body.analysis.engine,'model');assert.notEqual(body.analysis.id,'cached');}});
await check('company matching and model brief requirements still guard reuse',async()=>{
 for(const changed of [{...context,lookup:{...context.lookup,status:'ambiguous'}},{...context,briefBasis:'source'},undefined]){const a=await seed({company:'测试公司',companyContext:changed});assert(!canReuseAnalysis(a,true,'测试公司'));const {body}=await create(true,'测试公司');assert.equal(modelCalls,1);assert(!body.reused);}
 const a=await seed({company:'测试公司',companyContext:context});assert(canReuseAnalysis(a,true,'测试公司'));assert.equal((await create(true,'测试公司')).body.reused,true);assert.equal(modelCalls,0);
});
await check('non-model requests retain prior reuse semantics and owner isolation',async()=>{
 const a=await seed({kind:'rules',version:null});assert(canReuseAnalysis(a,false,''));assert.equal((await create(false)).body.reused,true);assert.equal(modelCalls,0);
 await seed({owner:'github:someone-else'});const {body}=await create();assert.notEqual(body.analysis.id,'cached');assert.equal(modelCalls,1);
});
await check('model schema and client edits cannot manufacture a current generation version',async()=>{
 assert(!('analysisVersion' in modelOutputSchema.properties));assert(!('analysisContractRevision' in modelOutputSchema.properties));assert(readFileSync('lib/model-reading.ts','utf8').includes('sourceTranslation:true,analysisVersion:true'));
 identity={...identity,userId:'operator:owner'};const a=await seed({version:'work-language-v10',contractRevision:null});
 const {body}=await request('analyses/cached','PATCH',{revision:1,result:{...a.result,analysisVersion:ANALYSIS_VERSION,analysisContractRevision:ANALYSIS_CONTRACT_REVISION}});assert.equal(body.analysis.result.analysisVersion,'work-language-v10');assert.equal(body.analysis.result.analysisContractRevision,undefined);
 identity={...identity,userId:'github:cache-test'};
});
await check('version survives reader projection, persistence, local history and JSON export without altering prose exports',async()=>{
 await seed();const a=(await request('analyses/cached')).body.analysis;assert.equal(a.result.analysisVersion,ANALYSIS_VERSION);assert.deepEqual(a.result.comparisons,[]);assert.equal(resultSchema.parse(a.result).analysisVersion,ANALYSIS_VERSION);
 const exported=(await request('analyses/cached/export')).body;assert.equal(exported.result.analysisVersion,ANALYSIS_VERSION);assert.equal(exported.result.analysisContractRevision,ANALYSIS_CONTRACT_REVISION);
 const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
 await saveLocalReading(a);assert.equal((await loadLocalReadings())[0].result.analysisVersion,ANALYSIS_VERSION);assert.equal((await loadLocalReadings())[0].result.analysisContractRevision,ANALYSIS_CONTRACT_REVISION);
 const legacy=structuredClone(a);delete legacy.result.analysisVersion;delete legacy.result.analysisContractRevision;
 for(const lang of ['zh','en']){assert.equal(readingMarkdown(a,lang),readingMarkdown(legacy,lang));assert.deepEqual(readingBlocks(a,lang),readingBlocks(legacy,lang));}
});
await db.close();writeFileSync('analysis-cache-checks.json',JSON.stringify({passed:true,count:checks.length,checks,paid_calls:0,database:'in-memory Postgres'},null,2)+'\n');console.log(JSON.stringify({passed:true,analysis_cache_checks:checks.length,paid_calls:0}));
