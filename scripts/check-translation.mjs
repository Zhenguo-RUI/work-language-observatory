import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {resolve} from 'node:path';
const out=resolve('.sites-runtime/translation-tests');mkdirSync(out,{recursive:true});writeFileSync(out+'/package.json','{"type":"commonjs"}');
const compiled=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','--target','ES2022','--module','commonjs','--moduleResolution','node','--esModuleInterop','--skipLibCheck','--strict','--jsx','react-jsx','--outDir',out,'lib/jd-translation.ts','lib/browser-translation.ts','lib/reading-export.ts','components/source-translation.tsx'],{encoding:'utf8'});
if(compiled.status!==0){console.error(compiled.stdout+compiled.stderr);process.exit(1);}
const require=createRequire(import.meta.url);require.extensions['.css']=()=>{};copyFileSync('components/source-translation.css',out+'/components/source-translation.css');
const {sourceSegments,sourceFingerprint,translationErrors,translateWithModel,originalEnglish}=require(out+'/lib/jd-translation.js');
const {translateInBrowser,browserTranslationAvailable}=require(out+'/lib/browser-translation.js');
const {SourceTranslationPanel,sourceTranslationMatches}=require(out+'/components/source-translation.js');
const {readingMarkdown}=require(out+'/lib/reading-export.js');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const checks=[];async function check(name,fn){await fn();checks.push({name,passed:true});}
const title='数据分析实习生',raw='职责：核对数据。\n每周5天，六个月优先。\n投递：demo@example.test';
const lines=['Duties: reconcile data.','5 days per week; six months preferred.','Apply: demo@example.test'];
const correct={titleEn:'Data Analyst Intern',paragraphs:sourceSegments(raw).map((source,i)=>({source,en:lines[i]})),basis:'model',sourceHash:await sourceFingerprint(title,raw)};
await check('complete title and all source paragraphs are validated',()=>assert.deepEqual(translationErrors(correct,title,raw),[]));
await check('title changes invalidate the source fingerprint',async()=>assert.notEqual(await sourceFingerprint(title,raw),await sourceFingerprint('另一个岗位',raw)));
await check('a missing paragraph cannot pass as complete',()=>assert(translationErrors({...correct,paragraphs:correct.paragraphs.slice(0,-1)},title,raw).length));
await check('reordered or rewritten source cannot pass',()=>assert(translationErrors({...correct,paragraphs:[...correct.paragraphs].reverse()},title,raw).length));
await check('an untranslated title is rejected',()=>assert(translationErrors({...correct,titleEn:title},title,raw).length));
await check('changed attendance number is rejected',()=>{const r=structuredClone(correct);r.paragraphs[1].en='4 days per week; six months preferred.';assert(translationErrors(r,title,raw).length);});
await check('a larger number containing the original digit is rejected',()=>{const r=structuredClone(correct);r.paragraphs[1].en='15 days per week; six months preferred.';assert(translationErrors(r,title,raw).length);});
await check('repeated numbers must retain their counts',()=>{const source='每周5天，每天5小时';assert(translationErrors({titleEn:'Analyst',paragraphs:[{source,en:'5 days each week; hours unspecified.'}]},'分析师',source).length);});
await check('long source splitting preserves surrogate pairs',()=>{const raw='甲'.repeat(1199)+'😀'+'乙'.repeat(100);const parts=sourceSegments(raw);assert.equal(parts.join(''),raw);assert(parts.every(p=>!/[\\uD800-\\uDBFF]$/.test(p)));});
await check('omitted contact email is rejected',()=>{const r=structuredClone(correct);r.paragraphs[2].en='Apply by email.';assert(translationErrors(r,title,raw).length);});
await check('long single-line JDs remain fully covered by UI pairing',()=>{const long='职责：核对数据并记录结果。'.repeat(150),value={...correct,paragraphs:sourceSegments(long).map(source=>({source,en:'A translated source segment.'}))};assert(sourceTranslationMatches(long,value));});
let calls=0;const payload={titleEn:correct.titleEn,paragraphs:lines.map((en,id)=>({id,en}))};
const request=async(_url,init)=>{calls++;const b=JSON.parse(init.body);assert.equal(b.store,false);assert.equal(JSON.parse(b.input).segments.length,3);return Response.json({output:[{content:[{type:'output_text',text:JSON.stringify(payload)}]}]});};
await check('model adapter returns a full translation in one mocked call',async()=>{assert.deepEqual(await translateWithModel({title,raw,apiKey:'test-only',model:'mock',request}),correct);assert.equal(calls,1);});
await check('model truncation is rejected rather than shown as complete',async()=>assert.rejects(()=>translateWithModel({title,raw,apiKey:'test-only',model:'mock',request:async()=>Response.json({status:'incomplete'})}),/incomplete/));
await check('DeepSeek translates the title and every segment with the same fidelity checks',async()=>{
const translated=await translateWithModel({title,raw,apiKey:'test-only',model:'deepseek-flash',provider:'deepseek',request:async(url,init)=>{const b=JSON.parse(init.body);assert.equal(url,'https://api.deepseek.com/chat/completions');assert.equal(b.thinking.type,'disabled');assert.equal(b.response_format.type,'json_object');assert.equal(JSON.parse(b.messages[1].content).segments.length,3);return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(payload)}}]});}});assert.deepEqual(translated,correct);
});
await check('no browser translator is reported as unavailable',async()=>assert.equal(await browserTranslationAvailable(undefined),false));
let destroyed=false;const factory={availability:async()=> 'available',create:async()=>({translate:async s=>s===title?correct.titleEn:lines[sourceSegments(raw).indexOf(s)],destroy:()=>{destroyed=true;}})};
await check('browser translation covers title and every paragraph without a server',async()=>{const t=await translateInBrowser(title,raw,undefined,factory);assert.equal(t.basis,'browser');assert.equal(t.paragraphs.length,3);assert(destroyed);});
await check('already-English input needs no translator',async()=>assert.equal((await originalEnglish('Analyst','Review data.')).basis,'original'));
const markup=renderToStaticMarkup(React.createElement(SourceTranslationPanel,{rawText:raw,title,translation:correct,lang:'en',selectedQuote:'每周5天',onQuote:()=>{}}));
await check('reader renders English title, full JD and original evidence',()=>{assert(markup.includes('Data Analyst Intern'));for(const line of lines)assert(markup.includes(line));assert(markup.includes('<mark>每周5天</mark>'));});
const seeds=JSON.parse(readFileSync('data/seed-translations.json','utf8'));let paragraphs=0;
for(const s of seeds){await check(`${s.id}: complete prepared translation`,async()=>{assert.deepEqual(translationErrors(s,s.sourceTitle,s.sourceRaw),[]);assert.equal(s.sourceHash,await sourceFingerprint(s.sourceTitle,s.sourceRaw));assert(sourceTranslationMatches(s.sourceRaw,s));paragraphs+=s.paragraphs.length;});}
const stub={id:'x',title,raw_text:raw,result:{headline:{zh:'读法',en:'Reading'},role:{zh:'说明',en:'Interpretation'},terms:[],sociology:{zh:'分析',en:'Analysis'},conditions:[],questions:[],gaps:[],comparisons:[],sourceTranslation:correct},engine:'rules',revision:1,updated_at:'test',source_url:''};
await check('Markdown includes translated title, full English JD and original',()=>{const md=readingMarkdown(stub,'en');assert(md.startsWith('# Data Analyst Intern'));assert(md.includes(lines.join('\n\n')));assert(md.includes(raw));});
writeFileSync('translation-checks.json',JSON.stringify({count:checks.length,checks,all_passed:true,prepared_cases:seeds.length,prepared_paragraphs:paragraphs,live_provider_tested:false,native_browser_translation_tested:false,scope:'Structural, content-preservation, mocked adapters and rendered component checks; not a human translation-quality score'},null,2));console.log(JSON.stringify({translation_checks:checks.length,prepared_cases:seeds.length,prepared_paragraphs:paragraphs,all_passed:true}));
