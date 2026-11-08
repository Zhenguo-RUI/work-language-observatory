// Explicit live evaluation only. No research-corpus input; at most two workers.
// node scripts/eval-jd-versions.mjs --version baseline-v11 --limit 1
// Resume with no --limit. Existing outputs are never overwritten.
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {existsSync,mkdirSync,readFileSync,writeFileSync,cpSync,symlinkSync,readdirSync,lstatSync,unlinkSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const version=arg('--version','baseline-v11');
if(!/^[a-z0-9-]+$/.test(version))throw Error('Invalid version');
const base=resolve('private/jd-eval'),out=resolve(base,version),compiled=resolve(base,'compiled-v11');
const hash=s=>createHash('sha256').update(s).digest('hex');
const setBytes=readFileSync(resolve(base,'set-v1.jsonl'));
const require=createRequire(import.meta.url);
const cases=setBytes.toString().trim().split('\n').map(s=>JSON.parse(s));
if(cases.length!==20||cases.some(x=>!x.source_note.startsWith('合成')))throw Error('This runner accepts only the frozen synthetic set');
const families=['technical_rd','product','operations','sales_customer','organizational_support','production_manufacturing','everyday_services','other'];
for(const split of ['dev','holdout']){
 const group=cases.filter(c=>c.split===split);
 if(group.length!==10||families.some(f=>!group.some(c=>c.family===f)))throw Error('Split/family coverage missing');
 for(const [tag,n]of [['sparse',2],['english',1],['contradiction',1],['nonoffice',2]])if(group.filter(c=>c.difficulty.includes(tag)).length<n)throw Error('Difficulty coverage missing');
}
const promptFile=arg('--instructions',null);
const moduleFile=arg('--instructions-module',null);
const candidateModule=moduleFile?await import(pathToFileURL(resolve(moduleFile))):null;
if(version!=='baseline-v11'){
 if((!promptFile&&!moduleFile)||cases.some(x=>!existsSync(resolve(base,'baseline-v11',x.id+'.json'))))throw Error('Complete baseline required before candidate');
}
mkdirSync(out,{recursive:true});mkdirSync(compiled,{recursive:true});
writeFileSync(resolve(compiled,'package.json'),'{"type":"commonjs"}');
const dependencies=[resolve('node_modules'),'/Users/rzg/Documents/Codex/2026-10-23/ni/observatory-structure-v5/node_modules','/private/tmp/wlo-vercel-20261104/node_modules'].find(p=>existsSync(resolve(p,'zod/package.json'))&&existsSync(resolve(p,'typescript/lib/typescript.js')));
if(!dependencies)throw Error('Complete local TypeScript/Zod dependencies unavailable');
const depLink=resolve(base,'node_modules');
if(existsSync(depLink)&&lstatSync(depLink).isSymbolicLink())unlinkSync(depLink);
if(!existsSync(depLink))symlinkSync(dependencies,depLink,'dir');
if(!existsSync(resolve(compiled,'model-reading.js'))){
 const snapshot=resolve(base,'source-snapshot');mkdirSync(snapshot,{recursive:true});
 cpSync(resolve('lib'),resolve(snapshot,'lib'),{recursive:true});
 const ts=require(resolve(dependencies,'typescript/lib/typescript.js'));
 // Runtime cache contains transpiler API but not tsc executable. Keep a frozen
 // source snapshot, transpile without claiming a new typecheck.
 for(const name of readdirSync(resolve(snapshot,'lib'))){
  if(!name.endsWith('.ts')||name.endsWith('.d.ts'))continue;
  const compiledText=ts.transpileModule(readFileSync(resolve(snapshot,'lib',name),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
  writeFileSync(resolve(compiled,name.replace(/\.ts$/,'.js')),compiledText);
 }
}
const prompt=require(resolve(compiled,'analysis-prompt.js'));
if(prompt.ANALYSIS_VERSION!=='work-language-v11')throw Error('Expected v11 baseline');
if(promptFile)prompt.ANALYSIS_INSTRUCTIONS=readFileSync(promptFile,'utf8');
if(candidateModule)prompt.ANALYSIS_INSTRUCTIONS=candidateModule.createBase(prompt.ANALYSIS_INSTRUCTIONS);
const {runModelReading}=require(resolve(compiled,'model-reading.js'));
const {modelRuntime}=require(resolve(compiled,'model-client.js'));
const {resultSchema,deepEvidenceErrors}=require(resolve(compiled,'analysis-contract.js'));
const {evidenceErrors}=require(resolve(compiled,'analysis-engine.js'));
const settings={...process.env};
// Read existing runtime env in place. Never print/copy credentials.
for(const file of ['/private/tmp/wlo-vercel-20261104/.env.local','/private/tmp/wlo-vercel-20261104/.env.development.local']){
 if(!existsSync(file))continue;
 for(const line of readFileSync(file,'utf8').split(/\r?\n/)){
  const m=line.match(/^([A-Z_]+)\s*=\s*(.*)$/);if(m&&!settings[m[1]])settings[m[1]]=m[2].replace(/^(["'])(.*)\1$/,'$2');
 }
}
const runtime=modelRuntime(settings);
if(runtime.provider!=='deepseek'||!runtime.apiKey||!runtime.model)throw Error('Existing DeepSeek runtime unavailable');
const manifest={version,model:runtime.model,provider:runtime.provider,set_sha256:hash(setBytes),prompt_sha256:hash(prompt.ANALYSIS_INSTRUCTIONS),
 source_prompt_sha256:hash(readFileSync('lib/analysis-prompt.ts')),compiled_reader_sha256:hash(readFileSync(resolve(compiled,'model-reading.js'))),
 created_at:new Date().toISOString(),git_head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 synthetic_n:20,real_n:0,concurrency:2,temperature:null,temperature_note:'Existing production default, not explicitly sent',
 reasoning:'Existing production first-call high and bounded recovery settings',cost_usd:null,cost_note:'Provider billing not independently queried; token usage recorded where returned.'};
if(moduleFile)manifest.candidate_module_sha256=hash(readFileSync(moduleFile));
const mfile=resolve(out,'manifest.json');
if(existsSync(mfile)){
 const old=JSON.parse(readFileSync(mfile,'utf8'));
 for(const k of ['model','set_sha256','prompt_sha256','compiled_reader_sha256','candidate_module_sha256'])if(old[k]!==manifest[k])throw Error('Frozen run identity mismatch');
}else writeFileSync(mfile,JSON.stringify(manifest,null,2)+'\n');
function checks(result,raw){
 const parse=resultSchema.safeParse(result);if(!parse.success)return {json_object:!!result,schema:false,quote_exact:false,bilingual:false,all_contract:false,error_fields:parse.error.issues.map(x=>x.path.join('.'))};
 const errors=[...evidenceErrors(result,raw),...deepEvidenceErrors(result,raw,true,true,true)];
 const bilingual=[];const quote=[];let authoredZh=0;const style=[];
 function walk(v,path=''){
  if(!v||typeof v!=='object')return;
  if(typeof v.zh==='string'&&typeof v.en==='string'){
   authoredZh+=Array.from(v.zh).length;
   if((v.zh.trim()&&!v.en.trim())||(v.en.trim()&&!v.zh.trim())||/[\u3400-\u9fff]/u.test(v.en))bilingual.push(path);
   if(/关键是[：:]|可以问[：:]|In short:|本质上|综上所述|赋能|颗粒度/u.test(v.zh+' '+v.en))style.push(path);
  }
  for(const[k,x]of Object.entries(v)){
   if(k==='quote'&&typeof x==='string'&&x&&!raw.includes(x))quote.push(path+'.quote');
   if((k==='quotes'||k==='sociologyQuotes')&&Array.isArray(x))for(const q of x)if(q&&!raw.includes(q))quote.push(path+'.'+k);
   if(Array.isArray(x))x.forEach((y,i)=>walk(y,path+'.'+k+'.'+i));else if(x&&typeof x==='object')walk(x,path+'.'+k);
  }
 }
 walk(result);
 return {json_object:true,schema:true,quote_exact:!quote.length,bilingual:!bilingual.length,all_contract:!errors.length,
  authored_zh_characters:authoredZh,sociology_zh_characters:Array.from(result.sociology.zh).length,
  sociology_within_limit:Array.from(result.sociology.zh).length<=250,
  style_flag_fields:style,bilingual_error_fields:bilingual,quote_error_fields:quote,
  error_fields:errors.map(s=>s.split(':')[0]).slice(0,20),private_errors:errors};
}
async function one(item){
 const file=resolve(out,item.id+'.json');if(existsSync(file))return;
 const calls=[],diagnostics=[],pending=[];const started=Date.now();
 const selected=candidateModule?candidateModule.instructionsFor(prompt.ANALYSIS_INSTRUCTIONS,item.title,item.raw):{instructions:prompt.ANALYSIS_INSTRUCTIONS,domain:null};
 const request=async(url,init)=>{
  if(candidateModule&&typeof init?.body==='string'){
   const body=JSON.parse(init.body);
   for(const m of body.messages||[])if(m.role==='system'&&m.content.startsWith(prompt.ANALYSIS_INSTRUCTIONS))m.content=selected.instructions+m.content.slice(prompt.ANALYSIS_INSTRUCTIONS.length);
   init={...init,body:JSON.stringify(body)};
  }
  const ordinal=calls.length+1;const call={ordinal,http_status:null,usage:null,final_content:''};calls.push(call);
  const response=await fetch(url,init);call.http_status=response.status;
  if(response.ok){
   const clone=response.clone();pending.push((async()=>{
    try{
     const body=await clone.text();
     if(response.headers.get('content-type')?.includes('text/event-stream')){
      for(const line of body.split(/\r?\n/)){if(!line.startsWith('data:'))continue;const data=line.slice(5).trim();if(data==='[DONE]')continue;
       try{const v=JSON.parse(data);if(v.usage)call.usage=v.usage;const content=v.choices?.[0]?.delta?.content;if(typeof content==='string')call.final_content+=content;}catch{}}
     }else{const v=JSON.parse(body);call.usage=v.usage||null;call.final_content=v.choices?.[0]?.message?.content||'';}
    }catch{call.capture_incomplete=true;}
   })());
  }return response;
 };
 let result=null,error=null;
 try{result=(await runModelReading({...runtime,raw:item.raw,title:item.title,comparators:[],methodNote:'',request,onDiagnostics:d=>diagnostics.push(d)})).result;}
 catch(e){error=e instanceof Error?e.message:'unknown_failure';}
 await Promise.allSettled(pending);
 let last=result;if(!last)for(const c of calls){try{last=JSON.parse(c.final_content);}catch{}}
 const report={id:item.id,split:item.split,family:item.family,difficulty:item.difficulty,version,
   selected_domain:selected.domain,elapsed_ms:Date.now()-started,call_count:calls.length,retries:Math.max(0,calls.length-1),accepted:!!result,error,
   checks:checks(last,item.raw),result,last_provider_json:result?null:last,calls,diagnostics};
 writeFileSync(file,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({id:item.id,version,accepted:report.accepted,error,elapsed_ms:report.elapsed_ms,calls:calls.length,usage_available:calls.some(c=>!!c.usage)}));
}
const split=arg('--split',null);const limit=Number(arg('--limit',20));
const todo=cases.filter(c=>(!split||c.split===split)&&!existsSync(resolve(out,c.id+'.json'))).slice(0,limit);
let next=0;await Promise.all(Array.from({length:Math.min(2,todo.length)},async()=>{while(next<todo.length){if(existsSync(resolve(base,'STOP')))break;const item=todo[next++];await one(item);}}));
const done=cases.filter(c=>existsSync(resolve(out,c.id+'.json')));
console.log(JSON.stringify({version,completed:done.length,planned:20,model:runtime.model}));
