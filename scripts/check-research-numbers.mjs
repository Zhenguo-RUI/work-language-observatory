import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const formats=new Set(['int','pct','ci','or','or-ci']);
export function inspectCopy(text,path,stats){
 const errors=[],keys=[];
 const plain=text.replace(/\{\{stat:([^{}|]+)(?:\|([^{}]+))?\}\}/g,(token,key,fmt)=>{
  keys.push(key);if(!Object.hasOwn(stats,key))errors.push(`unknown stat key ${key}`);
  if(fmt&&!formats.has(fmt))errors.push(`unknown stat format ${fmt}`);return '';
 });
 if(/\{\{stat:/.test(plain))errors.push('malformed stat placeholder');
 let remainder=plain.replace(/\b[HD][1-6]\b|\bv\d+(?:\.\d+)*\b/gi,'').replace(/(?:CI|置信区间)\s*95%|95%\s*(?:CI|confidence intervals?|置信区间)/gi,'');
 // These are a source's proper name and a workplace-method name, not quantities.
 remainder=remainder.replace(/\b51job\b|\b5S\b/gi,'');
 // Permit author–year citations, not all numbers in discussion/method paragraphs.
 const author="[A-Z][A-Za-z’'.-]*(?:\\s+(?:&|and|et al\\.?|[A-Z][A-Za-z’'.-]*)){0,6}";
 remainder=remainder.replace(new RegExp(`\\b${author}(?:等)?\\s*[（(](?:18|19|20)\\d{2}[a-z]?[)）]`,'g'),'').replace(new RegExp(`[（(]${author},?\\s+(?:18|19|20)\\d{2}[a-z]?[)）]`,'g'),'');
 if(/bibliography|references/i.test(path))remainder=remainder.replace(/\b(?:18|19|20)\d{2}\b/g,'').replace(/\b(?:vol\.?|pp?\.?|issue)\s*\d+(?:\s*[-–]\s*\d+)?/gi,'');
 if(/(?:^|\.)(?:sequence|step|number)\.(?:zh|en)$/.test(path)&&/^\d{1,2}$/.test(remainder.trim()))remainder='';
 if(/\d/u.test(remainder))errors.push(`hard-coded number: ${remainder.match(/.{0,25}\d.{0,35}/u)?.[0]}`);
 for(const sentence of text.split(/(?<=[。！？!?])|\.(?:\s+|$)/u)){
  if(/大多数|多数|过半|少数|一半|近半|[一二三四五六七八九]成|\bmajority\b|\b(?:over|more than|nearly) half\b|\bhalf of\b|\bmost (?:ads|advertisements|postings|occurrences|uses)\b/i.test(sentence)&&!sentence.includes('{{stat:'))errors.push(`unsupported quantity phrase: ${sentence.slice(0,100)}`);
 }
 return {errors,keys};
}

function jsonCopy(value,path='$',found=[]){
 if(!value||typeof value!=='object')return found;
 if(typeof value.zh==='string'&&typeof value.en==='string')for(const lang of ['zh','en'])found.push({path:`${path}.${lang}`,text:value[lang]});
 for(const [key,child] of Object.entries(value))if(key!=='zh'&&key!=='en')jsonCopy(child,`${path}.${key}`,found);
 return found;
}
function tsCopy(source,file){
 const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS),found=[];
 const name=node=>node?.name&&(ts.isIdentifier(node.name)||ts.isStringLiteral(node.name))?node.name.text:undefined;
 const literal=node=>ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node);
 function visit(node,path){
  const own=name(node),next=own?`${path}.${own}`:path;
  if(ts.isObjectLiteralExpression(node)){
   const props=node.properties.filter(ts.isPropertyAssignment),bi=props.filter(p=>['zh','en'].includes(name(p)));
   if(bi.length===2)for(const p of bi){const location=ast.getLineAndCharacterOfPosition(p.getStart(ast));found.push({path:`${next}.${name(p)}@${location.line+1}`,text:literal(p.initializer)?p.initializer.text:null});}
  }
  if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&['bi','bilingual'].includes(node.expression.text)&&node.arguments.length>=2)for(const [i,lang]of ['zh','en'].entries()){const a=node.arguments[i];found.push({path:`${next}.${lang}@${ast.getLineAndCharacterOfPosition(a.getStart(ast)).line+1}`,text:literal(a)?a.text:null});}
  ts.forEachChild(node,child=>visit(child,next));
 }
 visit(ast,'$');return found;
}
function selfTest(){
 const stats={'corpus.n':{value:2000},'term.沟通.ads':{value:1233}};
 assert.equal(inspectCopy('{{stat:corpus.n|int}}份；H1、D3、v2。95% CI。','$.body.zh',stats).errors.length,0);
 assert(inspectCopy('共2,000份。','$.body.zh',stats).errors.some(e=>e.includes('hard-coded')));
 assert(inspectCopy('多数广告没有写。','$.body.zh',stats).errors.some(e=>e.includes('quantity')));
 assert(inspectCopy('多数广告没有写。另有{{stat:corpus.n}}份。','$.body.zh',stats).errors.some(e=>e.includes('quantity')));
 assert.equal(inspectCopy('多数在{{stat:corpus.n}}份内。','$.body.zh',stats).errors.length,0);
 assert(inspectCopy('{{stat:missing}}','$.body.en',stats).errors.some(e=>e.includes('unknown stat')));
 assert(inspectCopy('{{stat:corpus.n|bogus}}','$.body.en',stats).errors.some(e=>e.includes('format')));
 assert.equal(inspectCopy('Published in 2008.','$.bibliography.contribution.en',stats).errors.length,0);
 assert.equal(tsCopy('const x={title:{zh:"20份",en:"20 ads"}};','fixture.ts').length,2);
 assert.equal(jsonCopy({x:{zh:'中文',en:'English'}}).length,2);
 assert.equal(inspectCopy('Urciuoli（2008）讨论技能词。 (Deming & Kahn 2018).','$.discussion.zh',stats).errors.length,0);
 assert(inspectCopy('Urciuoli (2008) found 50% here.','$.discussion.en',stats).errors.some(e=>e.includes('hard-coded')));
 assert.equal(inspectCopy('51job资料；现场5S；Egami等（2023）。','$.body.zh',stats).errors.length,0);
 assert(inspectCopy('51job有50份。','$.body.zh',stats).errors.some(e=>e.includes('hard-coded')));
 console.log(JSON.stringify({number_linter_self_checks:14,passed:true}));
}
if(process.argv.includes('--self-test'))selfTest();
else{
 const config=JSON.parse(readFileSync('research/config/copy-files.json','utf8')),raw=JSON.parse(readFileSync('research/aggregates/stats.json','utf8')),stats=raw.stats??raw;
 const files=Array.isArray(config)?config:config.files;assert(Array.isArray(files)&&files.length,'copy-files.json must list copy files');
 const failures=[],used=new Set();let fields=0;
 for(const entry of files){const file=typeof entry==='string'?entry:entry.path;assert(typeof file==='string'&&!file.includes('private/'),'Invalid public copy path');const source=readFileSync(file,'utf8'),items=file.endsWith('.json')?jsonCopy(JSON.parse(source)):tsCopy(source,file);
  for(const item of items){fields++;if(item.text===null){failures.push(`${file}:${item.path}: dynamic bilingual copy cannot be audited; use stat placeholders in literal copy`);continue;}const inspected=inspectCopy(item.text,item.path,stats);inspected.keys.forEach(k=>used.add(k));for(const error of inspected.errors)failures.push(`${file}:${item.path}: ${error}`);}
 }
 assert(fields>0,'No bilingual copy was inspected');if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}else console.log(JSON.stringify({research_number_fields:fields,stat_keys_used:used.size,passed:true}));
}
