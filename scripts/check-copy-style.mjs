/** Check authored static copy. Verbatim-source fields and term labels are exempt. */
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import ts from 'typescript/lib/typescript.js';
const root=resolve(process.env.WLO_RESEARCH_ROOT||process.cwd());
const defaultFiles=['lib/keyword-contexts.ts','lib/research-observations.ts','components/keyword-atlas.tsx','components/observatory.tsx','data/public-study.json'];
const exemptFields=new Set(['term','english','sourceRoleZh','candidateVocabulary','statKeys','quote','sourceQuote','raw_text','originalText','verbatim','sourceExcerpt','url','id','rateKey','countKey','denominatorKey']);
const termConfig=resolve(root,'research/config/terms.yaml');
const termNames=new Set(existsSync(termConfig)?JSON.parse(readFileSync(termConfig,'utf8')).terms.map(x=>x.term):['闭环','独立']);
const rules=[
 ['zh-filler',/体现了|反映出|折射出|本质上|值得注意的是|综上所述|从某种意义上说|关键在于/gu],
 ['zh-opposition',/不是[^。！？\n]{0,100}而是|不(?:只|仅)(?:是)?[^。！？\n]{0,100}(?:还(?:要|是|有|需|能)|也(?:要|是|需|能))|而非|不把[^。！？\n]{1,50}当成/gu],
 ['zh-colon-scaffold',/(?:可以(?:据此)?(?:问|追问)|(?:据此|值得)追问|值得问清的是|关键是|结论是|一句话(?:总结)?|简言之|换句话说)\s*[：:](?=\s*\S)/gu],
 ['en-filler',/\b(?:it is worth noting|underscores?|highlights?|sheds? light on|a testament to|delve(?:s|d)?|nuanced|landscape|multifaceted|crucial|serves? to|operates? as|functions? as|dual-facing|discursive displacement)\b/giu],
 ['en-opposition',/\bnot (?:only |just )?[^.!?;\n]{1,100}\bbut(?: also)?\b/giu],
 ['en-colon-scaffold',/\b(?:in short|the key is|you can ask|ask|in other words|bottom line)\s*:(?=\s*\S)/giu],
];
const jargon=/赋能|抓手|闭环|口径|沉淀|链路|颗粒度|打通|落地|对齐/gu;
function maskedCopy(text){
 // Exempt the named word itself, not every sentence enclosed in quotation marks.
 return text.replace(/{{stat:[^}]+}}/g,' ').replace(/[“「『"']([^”」』"'\n]{1,24})[”」』"']/g,(span,inside)=>termNames.has(inside)?' '.repeat(span.length):span);
}
export function inspectText(text,path='copy',terms=termNames){
 if(exemptFields.has(path.split(/[.[\]]/).filter(Boolean).at(-1)))return [];
 const value=maskedCopy(text),problems=[];
 for(const [rule,pattern]of rules){pattern.lastIndex=0;for(const match of value.matchAll(pattern))problems.push({rule,match:match[0],offset:match.index});}
 for(const match of value.matchAll(jargon)){
  const word=match[0];if(terms.has(word))continue;
  // Literal alignment of fields, dates or physical features is not empty management prose.
  if(word==='对齐'&&/(?:颜色|色彩|日期|时间|列|行|字段|刻度|边缘|像素|格式)/u.test(value.slice(Math.max(0,match.index-8),match.index+18)))continue;
  problems.push({rule:'zh-jargon',match:word,offset:match.index});
 }
 return problems.map(p=>({...p,path,excerpt:text.slice(Math.max(0,p.offset-24),p.offset+Math.max(80,p.match.length+20))}));
}
function collectJSON(value,path='$',result=[]){
 if(typeof value==='string'){const segments=path.split(/[.[\]]/).filter(Boolean);if(!segments.some(x=>exemptFields.has(x)))result.push({text:value,path});return result;}
 if(!value||typeof value!=='object')return result;
 for(const [k,v]of Object.entries(value))collectJSON(v,`${path}.${k}`,result);return result;
}
function collectTS(source,file){
 const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS),result=[],seen=new Set();
 const name=n=>ts.isIdentifier(n)||ts.isStringLiteral(n)?n.text:n.getText(ast);
 const add=(node,path)=>{if(seen.has(node.pos))return;seen.add(node.pos);const text=ts.isStringLiteralLike(node)?node.text:node.getText(ast);result.push({text,path,line:ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1})};
 const translations=(node,path)=>{if(ts.isStringLiteralLike(node))add(node,path);else if(ts.isTemplateExpression(node)){add(node.head,path);node.templateSpans.forEach((s,i)=>add(s.literal,`${path}.part${i}`));}else ts.forEachChild(node,child=>translations(child,path));};
 const visit=(node,path='$',exempt=false)=>{
  if(ts.isVariableDeclaration(node)&&node.initializer){visit(node.initializer,name(node.name),false);return;}
  if(ts.isPropertyAssignment(node)){const key=name(node.name);const skip=exempt||exemptFields.has(key);if(!skip&&(key==='zh'||key==='en'))translations(node.initializer,`${path}.${key}`);else visit(node.initializer,`${path}.${key}`,skip);return;}
  if(exempt)return;
  if(ts.isArrayLiteralExpression(node)){node.elements.forEach((child,i)=>visit(child,`${path}[${i}]`,false));return;}
  if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&node.expression.text==='t'){node.arguments.slice(0,2).forEach((a,i)=>translations(a,`${path}.t.${i?'en':'zh'}`));return;}
  if(ts.isJsxText(node)&&node.text.trim())add(node,`${path}.jsx`);
  ts.forEachChild(node,child=>visit(child,path,exempt));
 };
 visit(ast);return result;
}
async function selfTest(){
 const cases=[['可以问：谁审核？',true],['不是有权，而是只能跑腿。',true],['不只会工具，还要懂业务。',true],['这体现了控制。',true],['赋能业务落地。',true],['In short: this is crucial.',true],['Not just a task but a commitment.',true],['谁决定例外处理？',false],['统计“闭环”出现在哪些广告里。',false],['将两列日期对齐。',false],['沟通',false],['问题：',false]];
 for(const [text,bad]of cases)assert.equal(inspectText(text).length>0,bad,text);
 assert.equal(inspectText('赋能落地。','entry.quote').length,0);
 assert.equal(inspectText('可以问：“体现了什么”？').length>0,true,'Quotes cannot hide authored scaffolding');
 const fields=collectJSON({term:'闭环',quote:{zh:'赋能落地。'},context:{zh:'这体现了安排。'},reading:{zh:'可以问：谁接手？'}});
 assert.deepEqual(fields.map(x=>x.path),['$.context.zh','$.reading.zh']);
 const tsFields=collectTS('const x={quote:{zh:"赋能"},short:{zh:"可以问：谁？",en:"Ask: who?"}};const y=t("体现了安排。","A workable plan.");','fixture.ts');
 assert.equal(tsFields.length,4);assert.equal(tsFields.flatMap(x=>inspectText(x.text,x.path)).length,3);
 assert.equal(collectTS('const items=[{zh:"赋能"}];','fixture.ts')[0].path,'items[0].zh');
 const contextsSource=readFileSync(resolve(root,'lib/keyword-contexts.ts'),'utf8');
 const compiled=ts.transpileModule(contextsSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 const {keywordContexts:contextObject}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
 const expectedTerms=['沟通','分析','数据','协调','熟练','独立','协作','抗压','责任心','适应','目标','服务','逻辑','学习','统筹','主动','英语','严谨','闭环','执行力','自驱'];
 assert.deepEqual(JSON.parse(readFileSync(termConfig,'utf8')).terms.map(entry=>entry.term).sort(),[...expectedTerms].sort());
 assert.deepEqual(Object.keys(contextObject).sort(),[...expectedTerms].sort());
 let reviewedExamples=0,draftExamples=0;
 for(const [term,entry]of Object.entries(contextObject)){
  assert(entry.short.zh.length<=40,term);assert(entry.short.en&&entry.short.zh);assert(!('summary'in entry),term);assert.equal(entry.examples.length,3,term);
  const expectedStatus=term==='自驱'?'model_draft':'ai_reviewed';
  assert(entry.examples.every(example=>example.reviewStatus===expectedStatus),term);
  if(expectedStatus==='ai_reviewed')reviewedExamples+=entry.examples.length;else draftExamples+=entry.examples.length;
 }
 assert.equal(reviewedExamples,60);assert.equal(draftExamples,3);
 assert(!readFileSync(resolve(root,'components/keyword-atlas.tsx'),'utf8').includes('expansion.summary'));
 console.log(JSON.stringify({style_self_tests:"passed",short_terms:expectedTerms.length,ai_reviewed_examples:reviewedExamples,model_draft_examples:draftExamples,passed:true}));
}
if(process.argv.includes('--self-test'))await selfTest();
else {
 const arg=process.argv.indexOf('--files'),files=arg>=0?process.argv.slice(arg+1):defaultFiles,errors=[];let fields=0;
 for(const file of files){const path=resolve(root,file),source=readFileSync(path,'utf8'),entries=file.endsWith('.json')?collectJSON(JSON.parse(source)):collectTS(source,file);fields+=entries.length;for(const entry of entries)for(const issue of inspectText(entry.text,entry.path))errors.push({file:relative(root,path),line:entry.line??null,...issue});}
 console.log(JSON.stringify({passed:!errors.length,files:files.length,fields,errors},null,2));if(errors.length)process.exitCode=1;
}
