import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
const root=process.cwd(),require=createRequire(root+'/package.json'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const archive=JSON.parse(readFileSync('data/home-archive-contexts.json','utf8'));
const study=JSON.parse(readFileSync('data/public-study.json','utf8'));
const keyword=study.keywords.find(k=>k.term===archive.term);
const cache=new Map();
function local(path){path=resolve(root,path);if(path.endsWith('.json'))return JSON.parse(readFileSync(path,'utf8'));if(cache.has(path))return cache.get(path).exports;const m={exports:{}};cache.set(path,m);const js=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const dep=p=>{if(p.endsWith('design-symbols'))return{WloIllustration:()=>null};if(p.startsWith('.')||p.startsWith('@/')){const base=p.startsWith('@/')?resolve(root,p.slice(2)):resolve(dirname(path),p);for(const ext of ['','.ts','.tsx'])if(existsSync(base+ext))return local(base+ext);throw Error(p)}return require(p)};new Function('require','module','exports',js)(dep,m,m.exports);return m.exports;}
const {keywordContexts}=local('lib/keyword-contexts.ts');
assert(keyword);assert.equal(archive.examples.length,2);assert.notEqual(archive.examples[0].role.zh,archive.examples[1].role.zh);
for(const item of archive.examples){const source=keyword.examples.find(e=>e.role.zh===item.role.zh),editorial=keywordContexts[archive.term].examples.find(e=>e.sourceRoleZh===item.role.zh);assert(source);assert(editorial);for(const field of ['role','context','reading','reviewStatus'])assert.deepEqual(item[field],source[field]);for(const field of ['task','deliverable'])assert.deepEqual(item[field],editorial[field]);assert(!('company' in item));assert(!('id' in item));}
const {HomeContexts}=local('components/home-contexts.tsx');
for(const lang of ['zh','en']){const html=renderToStaticMarkup(React.createElement(HomeContexts,{lang,onCompare:()=>{}}));assert(!html.includes('Hypothetical'));assert(!html.includes('假设'));assert(!html.includes('抖音'));for(const item of archive.examples){assert(html.includes(item.role[lang]));assert(html.includes(item.context[lang]));assert(html.includes(item.deliverable[lang]));}assert(html.includes(lang==='zh'?'交付建议':'Suggested output'));assert(html.includes(lang==='zh'?'已去识别并改写':'without identifying details'));assert(!html.includes(lang==='zh'?'人工核对通过':'human-verified'));}
console.log(JSON.stringify({passed:true,archive_examples:2,bilingual:true,source_fields_unchanged:true,live_model_calls:0}));

const {HomeResearchNote}=local('components/home-research-note.tsx'),{SiteFooter}=local('components/site-footer.tsx');const {fillStats}=local('lib/research-stats.ts'),{researchObservations}=local('lib/research-observations.ts'),{homeResearchCopy}=local('lib/home-research-copy.ts');
for(const lang of ['zh','en']){const html=renderToStaticMarkup(React.createElement(HomeResearchNote,{lang}));assert(html.includes(fillStats(homeResearchCopy.size[lang],lang)));assert(html.includes(researchObservations[0].title[lang]));assert(html.includes('page=research'));for(const admin of [false,true]){const footer=renderToStaticMarkup(React.createElement(SiteFooter,{lang,admin}));assert(!footer.includes('/ops'));assert(footer.includes('#research-methods'));assert(footer.includes('/issues'));assert(footer.includes(lang==='zh'?'联系与反馈':'Contact and feedback'));}}
console.log(JSON.stringify({home_summary_uses_live_stats:true,footer_links:true,passed:true}));
