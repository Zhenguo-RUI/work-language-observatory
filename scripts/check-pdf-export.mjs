import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const out=resolve('.sites-runtime/pdf-tests');mkdirSync(out,{recursive:true});writeFileSync(out+'/package.json','{"type":"commonjs"}');
const compiled=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','--target','ES2022','--module','commonjs','--moduleResolution','node','--esModuleInterop','--skipLibCheck','--strict','--outDir',out,'lib/reading-export.ts','lib/reading-pdf.ts'],{encoding:'utf8'});
if(compiled.status!==0){console.error(compiled.stdout+compiled.stderr);process.exit(1);}
const require=createRequire(import.meta.url),{PDFDocument}=require('pdf-lib'),{generateReadingPdf}=require(out+'/reading-pdf.js'),{readingMarkdown,readingBlocks}=require(out+'/reading-export.js');
const bi=(zh,en)=>({zh,en}),raw='岗位职责：使用 SQL 核对订单与退款，独立完成每周经营分析报表，与财务团队核对指标口径。\n任职要求：逻辑清晰，能说明判断依据，形成可追溯的业务改进建议。';
const analysis={id:'pdf-check',title:'数据分析实习生',company:'测试机构',raw_text:raw,source_url:'https://example.test/job',text_hash:'test',status:'draft',engine:'rules',revision:1,created_at:'2026-11-05T00:00:00Z',updated_at:'2026-11-05T00:00:00Z',result:{
 headline:bi('把零散记录变成可核对的经营判断','Turn records into defensible business judgments'),role:bi('核对订单、退款和指标口径，输出每周经营分析。','Reconcile orders, refunds and metric definitions for weekly analysis.'),
 terms:[{term:'独立',meaning:bi('在财务协作中独立完成报表，不意味着独享指标定义权。','Prepare the report independently while coordinating metric definitions with finance.'),quote:'独立完成每周经营分析报表，与财务团队核对指标口径',alternative:bi('解释边界：未写明最终审批安排。','Scope: final approval arrangements are not specified.'),question:bi('指标口径分歧怎样记录与解决？','How are disagreements over metric definitions recorded and resolved?')}],
 sociology:bi('核对订单与解释指标把局部数据转化为可供组织使用的经营证据；独立完成与共同校准在这里并存。','Reconciling records and explaining metrics turn local data into organizational evidence. Independent production coexists with collective calibration.'),questions:[bi('指标口径分歧怎样解决？','How are disagreements over metric definitions resolved?')],conditions:[bi('每周到岗不少于4天。','At least 4 days on site each week.')],gaps:[],comparisons:[],
 context:{company:{name:bi('测试机构','Test organization'),relationship:'employer',description:bi('本测试使用虚构的机构，不对应真实招聘方。','This test uses a fictional organization, not a real employer.'),basis:'jd'},industry:{name:bi('经营分析','Business analysis'),description:bi('从文本识别的岗位语境。','Role context inferred from the supplied text.'),basis:'jd'},implication:bi('数据能力在此体现为核对与解释，而不自动等同于模型开发。','Data skills here involve reconciliation and explanation, not necessarily model development.'),sources:[],status:'jd_only',evidence:[],notice:bi('背景来自本测试文本。','Context comes from this test text.')},
 depth:{protocol:'work-language-v2',basis:'rules',workMap:{object:bi('订单和退款','Orders and refunds'),tools:bi('SQL','SQL'),partners:bi('财务团队','Finance team'),authority:bi('最终审批未写明','Final approval is not specified'),quotes:['与财务团队核对指标口径']},deliverables:[{task:bi('核对口径差异','Reconcile metric definitions'),quote:'核对指标口径',output:bi('口径差异说明','Metric-definition rationale'),check:bi('可追溯原始记录','Traceable to source records')}],example:null,sociologyQuotes:['使用 SQL 核对订单与退款']},
 sourceTranslation:{titleEn:'Data Analyst Intern',paragraphs:[{source:raw,en:'Responsibilities: reconcile orders and refunds using SQL; independently prepare weekly analysis and verify metric definitions with finance.'}],basis:'curated',sourceHash:'test'}
}};
const checks=[];
function check(name,fn){fn();checks.push({name,passed:true});}
check('Markdown and PDF share complete original, translated title and context',()=>{const md=readingMarkdown(analysis,'en');assert(md.startsWith('# Data Analyst Intern'));assert(md.includes(raw));assert(md.includes('Company and industry context'));assert(md.includes('This test uses a fictional organization'));assert(readingBlocks(analysis,'zh').some(b=>b.text===raw));});
const fontBytes=new Uint8Array(readFileSync('public/fonts/NotoSansSC-Regular.ttf'));
for(const lang of ['zh','en']){
 const bytes=await generateReadingPdf(analysis,lang,{fontBytes});writeFileSync(`${out}/reading.${lang}.pdf`,bytes);const pdf=await PDFDocument.load(bytes);
 check(`${lang}: real PDF with embedded CJK font and paginated content`,()=>{assert.equal(Buffer.from(bytes).subarray(0,5).toString(),'%PDF-');assert(pdf.getPageCount()>=2);assert.equal(pdf.getTitle(),lang==='en'?'Data Analyst Intern':analysis.title);assert(bytes.length>15000);assert(bytes.length<15000000);});
}
const long=structuredClone(analysis);long.raw_text=(raw+' '+ 'https://example.test/'+ 'longword'.repeat(40)+'\n').repeat(60)+'\n结尾验收标记 END-OF-LONG-JD';
const longBytes=await generateReadingPdf(long,'zh',{fontBytes});writeFileSync(`${out}/reading.long.pdf`,longBytes);const longPdf=await PDFDocument.load(longBytes);
check('long JDs and unbroken URLs paginate instead of clipping or truncation',()=>assert(longPdf.getPageCount()>8));
writeFileSync(`${out}/checks.json`,JSON.stringify({all_passed:true,count:checks.length,checks,scope:'Synthetic client PDF generation, shared content, real CJK embedding and pagination. Visual rendering and text extraction are separate checks.'},null,2));console.log(JSON.stringify({pdf_checks:checks.length,all_passed:true,output:out}));
