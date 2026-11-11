/** Publish aggregate records and current report copy; never reads research/private. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
const root=resolve(process.env.WLO_RESEARCH_ROOT||process.cwd()),require=createRequire(import.meta.url);
const read=f=>JSON.parse(readFileSync(resolve(root,f),'utf8'));
const statsFile=read('research/aggregates/stats.json'),stats=statsFile.stats??statsFile;
const config=read('research/config/terms.yaml'),counts=read('research/aggregates/term_counts.json'),previous=read('data/public-study.json');
const value=key=>{assert(Object.hasOwn(stats,key),`Missing ${key}`);const n=stats[key].value;assert(typeof n==='number'&&Number.isFinite(n),`Unmeasured ${key}`);return n};
const cache=new Map();
function local(file){
 const path=resolve(root,file);if(cache.has(path))return cache.get(path).exports;
 if(extname(path)==='.json')return JSON.parse(readFileSync(path,'utf8'));
 const loadedModule={exports:{}};cache.set(path,loadedModule);
 const output=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const dependency=p=>{if(p.startsWith('.')||p.startsWith('@/')){const stem=p.startsWith('@/')?resolve(root,p.slice(2)):resolve(dirname(path),p);for(const suffix of ['','.ts','.json'])if(existsSync(stem+suffix))return local(stem+suffix);throw new Error(`Unresolved ${p}`)}return require(p)};
 new Function('require','module','exports',output)(dependency,loadedModule,loadedModule.exports);return loadedModule.exports;
}
const {researchFraming,researchObservations,researchMethodReferences,researchMarkdown}=local('lib/research-observations.ts');
const {keywordContexts,keywordGroups}=local('lib/keyword-contexts.ts');
assert.equal(config.terms.length,value('corpus.dictionary_terms'));assert.equal(counts.corpus_ads,value('corpus.n'));
const extension=read('research/aggregates/self-drive-examples.json');
const keywords=config.terms.map((item,index)=>{
 const old=previous.keywords.find(k=>k.term===item.term)||(item.term===extension.term?extension:null),count=counts.terms.find(k=>k.term===item.term),context=keywordContexts[item.term];
 assert(old&&count&&context,`Missing existing term ${item.term}`);assert.equal(old.examples.length,3);assert.equal(value(`term.${item.term}.ads`),count.literal_ads);
 const {contexts: _contexts,...publicOld}=old;
 return {...publicOld,...(item.exploratory?{exploratory:true}:{}),rank:index+1,documents:count.literal_ads,group:keywordGroups[item.group],short:context.short,
  precisionKeys:{n_checked:`term.${item.term}.n_checked`,k_correct:`term.${item.term}.k_correct`,precision:`term.${item.term}.precision`},
  occupations:[],collocates:[],senses:[],examples:old.examples.map((example,i)=>({...example,reading:context.examples[i].expertTake,question:context.examples[i].question??example.question,reviewStatus:item.exploratory?'model_draft':'ai_reviewed'}))};
}).sort((a,b)=>b.documents-a.documents||a.rank-b.rank).map((k,i)=>({...k,rank:i+1}));
const crossTabs=researchObservations.map((observation,index)=>{
 const [focus,other]=observation.rows,a=value(focus.countKey),n=value(focus.denominatorKey),c=value(other.countKey),m=value(other.denominatorKey);
 assert(a<=n&&c<=m&&n+m===value('corpus.n'));
 return {title:observation.title,rowLabels:[focus.label,other.label],columns:index===0?[{zh:'含协调',en:'Coordination present'},{zh:'不含协调',en:'Coordination absent'}]:[{zh:'含沟通',en:'Communication present'},{zh:'不含沟通',en:'Communication absent'}],cells:[[a,n-a],[c,m-c]],statKeys:[focus.countKey,focus.denominatorKey,other.countKey,other.denominatorKey],note:{zh:'正文规范化后按词面检索，每广告每词计一次；尚未调整职业构成。',en:'Normalized body text is searched literally, once per ad per term; occupational composition is not adjusted.'}};
});
const data={
 methods:{corpusN:value('corpus.n'),archivedN:value('corpus.n'),uniqueN:value('corpus.n'),sources:[['51job','51job'],['boss','boss'],['liepin','liepin']].map(([label,key])=>({label,n:counts.by_source[key]})),
 scope:{zh:'{{stat:corpus.n|int}}份历史招聘归档，正文与规范化哈希均去重；采用非概率选样。',en:'{{stat:corpus.n|int}} historical advertisements, deduplicated by exact and normalized text; a non-probability sample.'},
 frequencyNote:{zh:'保留既有词表，正文经Unicode NFKC及大小写规范化后精确检索，每广告每词计一次。复合词排除另存候选，公开广告数为完整词面命中数，尚未判定全部用法是否指向劳动者。',en:'The existing vocabulary is retained. Body text is searched by exact substring after Unicode NFKC normalization and case folding, once per ad per term. Compound exclusions are retained separately as candidates. Published ad counts include all literal hits; their worker-directed meaning has not been fully reviewed.'},
 sampleNote:{zh:'案例使用归档广告的去识别释义，由AI起草或编辑，复核状态在词条上注明；这些挑选的对照不能代表用法比例。',en:'Examples are deidentified paraphrases of archived ads, drafted or edited by AI. Review status is shown with each entry. These selected contrasts do not represent a distribution of meanings.'},
 candidateVocabulary:config.terms.map(k=>k.term),publishedAt:'2026-11-09',caseN:keywords.reduce((n,k)=>n+k.examples.length,0),semanticValidation:'human_review_pending'},
 keywords,
 report:{title:researchFraming.title,standfirst:researchFraming.lead,thesis:researchFraming.question,
  findings:researchObservations.map(o=>({id:o.id,title:o.title,interpretation:o.interpretation,quantitative:o.numbers,terms:[o.term],statKeys:o.rows.flatMap(r=>[r.rateKey,r.countKey,r.denominatorKey])})),
  crossTabs,conclusion:researchFraming.discussion,bibliography:researchMethodReferences}
};
const serialized=(JSON.stringify(data,null,2)+'\n').replaceAll('人才发展政策落地','人才发展政策实施').replaceAll('沉淀工艺数据','整理并保存工艺数据');
assert(!/120-ad|122\/156|71\/114|pilotN|51J-\d|GH-BOSS-\d|GH-LIEPIN-\d|"(?:raw_text|body|employer|source_job_id|record_id|phone|email)"\s*:/.test(serialized));
mkdirSync(resolve(root,'public/research'),{recursive:true});
writeFileSync(resolve(root,'data/public-study.json'),serialized);
writeFileSync(resolve(root,'public/research/stats.json'),JSON.stringify(statsFile,null,2)+'\n');
// Keep the existing aggregate download URL in sync; old Markdown remains untouched.
writeFileSync(resolve(root,'public/work-language-study-aggregates.json'),serialized);
for(const lang of ['zh','en']){const markdown=researchMarkdown(data,lang);assert(!markdown.includes('{{stat:'),'Unresolved report statistic');writeFileSync(resolve(root,`public/research/work-language-research-current.${lang}.md`),markdown+'\n')}
console.log(JSON.stringify({public_terms:keywords.length,draft_examples:data.methods.caseN,lexical_comparisons:crossTabs.length,raw_records_published:0}));
