import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve,dirname,extname} from 'node:path';
import ts from 'typescript';
import {renderToStaticMarkup} from 'react-dom/server';
import React from 'react';
const root=process.cwd(),require=createRequire(import.meta.url),read=f=>JSON.parse(readFileSync(f,'utf8'));
const data=read('data/public-study.json'),statFile=read('research/aggregates/stats.json'),stats=statFile.stats??statFile,counts=read('research/aggregates/term_counts.json'),config=read('research/config/terms.yaml');
const checks=[];function check(name,fn){fn();checks.push({name,passed:true});}
const cache=new Map();
function local(file){
 const path=resolve(root,file);if(cache.has(path))return cache.get(path).exports;
 if(extname(path)==='.json')return read(path);
 const compiledModule={exports:{}};cache.set(path,compiledModule);
 const output=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const dependency=p=>{
  if(p.endsWith('.css'))return {};
  if(p==='@/lib/usage-client')return {trackUsage:()=>{throw new Error('SSR must not send telemetry')}};
  if(p.startsWith('.')||p.startsWith('@/')){
   const stem=p.startsWith('@/')?resolve(root,p.slice(2)):resolve(dirname(path),p);
   for(const suffix of ['', '.ts','.tsx','.json'])if(existsSync(stem+suffix))return local(stem+suffix);
   throw new Error('Unresolved local module '+p);
  }
  return require(p);
 };
 new Function('require','module','exports',output)(dependency,compiledModule,compiledModule.exports);return compiledModule.exports;
}
const {fillStats}=local('lib/research-stats.ts');
const stat=key=>{assert(Object.hasOwn(stats,key),`Missing stat ${key}`);return stats[key]};
function walkBi(value,visit,path='$'){
 if(!value||typeof value!=='object')return;
 if(typeof value.zh==='string'&&typeof value.en==='string')visit(value,path);
 for(const [key,child]of Object.entries(value))if(key!=='zh'&&key!=='en')walkBi(child,visit,`${path}.${key}`);
}
const plain=html=>html.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#x27;|&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ');
const contains=(html,text)=>assert(plain(html).includes(text.replace(/\s+/g,' ')),`Missing rendered content: ${text.slice(0,80)}`);
check('the fixed twenty terms each retain three bilingual AI-reviewed examples',()=>{
 assert.equal(data.keywords.length,stat('corpus.dictionary_terms').value);assert.equal(data.keywords.length,21);assert.equal(data.keywords.find(k=>k.term==='自驱').exploratory,true);assert(data.keywords.every((k,i)=>!i||data.keywords[i-1].documents>=k.documents));assert.deepEqual(new Set(data.keywords.map(k=>k.term)),new Set(config.terms.map(k=>k.term)));
 const {keywordContexts}=local('lib/keyword-contexts.ts');for(const k of data.keywords){assert.equal(k.examples.length,3);assert(!keywordContexts[k.term].summary);assert(keywordContexts[k.term].short.zh.length<=40);assert.equal(keywordContexts[k.term].examples.length,3);for(const e of keywordContexts[k.term].examples)assert.equal(e.reviewStatus,k.exploratory?'model_draft':'ai_reviewed');for(const e of k.examples){assert.equal(e.reviewStatus,k.exploratory?'model_draft':'ai_reviewed');for(const key of ['role','question'])assert(e[key]?.zh&&e[key]?.en,`${k.term}.${key}`);}}
});
check('bilingual copy is complete and renders every numeric placeholder',()=>{
 let fields=0;walkBi(data,(x,path)=>{fields++;assert(x.zh.trim()&&x.en.trim(),path);for(const lang of ['zh','en']){const rendered=fillStats(x[lang],lang);assert(!rendered.includes('{{stat:'),path);if(lang==='en')assert(!/[\u3400-\u9fff]/u.test(rendered),path);}});assert(fields>100);
});
check('corpus and term counts share explicit advertisement denominators',()=>{
 const n=stat('corpus.n').value;assert.equal(n,counts.corpus_ads);assert.equal(data.methods.corpusN,n);assert.equal(Object.values(counts.by_source).reduce((a,b)=>a+b,0),n);
 for(const k of data.keywords){const t=counts.terms.find(t=>t.term===k.term);assert(t);const s=stat(`term.${k.term}.ads`);assert.equal(s.value,t.literal_ads);assert.equal(k.documents,s.value);assert.equal(s.n,n);assert(s.value>=0&&s.value<=n);assert.equal(Object.values(t.by_source).reduce((a,b)=>a+b.literal_ads,0),t.literal_ads);assert(t.candidate_kept_ads<=t.literal_ads);assert.equal(t.candidate_kept_ads+t.excluded_only_ads,t.literal_ads);}
});
check('unreviewed semantics, occupation labels and human precision are not published as measured proportions',()=>{
 for(const [key,s]of Object.entries(stats)){if(/^(?:h[123]\.|sense\.|llm\.)|^term\..*\.(?:precision|k_correct|n_checked)$/.test(key))assert.equal(s.value,null,`Unvalidated estimate ${key}`);}
 for(const k of data.keywords){assert.equal(k.senses?.length??0,0);assert.equal(k.occupations?.length??0,0);assert.equal(k.collocates?.length??0,0);}
 for(const tab of data.report.crossTabs||[]){assert(tab.statKeys?.length,'Cross-tabs need current stat keys');for(const key of tab.statKeys)stat(key);assert.equal(tab.cells.flat().reduce((a,b)=>a+b,0),stat('corpus.n').value);}
});
check('every cited stat has reproducible metadata and derived copies agree',()=>{
 for(const [key,s]of Object.entries(stats)){assert('value'in s&&typeof s.unit==='string'&&typeof s.method==='string'&&typeof s.source==='string'&&typeof s.script==='string',key);assert(!s.source.includes('private/'),key);}
 assert.deepEqual(read('public/research/stats.json'),statFile);
});
check('public content contains no raw records, contact details or private identities',()=>{
 const publicFiles=readdirSync('public/research').filter(f=>/\.(?:json|md)$/.test(f)),serialized=JSON.stringify({data,stats})+'\n'+publicFiles.map(f=>readFileSync('public/research/'+f,'utf8')).join('\n');
 assert(!/51J-\d|GH-BOSS-\d|GH-LIEPIN-\d|sk-[a-z0-9]{20}|[\w.+-]+@[\w.-]+\.[A-Za-z]{2}/i.test(serialized));
 assert(!/"(?:raw_text|body|employer|source_job_id|record_id|phone|email)"\s*:/.test(serialized));
 assert(!/\/Users\//.test(serialized));
});
const {KeywordAtlas}=local('components/keyword-atlas.tsx'),{ResearchReport}=local('components/research-report.tsx');
const researchModule=local('lib/research-observations.ts'),observations=researchModule.researchObservations??data.report.findings,researchTitle=researchModule.researchFraming?.title??data.report.title;
check('all twenty-one keyword pages render their three roles and questions in both languages',()=>{
 for(const lang of ['zh','en'])for(const k of data.keywords){const html=renderToStaticMarkup(React.createElement(KeywordAtlas,{data,lang,initialTerm:k.term}));assert(!html.includes('{{stat:'));for(const e of k.examples){contains(html,fillStats(e.role[lang],lang));contains(html,fillStats(e.question[lang],lang));}assert(/model[- ]draft|model-generated|drafted by a model|AI[- ]review|AI editorial review|AI编辑复核|AI 复核|模型草稿|模型起草/i.test(plain(html)),'Missing visible review provenance');}
});
check('research SSR renders hypotheses, validation status, references and stat-backed findings',()=>{
 for(const lang of ['zh','en']){const html=renderToStaticMarkup(React.createElement(ResearchReport,{data,lang}));contains(html,fillStats(researchTitle[lang],lang));assert(!html.includes('{{stat:'));assert(!html.includes('作者与分工')&&!html.includes('research-authorship'));for(const h of ['H1','H2','H3'])assert(html.includes(h));for(const ref of data.report.bibliography)contains(html,ref.author);for(const f of observations){const title=f.headline||f.title;if(title)contains(html,fillStats(title[lang],lang));if(f.numbers)contains(html,fillStats(f.numbers[lang],lang));for(const key of f.statKeys||[])stat(key);for(const row of f.rows||[])for(const field of ['rateKey','countKey','denominatorKey'])stat(row[field]);}assert(/pending|not yet|unvalidated|待|尚未/i.test(plain(html)));}
});
check('new downloadable Markdown equals the live report exporter without unresolved placeholders',()=>{
 const {researchMarkdown}=local('lib/research-observations.ts'),files=readdirSync('public/research').filter(f=>f.endsWith('.md'));
 for(const lang of ['zh','en']){const md=researchMarkdown(data,lang);assert(!md.includes('{{stat:'));assert(files.some(f=>readFileSync('public/research/'+f,'utf8').trim()===md.trim()),`Missing matching ${lang} Markdown`);for(const f of observations){const title=f.headline||f.title;if(title)assert(md.includes(fillStats(title[lang],lang)));}}
});
check('the two earlier reports are retained byte for byte',()=>{
 const expected={zh:'9a3d7390b0d18ae1d77e8d2caf96a6285f6de932b1ca3f3067212f78242e68c2',en:'6c68216f6f002a908c78755f320a11148643528ad2f9e319ab3cb1a0724df219'};
 for(const lang of ['zh','en'])assert.equal(createHash('sha256').update(readFileSync(`public/work-language-research.${lang}.md`)).digest('hex'),expected[lang]);
});
writeFileSync('public-study-checks.json',JSON.stringify({checks,count:checks.length,passed:true,independent_human_semantic_review:false,live_api_calls:0},null,2)+'\n');console.log(JSON.stringify({public_study_checks:checks.length,passed:true,independent_human_semantic_review:false,live_api_calls:0}));
