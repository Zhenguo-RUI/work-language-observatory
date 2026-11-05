// Optional live test: makes at most two analysis calls and one translation call.
// Only a synthetic JD is sent. Never run this in automatic CI.
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const settings={...process.env};
for(const configFile of ['.env.local','.dev.vars']){
 if(!existsSync(configFile))continue;
  for(const line of readFileSync(configFile,'utf8').split(/\r?\n/)){
    const match=line.match(/^([A-Z_]+)\s*=\s*(.*)$/);
    if(match&&!settings[match[1]])settings[match[1]]=match[2].replace(/^(["'])(.*)\1$/,'$2');
  }
}
const out=resolve('.sites-runtime/live-smoke');mkdirSync(out,{recursive:true});
writeFileSync(resolve(out,'package.json'),'{"type":"commonjs"}');
const compiled=spawnSync(process.execPath,[resolve('node_modules/typescript/bin/tsc'),'--target','ES2022','--module','commonjs','--moduleResolution','node','--esModuleInterop','--skipLibCheck','--strict','--outDir',out,'lib/model-reading.ts','lib/jd-translation.ts','lib/public-demo.ts'],{encoding:'utf8'});
if(compiled.status!==0){console.error(compiled.stdout+compiled.stderr);process.exit(1);}
const require=createRequire(import.meta.url);
const {modelRuntime}=require(resolve(out,'model-client.js'));
const {runModelReading}=require(resolve(out,'model-reading.js'));
const {translateWithModel}=require(resolve(out,'jd-translation.js'));
const {PUBLIC_DEMO}=require(resolve(out,'public-demo.js'));
const runtime=modelRuntime(settings);
if(!runtime.apiKey||!runtime.model)throw new Error('Set server-side provider key and model before running this optional live test.');
let calls=0;const usage=[];
const request=async(...args)=>{
  calls++;
  const response=await fetch(...args);
  if(response.ok&&response.headers.get("content-type")?.includes("application/json")){const body=await response.clone().json();if(body.usage)usage.push(body.usage);}
  return response;
};
const started=Date.now();
try{
  const reading=await runModelReading({...runtime,raw:PUBLIC_DEMO.rawZh,title:PUBLIC_DEMO.titleZh,comparators:[],methodNote:'',request});
  const translation=await translateWithModel({...runtime,raw:PUBLIC_DEMO.rawZh,title:PUBLIC_DEMO.titleZh,request});
  const report={provider:runtime.provider,model:runtime.model,synthetic_input:true,analysis_contract_passed:true,analysis_calls:reading.calls,term_count:reading.result.terms.length,translation_contract_passed:true,translated_segments:translation.paragraphs.length,total_calls:calls,elapsed_ms:Date.now()-started,usage,human_accuracy_evaluated:false};
  writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  writeFileSync(resolve(out,'synthetic-result.json'),JSON.stringify({result:reading.result,translation},null,2)+'\n');
  console.log(JSON.stringify(report));
}catch(error){
  console.error(JSON.stringify({provider:runtime.provider,total_calls:calls,error:error instanceof Error?error.message:'live_test_failed',elapsed_ms:Date.now()-started}));
  process.exitCode=1;
}
