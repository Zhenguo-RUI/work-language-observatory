import {hasChinese} from "./localization";
import {analysisFidelityErrors} from "./analysis-fidelity";
import {publicCompanySourceUrl} from "./company-source-url";
import {companyBriefOutputSchema} from "./company-brief";
import {z} from "zod";
import type {AnalysisResult} from "./observatory-types";

const bi=z.object({zh:z.string().max(3500),en:z.string().max(5000)});
const officialProfileUrls=new Set(["https://www.zgcgroup.com.cn/xwzx/jtyw/art/2026/art_29b3aa9dd2af476f879ac0b6573430bc.html","https://www.tencent.com/who-we-are/","https://www.mi.com/global/about/","https://www.bytedance.com/?locale=en","https://www.douyinec.com/","https://www.oceanengine.com/"]);
const sourceUrl=z.string().url().max(1500).refine(publicCompanySourceUrl,"Use a public HTTP(S) source URL without credentials.");
const date=z.union([z.string().datetime(),z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]);
const companyLookup=z.object({query:z.string().max(160),status:z.enum(["matched","ambiguous","not_found","unavailable"]),provider:z.string().max(160),searchedAt:date,selectedId:z.string().max(120).optional(),matches:z.array(z.object({id:z.string().max(120),title:z.string().max(350),url:sourceUrl,snippet:z.string().max(2500),kind:z.enum(["encyclopedia","search"]),retrievedAt:date,nameZh:z.string().max(200).optional(),nameEn:z.string().max(250).optional(),match:z.enum(["exact","alias","candidate"])})).max(6)});
const companyContext=z.object({company:z.object({name:bi,relationship:z.enum(["employer","platform","client","unresolved"]),description:bi,basis:z.enum(["official","retrieved","jd"])}),industry:z.object({name:bi,description:bi,basis:z.literal("jd")}),implication:bi,sources:z.array(z.object({id:z.string().max(120).optional(),title:z.string().min(1).max(350),url:sourceUrl,retrievedAt:date,verification:z.enum(["live","reviewed"]).optional(),kind:z.enum(["official","encyclopedia","search"]).optional(),excerpt:z.string().max(2500).optional()})).max(8),status:z.enum(["verified","sourced","jd_only","unavailable"]),evidence:z.array(z.string().max(500)).max(3),notice:bi,lookup:companyLookup.optional(),companyEvidence:z.array(z.object({sourceId:z.string().max(120),quote:z.string().max(200)})).max(3).optional(),briefBasis:z.enum(["model","source"]).optional()}).superRefine((value,ctx)=>{if((value.status==="verified"||value.company.basis!=="jd")&&!value.sources.length)ctx.addIssue({code:z.ZodIssueCode.custom,path:["sources"],message:"An externally sourced profile needs its source."});if(value.company.basis==="official"&&!value.sources.some(s=>s.kind==="official"||officialProfileUrls.has(s.url)))ctx.addIssue({code:z.ZodIssueCode.custom,path:["sources"],message:"Official basis requires an official source, not a search snippet."});});
const questionTest=z.object({questionIndex:z.number().int().min(0).max(5),answerA:bi,answerB:bi,difference:bi,quote:z.string().min(1).max(1500)});
const depth=z.object({protocol:z.literal("work-language-v2"),basis:z.enum(["model","rules"]),workMap:z.object({object:bi,tools:bi,partners:bi,authority:bi,quotes:z.array(z.string().min(1).max(1500)).max(5)}),deliverables:z.array(z.object({task:bi,quote:z.string().min(1).max(1500),output:bi,check:bi})).max(6),example:z.object({kind:z.literal("hypothetical"),scenario:bi,steps:z.array(bi).min(2).max(6),lesson:bi}).nullable(),sociologyQuotes:z.array(z.string().min(1).max(1500)).max(5),questionTests:z.array(questionTest).max(2).optional()});

// Optional depth keeps previously stored, reviewed cases editable.
export const resultSchema=z.object({headline:bi,role:bi,terms:z.array(z.object({term:z.string().min(1).max(120),meaning:bi,quote:z.string().min(1).max(1500),alternative:bi,question:bi})).min(1).max(6),sociology:bi,questions:z.array(bi).max(6),conditions:z.array(bi).max(8),gaps:z.array(bi).max(8),comparisons:z.array(z.object({id:z.string().max(100),title:z.string().max(200),titleEn:z.string().max(800).optional(),reading:bi})).max(5),depth:depth.optional(),sourceTranslation:z.object({titleEn:z.string().min(1).max(800),paragraphs:z.array(z.object({source:z.string().min(1).max(24000),en:z.string().min(1).max(8000)})).min(1).max(500),basis:z.enum(["model","curated","browser","original"]),sourceHash:z.string().length(64)}).optional(),context:companyContext.optional()});
const str={type:"string"};
const object=(properties:Record<string,unknown>)=>({type:"object",additionalProperties:false,properties,required:Object.keys(properties)});
const bilingual=object({zh:str,en:str});
const array=(items:unknown)=>({type:"array",items});
const depthSchema=object({protocol:{type:"string",enum:["work-language-v2"]},basis:{type:"string",enum:["model"]},workMap:object({object:bilingual,tools:bilingual,partners:bilingual,authority:bilingual,quotes:array(str)}),deliverables:array(object({task:bilingual,quote:str,output:bilingual,check:bilingual})),example:{anyOf:[object({kind:{type:"string",enum:["hypothetical"]},scenario:bilingual,steps:array(bilingual),lesson:bilingual}),{type:"null"}]},sociologyQuotes:array(str),questionTests:array(object({questionIndex:{type:"integer"},answerA:bilingual,answerB:bilingual,difference:bilingual,quote:str}))});
export const modelOutputSchema=object({headline:bilingual,role:bilingual,terms:array(object({term:str,meaning:bilingual,quote:str,alternative:bilingual,question:bilingual})),sociology:bilingual,questions:array(bilingual),conditions:array(bilingual),gaps:array(bilingual),comparisons:array(object({id:str,title:str,reading:bilingual})),depth:depthSchema,companyBrief:companyBriefOutputSchema});

export function deepEvidenceErrors(result:AnalysisResult,raw:string,requireModelDepth=false,requireQuestionTests=false):string[]{
 const errors:string[]=[];const d=result.depth;
 for(const anchor of result.context?.companyEvidence||[])if(!result.context?.sources.find(s=>s.id===anchor.sourceId)?.excerpt?.includes(anchor.quote))errors.push("Company evidence must match an existing external source excerpt.");
 if(result.context?.evidence.some(quote=>!raw.includes(quote)))errors.push("Company-context evidence must be an exact source span from this JD.");
 if(!d){if(requireModelDepth)errors.push("The v2 work map and deliverables are missing.");return errors;}
 for(const quote of [...d.workMap.quotes,...d.deliverables.map(x=>x.quote),...d.sociologyQuotes])if(!raw.includes(quote))errors.push("A work-map, deliverable or sociology quote is not an exact source span.");
 for(const item of d.deliverables)if(!item.task.zh.trim()||!item.task.en.trim()||!item.output.zh.trim()||!item.output.en.trim()||!item.check.zh.trim()||!item.check.en.trim())errors.push("A proposed deliverable lacks a bilingual task, output or acceptance check.");
 const tests=d.questionTests||[];
 if(requireQuestionTests&&!tests.length)errors.push("depth.questionTests: show how two possible answers to a priority question would change the reading; these are hypothetical answers, not employer testimony.");
 const seen=new Set<number>();
 for(const [index,test] of tests.entries()){
  const path=`depth.questionTests.${index}`;
  if(test.questionIndex<0||test.questionIndex>=result.questions.length||!Number.isInteger(test.questionIndex))errors.push(`${path}.questionIndex must refer to an existing question.`);
  if(seen.has(test.questionIndex))errors.push(`${path}: do not duplicate a question test.`);seen.add(test.questionIndex);
  if(!raw.includes(test.quote))errors.push(`${path}.quote must be an exact source span.`);
  for(const [key,value] of Object.entries({answerA:test.answerA,answerB:test.answerB,difference:test.difference}))if(!value.zh.trim()||!value.en.trim())errors.push(`${path}.${key} needs both languages.`);
  if(test.answerA.zh.trim()===test.answerB.zh.trim()||test.answerA.en.trim()===test.answerB.en.trim())errors.push(`${path}: the two possible answers must differ.`);
 }
 if(requireModelDepth){
  errors.push(...analysisFidelityErrors(result,raw));
  const inspect=(value:unknown,path:string)=>{if(!value||typeof value!=="object")return;for(const [key,item] of Object.entries(value)){if(key==="en"&&typeof item==="string"&&hasChinese(item))errors.push(`${path}.en contains untranslated Chinese; translate prose and retain original text only in source fields.`);else if(typeof item==="object")inspect(item,`${path}.${key}`);}};inspect(result,"reading");
  if(d.basis!=="model")errors.push("A model result must label its basis as model.");
  for(const field of [d.workMap.object,d.workMap.tools,d.workMap.partners,d.workMap.authority,result.sociology])if(!field.zh.trim()||!field.en.trim())errors.push("The work map and sociological reading must be substantive in both languages.");
  if(!result.questions.length)errors.push("Include a role-specific follow-up question.");
  for(const term of result.terms)if(!term.alternative.zh.trim()||!term.alternative.en.trim()||!term.question.zh.trim()||!term.question.en.trim())errors.push("Each term needs a bilingual alternative and a targeted follow-up.");
  if(!d.workMap.quotes.length||!d.sociologyQuotes.length)errors.push("The work map and sociological reading need source anchors.");
  if(!d.deliverables.length)errors.push("At least one source-grounded proposed deliverable is required.");
  for(const term of result.terms)if(!raw.includes(term.term))errors.push("Preserve each competence expression verbatim in term.");
  if(result.terms.some(x=>/核对它实际修饰的动作|把SQL放回任务对象|需要结合上下文才能判断/.test(x.meaning.zh)))errors.push("Replace generic reading instructions with a concrete interpretation of this JD.");
 }
 return [...new Set(errors)];
}
