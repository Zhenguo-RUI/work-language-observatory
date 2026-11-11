import {hasChinese} from "./localization";
import {analysisFidelityErrors} from "./analysis-fidelity";
import {publicCompanySourceUrl} from "./company-source-url";
import {companyBriefOutputSchema} from "./company-brief";
import {z} from "zod";
import {SOCIOLOGY_CONCEPT_IDS} from "./sociology-references";
import type {AnalysisResult} from "./observatory-types";

const bi=z.object({zh:z.string().max(3500),en:z.string().max(5000)});
const officialProfileUrls=new Set(["https://www.zgcgroup.com.cn/xwzx/jtyw/art/2026/art_29b3aa9dd2af476f879ac0b6573430bc.html","https://www.tencent.com/who-we-are/","https://www.mi.com/global/about/","https://www.bytedance.com/?locale=en","https://www.douyinec.com/","https://www.oceanengine.com/"]);
const sourceUrl=z.string().url().max(1500).refine(publicCompanySourceUrl,"Use a public HTTP(S) source URL without credentials.");
const date=z.union([z.string().datetime(),z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]);
const companyLookup=z.object({query:z.string().max(160),status:z.enum(["matched","ambiguous","not_found","unavailable"]),provider:z.string().max(160),searchedAt:date,selectedId:z.string().max(120).optional(),matches:z.array(z.object({id:z.string().max(120),title:z.string().max(350),url:sourceUrl,snippet:z.string().max(2500),kind:z.enum(["encyclopedia","search"]),retrievedAt:date,nameZh:z.string().max(200).optional(),nameEn:z.string().max(250).optional(),match:z.enum(["exact","alias","candidate"])})).max(6)});
const companyContext=z.object({company:z.object({name:bi,relationship:z.enum(["employer","platform","client","unresolved"]),description:bi,basis:z.enum(["official","retrieved","jd"])}),industry:z.object({name:bi,description:bi,basis:z.literal("jd")}),implication:bi,sources:z.array(z.object({id:z.string().max(120).optional(),title:z.string().min(1).max(350),url:sourceUrl,retrievedAt:date,verification:z.enum(["live","reviewed"]).optional(),kind:z.enum(["official","encyclopedia","search"]).optional(),excerpt:z.string().max(2500).optional()})).max(8),status:z.enum(["verified","sourced","jd_only","unavailable"]),evidence:z.array(z.string().max(500)).max(3),notice:bi,lookup:companyLookup.optional(),companyEvidence:z.array(z.object({sourceId:z.string().max(120),quote:z.string().max(200)})).max(3).optional(),briefBasis:z.enum(["model","source"]).optional()}).superRefine((value,ctx)=>{if((value.status==="verified"||value.company.basis!=="jd")&&!value.sources.length)ctx.addIssue({code:z.ZodIssueCode.custom,path:["sources"],message:"An externally sourced profile needs its source."});if(value.company.basis==="official"&&!value.sources.some(s=>s.kind==="official"||officialProfileUrls.has(s.url)))ctx.addIssue({code:z.ZodIssueCode.custom,path:["sources"],message:"Official basis requires an official source, not a search snippet."});});
const questionTest=z.object({questionIndex:z.number().int().min(0).max(5),answerA:bi,answerB:bi,difference:bi,quote:z.string().min(1).max(1500)});
const duty=z.object({task:bi,quote:z.string().min(1).max(1500),output:bi,check:bi,object:bi.optional(),action:bi.optional(),purpose:bi.optional(),scenario:z.object({kind:z.literal("hypothetical"),text:bi}).optional()});
const competency=z.object({level:z.enum(["required","preferred","suggested","clarify"]),skill:bi,application:bi,quote:z.string().max(1500)}).superRefine((value,ctx)=>{
 if((value.level==="required"||value.level==="preferred")&&!value.quote.trim())ctx.addIssue({code:z.ZodIssueCode.custom,path:["quote"],message:"An advertised requirement or preference needs its exact JD clause."});
});
const preparation=z.object({competencies:z.array(competency).max(10),materials:z.array(bi).max(3),practice:z.array(z.object({question:bi,approach:bi})).max(2)});
const depth=z.object({protocol:z.literal("work-language-v2"),basis:z.enum(["model","rules"]),workMap:z.object({object:bi,tools:bi,partners:bi,authority:bi,quotes:z.array(z.string().min(1).max(1500)).max(5)}),deliverables:z.array(duty).max(6),dutyCoverage:z.array(z.object({quote:z.string().min(1).max(1500),deliverableIndexes:z.array(z.number().int().min(0).max(5)).min(1).max(6),mergeReason:bi})).max(30).optional(),preparation:preparation.optional(),example:z.object({kind:z.literal("hypothetical"),scenario:bi,steps:z.array(bi).min(2).max(6),lesson:bi}).nullable(),sociologySummary:bi.optional(),sociologyConceptId:z.enum(SOCIOLOGY_CONCEPT_IDS).nullable().optional(),sociologyQuotes:z.array(z.string().min(1).max(1500)).max(5),questionTests:z.array(questionTest).max(3).optional()});

// Optional depth keeps previously stored, reviewed cases editable.
export const resultSchema=z.object({analysisVersion:z.string().min(1).max(80).optional(),competenceWords:z.array(z.object({term:z.string().min(1).max(120),quote:z.string().min(1).max(1500),meaning:bi,evidenceQuotes:z.array(z.string().min(1).max(1500)).max(6),question:bi})).max(30).optional(),headline:bi,role:bi,terms:z.array(z.object({term:z.string().min(1).max(120),meaning:bi,quote:z.string().min(1).max(1500),alternative:bi,question:bi})).min(1).max(6),sociology:bi,questions:z.array(bi).max(6),conditions:z.array(bi).max(8),gaps:z.array(bi).max(8),comparisons:z.array(z.object({id:z.string().max(100),title:z.string().max(200),titleEn:z.string().max(800).optional(),reading:bi})).max(5),depth:depth.optional(),sourceTranslation:z.object({titleEn:z.string().min(1).max(800),paragraphs:z.array(z.object({source:z.string().min(1).max(24000),en:z.string().min(1).max(8000)})).min(1).max(500),basis:z.enum(["model","curated","browser","original"]),sourceHash:z.string().length(64)}).optional(),context:companyContext.optional()});
const str={type:"string"};
const object=(properties:Record<string,unknown>)=>({type:"object",additionalProperties:false,properties,required:Object.keys(properties)});
const bilingual=object({zh:str,en:str});
const array=(items:unknown)=>({type:"array",items});
const preparationSchema=object({competencies:array(object({level:{type:"string",enum:["required","preferred","suggested","clarify"]},skill:bilingual,application:bilingual,quote:str})),materials:{...array(bilingual),maxItems:2},practice:{...array(object({question:bilingual,approach:bilingual})),maxItems:2}});
const depthSchema=object({protocol:{type:"string",enum:["work-language-v2"]},basis:{type:"string",enum:["model"]},workMap:object({object:bilingual,tools:bilingual,partners:bilingual,authority:bilingual,quotes:array(str)}),dutyCoverage:array(object({quote:str,deliverableIndexes:array({type:"integer",minimum:0,maximum:5}),mergeReason:bilingual})),deliverables:array(object({task:bilingual,quote:str,object:bilingual,action:bilingual,purpose:bilingual,scenario:object({kind:{type:"string",enum:["hypothetical"]},text:bilingual}),output:bilingual,check:bilingual})),preparation:preparationSchema,example:{anyOf:[object({kind:{type:"string",enum:["hypothetical"]},scenario:bilingual,steps:array(bilingual),lesson:bilingual}),{type:"null"}]},sociologySummary:bilingual,sociologyConceptId:{anyOf:[{type:"string",enum:[...SOCIOLOGY_CONCEPT_IDS]},{type:"null"}]},sociologyQuotes:array(str),questionTests:array(object({questionIndex:{type:"integer"},answerA:bilingual,answerB:bilingual,difference:bilingual,quote:str}))});
export const modelOutputSchema=object({competenceWords:array(object({term:str,quote:str,meaning:bilingual,evidenceQuotes:array(str),question:bilingual})),headline:bilingual,role:bilingual,terms:array(object({term:str,meaning:bilingual,quote:str,alternative:bilingual,question:bilingual})),sociology:bilingual,questions:array(bilingual),conditions:array(bilingual),gaps:array(bilingual),comparisons:array(object({id:str,title:str,reading:bilingual})),depth:depthSchema,companyBrief:companyBriefOutputSchema});

type FactField={path:string;value:{zh:string;en:string}};
// Assertions only. Proposed outputs, examples, questions and preparation
// exercises must not be mistaken for additional advertised requirements.
function assertedFields(result:AnalysisResult):FactField[]{
 const fields:FactField[]=[{path:"headline",value:result.headline},{path:"role",value:result.role},{path:"sociology",value:result.sociology}];
 result.competenceWords?.forEach((word,index)=>fields.push({path:`competenceWords[${index}].meaning`,value:word.meaning}));
 result.terms.forEach((term,index)=>fields.push({path:`terms[${index}].meaning`,value:term.meaning}));
 result.conditions.forEach((value,index)=>fields.push({path:`conditions[${index}]`,value}));
 if(result.depth){
  if(result.depth.sociologySummary)fields.push({path:"depth.sociologySummary",value:result.depth.sociologySummary});
  for(const key of ["object","tools","partners","authority"] as const)fields.push({path:`depth.workMap.${key}`,value:result.depth.workMap[key]});
  result.depth.deliverables.forEach((item,index)=>{for(const key of ["task","object","action","purpose"] as const)if(item[key])fields.push({path:`depth.deliverables[${index}].${key}`,value:item[key]});});
  result.depth.preparation?.competencies.forEach((item,index)=>{if(item.level==="required"||item.level==="preferred")for(const key of ["skill","application"] as const)fields.push({path:`depth.preparation.competencies[${index}].${key}`,value:item[key]});});
 }
 return fields;
}

const sentences=(text:string)=>text.split(/[。！？;；\n]|(?<=[.!?])\s+/u);
const modalOrIllustrative=/假设|假如|例如|举例|建议|练习|是否|待确认|未(?:说明|写明|明确)|不(?:代表|等于|意味着)|不能(?:据此)?推断|\b(?:if|suppose|hypothetical|for example|suggested|practice|whether|unspecified|not specified)\b/i;

// Source-aligned lexical alternatives, not a general entailment model. The
// guard catches an explicit OR rewritten as a conjunction when its two arms
// survive. Paraphrases still require semantic review.
function alternativeForceErrors(result:AnalysisResult,raw:string):string[]{
 const alternatives:{left:string;right:string;language:"zh"|"en"}[]=[];
 for(const clause of raw.split(/[，,。；;\n！？!?]/u)){
  for(const language of ["zh","en"] as const){
   const parts=clause.split(language==="zh"?/或(?:者)?/:/\s+or\s+/i);
   if(parts.length<2)continue;
   const clean=(part:string)=>part.trim().replace(language==="zh"?/^(?:(?:岗位|任职|工作)?要求[:：]?|能够|必须|需要|具备|具有|熟悉|掌握|负责|能|需)+/:/^(?:(?:must|should|can|able to|required to|ability to|proficient in)\s+)+/i,"").replace(/[.!。]$/u,"");
   for(let i=1;i<parts.length;i++){
    const left=clean(parts[i-1]),right=clean(parts[i]);
    if(left.length>=2&&right.length>=2&&left.length<=45&&right.length<=45&&!/以上|以下|以内|or more|or less/i.test(`${left} ${right}`))alternatives.push({left,right,language});
   }
  }
 }
 const errors:string[]=[];
 const choice=/或|任选|任一|之一|可选|两种(?:方式|模式)|不同(?:方式|模式)|\b(?:or|either|alternative|alternatives|choice|choose|one of)\b/i;
 for(const field of assertedFields(result))for(const alternative of alternatives){
  const {left,right,language}=alternative,text=field.value[language],normalize=(value:string)=>language==="en"?value.toLowerCase():value;
  const matching=sentences(text).filter(sentence=>normalize(sentence).includes(normalize(left))&&normalize(sentence).includes(normalize(right)));
  for(const sentence of matching){
   if(choice.test(sentence)||modalOrIllustrative.test(sentence))continue;
   const a=normalize(sentence).indexOf(normalize(left)),b=normalize(sentence).indexOf(normalize(right)),between=a<b?sentence.slice(a+left.length,b):sentence.slice(b+right.length,a);
   // “可 A，也可能 B” presents possible modes, not a requirement for both.
   // Keep the exemption local to both arms: “可 A，也必须 B” still fails.
   const before=sentence.slice(0,Math.min(a,b));
   if(language==="zh"&&/(?:可(?:以)?|可能)[^，,；;]{0,12}$/.test(before)&&/也(?:有时)?(?:可能|可(?:以)?)[^，,；;]{0,12}$/.test(between))continue;
   if(/也|同时|兼|并且|以及|还|和|与|、|又|且|\b(?:and|both|as well as)\b/i.test(between)||/既|同时|\bboth\b/i.test(sentence))errors.push(`${field.path}.${language}: preserve the source alternatives “${left} / ${right}”; do not turn OR into simultaneous duties or a requirement for both capacities.`);
  }
  // A Chinese alternative must not acquire an English AND during translation.
  if(language==="zh"&&matching.some(sentence=>choice.test(sentence)&&!modalOrIllustrative.test(sentence))&&!choice.test(field.value.en)&&!modalOrIllustrative.test(field.value.en)&&/\b(?:and|both|as well as)\b/i.test(field.value.en))errors.push(`${field.path}.en: the corresponding Chinese claim retains a source OR; preserve that alternative in English rather than requiring both.`);
 }
 return [...new Set(errors)];
}

function unresolvedQualificationGroup(raw:string,quote:string):boolean{
 if(!quote.trim())return false;
 const incomplete:{start:number;end:number}[]=[];
 for(const match of raw.matchAll(/(?:\[|【)(?:[^\]】\n]{0,24})(?:截断|未完|不完整|truncated)(?:[^\]】\n]{0,24})(?:\]|】)/gi)){
  const prefix=raw.slice(0,match.index),boundary=Math.max(...["，",",","。","；",";","\n"].map(mark=>prefix.lastIndexOf(mark)));
  const start=boundary+1,group=prefix.slice(start);
  // An explicit surviving modifier resolves the group; an ordinary incomplete
  // list can still have a missing final modifier governing all of its items.
  if(/必须|必需|硬性|须(?:具备|具有|掌握)|优先|加分|\b(?:must|required|mandatory|essential|preferred)\b/i.test(group))continue;
  incomplete.push({start,end:match.index!+match[0].length});
 }
 let at=raw.indexOf(quote),seen=false;
 while(at>=0){
  seen=true;
  if(!incomplete.some(span=>at<span.end&&at+quote.length>span.start))return false;
  at=raw.indexOf(quote,at+1);
 }
 return seen;
}

// A narrow guard for a recurring inference: assisting does not itself establish
// exclusion from decisions. This is not a general judge of organizational power.
function unsupportedAuthorityDenials(result:AnalysisResult,raw:string):string[]{
 if(!/协助|辅助|帮助|参与|初稿|草稿|草拟|\bassist(?:ing|ance)?\b|\bhelp(?:ing)?\b|\bsupport(?:ing)?\b|\bparticipat\w*\b|\bdraft(?:s|ing)?\b/i.test(raw))return [];
 const fields=assertedFields(result);
 const sourceClauses=raw.split(/[。！？;；\n]/);
 const isExplicit=(clause:string)=>/无权|没有.{0,8}(?:权|权限)|不(?:参与|负责).{0,12}(?:决策|审批|批准|定稿|判断|结论)|不(?:独立)?(?:作出|给出|形成).{0,12}(?:判断|结论)|不得.{0,12}(?:决策|审批|批准|定稿|判断|结论)|(?:由|须经|需经|报).{1,35}(?:审批|批准|定稿|决策|决定|拍板|掌握|负责|给出|作出)|(?:审批|批准|定稿|决策|决定|判断|结论).{0,8}由.{1,35}/.test(clause)||/\b(?:no|without|lacks?)\b.{0,25}\b(?:authority|decision rights?)\b|\b(?:approval|sign.off|decision|judg(?:e)?ment|conclusion)\b.{0,35}\b(?:by|with|requires?)\b|\b(?:manager|committee|director|supervisor)\b.{0,20}\b(?:approves?|decides?|signs? off)\b/i.test(clause);
 const targets=[/投资.{0,5}(?:判断|结论)|investment[- ](?:judg(?:e)?ment|conclusions?)/i,/投资.{0,5}(?:决策|拍板|批准)|(?:拍板|决策|批准).{0,5}投资|investment[- ](?:decisions?|approval)/i,/预算|budget/i,/定稿|sign.off|finali[sz]/i,/审批|批准|approval/i,/判断|结论|judg(?:e)?ment|conclusion/i];
 const uncertain=/未(?:说明|写明|明确|披露|交代)|没有(?:说明|写明|明确)|尚不清楚|待确认|未必|可能|或许|不等于|不代表|不能(?:据此|直接)?(?:认定|推定|推断)|不意味着|(?:not|never)\s+(?:necessarily|stated|specified|established)|does not\s+(?:state|specify|establish|imply|demonstrate)|cannot\s+(?:infer|conclude|establish)|unspecified|unknown|\b(?:may|might|could|whether|if|suppose|hypothetical)\b|假设|假如|举例|例如/i;
 const denies=/(?:不|没有|无|未)(?:掌握|拥有|具备|享有|获得|赋予|授予)?[^。；;]{0,24}(?:最终定稿权|审批权|批准权|决策权|决定权)|(?:未赋予|未授予|未获得).{0,24}权限|(?:而非|而不是|不是|并非|不能|不得)[^。；;]{0,12}(?:独立|自行|独自)[^。；;]{0,16}(?:拍板|决策|批准|决定|判断|结论)|投资判断.{0,12}(?:仍|依然)?由.{0,15}(?:团队|导师|领导).{0,10}(?:掌握|决定|负责)|\b(?:no|without|lack(?:s|ing)?|not)\b.{0,40}\b(?:final sign.off|approval authority|decision rights?|decision.making authority)\b|\b(?:rather than|not)\b.{0,18}\bindependently\b.{0,25}\b(?:setting|deciding|approving|making)\b|rather than\s+(?:approving|deciding).{0,25}\b(?:alone|independently)\b|\bnot\s+(?:independent\s+)?ownership\s+of.{0,35}\b(?:judg(?:e)?ment|conclusions?|decisions?)\b|\b(?:cannot|does not|not)\b.{0,16}\bindependent(?:ly)?\b.{0,30}\b(?:judg(?:e)?ments?|conclusions?)\b|investment judg(?:e)?ment\s+(?:stays?|remains?)\s+with\b/i;
 const errors:string[]=[];
 for(const field of fields)for(const language of ["zh","en"] as const){
  for(const sentence of sentences(field.value[language])){
   if(uncertain.test(sentence)||!denies.test(sentence))continue;
   const target=targets.find(pattern=>pattern.test(sentence));
   if(sourceClauses.some(clause=>isExplicit(clause)&&(!target||target.test(clause))))continue;
   errors.push(`${field.path}.${language}: helping or assisting does not establish missing decision rights or that investment judgment belongs elsewhere. State that the JD does not specify the authority, or cite an explicit, relevant approval/exclusion clause; do not infer a denial from support verbs.`);
  }
 }
 return [...new Set(errors)];
}

/** Validate the new explanatory fields without treating invented examples as advertised facts. */
export function operationalBreakdownErrors(result:AnalysisResult,raw:string,required=false):string[]{
 const errors:string[]=[],d=result.depth;
 if(!d){if(required)errors.push("depth: the operational breakdown is missing.");return errors;}
 const facts:{path:string;value:{zh:string;en:string}}[]=[];
 const bilingual=(value:{zh:string;en:string}|undefined,path:string)=>{if(!value?.zh.trim()||!value.en.trim())errors.push(`${path}: provide a substantive explanation in both languages.`);};
 const hasSociology=Boolean(result.sociology.zh.trim()||result.sociology.en.trim());
 if(required&&(!d.sociologySummary||d.sociologyConceptId===undefined))errors.push("depth.sociologySummary: supply the bilingual summary and concept ID, or explicit empty summary and null concept when omitting the reading.");
 if(required||d.sociologySummary){
  if(hasSociology){
   bilingual(result.sociology,"sociology");bilingual(d.sociologySummary,"depth.sociologySummary");
   if(required){
    if(Array.from(result.sociology.zh.trim()).length>250)errors.push("sociology.zh: keep the analytical paragraph within 250 characters; omit it if no source-grounded concept fits.");
    for(const language of ["zh","en"] as const){
     const prose=result.sociology[language].trim();
     if(/[?？]["'”’]?$/u.test(prose))errors.push(`sociology.${language}: finish the analysis without a question; put a useful employer question in questions.`);
     if(/你可以|建议你|面试时|可以问|准备时|\byou (?:can|should)\b|\bask (?:how|whether|the team)\b|\ba useful question\b/i.test(prose))errors.push(`sociology.${language}: give analysis only, not preparation advice or interview questions.`);
    }
   }
   if(required&&!d.sociologyConceptId)errors.push("depth.sociologyConceptId: select one supplied, relevant concept or omit the sociological reading as a whole.");
   if(d.sociologySummary){
    facts.push({path:"depth.sociologySummary",value:d.sociologySummary});
    if(Array.from(d.sociologySummary.zh.trim()).length>60)errors.push("depth.sociologySummary.zh: keep the card summary within 60 characters; put the argument in sociology.");
   }
  }else if(d.sociologySummary?.zh.trim()||d.sociologySummary?.en.trim()||d.sociologyConceptId||d.sociologyQuotes.length){
   errors.push("sociology: an omitted reading needs empty bilingual prose and summary, no concept and no sociology anchors.");
  }
 }
 for(const [index,item] of d.deliverables.entries()){
  const path=`depth.deliverables[${index}]`,expanded=required||!!(item.object||item.action||item.purpose||item.scenario);
  if(!expanded)continue;
  facts.push({path:`${path}.task`,value:item.task});
  for(const key of ["object","action","purpose"] as const){bilingual(item[key],`${path}.${key}`);if(item[key])facts.push({path:`${path}.${key}`,value:item[key]});}
  if(!item.scenario||item.scenario.kind!=="hypothetical")errors.push(`${path}.scenario: label the illustrative case as hypothetical.`);
  else bilingual(item.scenario.text,`${path}.scenario.text`);
 }
 const prep=d.preparation;
 if(!prep){if(required)errors.push("depth.preparation: include source-typed competencies, proposed preparation material and a practice question.");}
 else{
  for(const [index,item] of prep.competencies.entries()){
   const path=`depth.preparation.competencies[${index}]`,advertised=item.level==="required"||item.level==="preferred";
   bilingual(item.skill,`${path}.skill`);bilingual(item.application,`${path}.application`);
   if(advertised&&!item.quote.trim())errors.push(`${path}.quote: advertised requirements and preferences need exact JD evidence.`);
   if(item.quote&&!raw.includes(item.quote))errors.push(`${path}.quote: use an exact source span from this JD.`);
   // Use a narrow qualification clause. A mixed hard/soft list must be split,
   // not promoted wholesale to a mandatory requirement.
   if(item.level==="required"&&/优先|加分|更佳|为佳|者佳|\bpreferred\b|\bnice[- ]to[- ]have\b|\ba plus\b|\bdesirable\b/i.test(item.quote))errors.push(`${path}.level: preserve preferred status; isolate the actual required clause if the quote mixes requirements and preferences.`);
   if(advertised&&unresolvedQualificationGroup(raw,item.quote))errors.push(`${path}.level: this quote belongs to an unfinished qualification group whose missing ending can qualify all items. Keep the affected group at clarify instead of assigning required/preferred status to its complete-looking earlier items.`);
   // Preserve explicit academic identity in the label. This narrow source-
   // anchored check does not infer ability from a degree or judge theory use.
   if(required&&advertised&&/学历|学位|研究生|在读|在校|本科(?:及|或|以上)/u.test(item.quote)){
    const degrees=[{source:/本科|学士/u,zh:/本科|学士/u,en:/\bbachelor(?:s|['’]s)?\b|\bundergraduate\b/i},{source:/硕士/u,zh:/硕士/u,en:/\bmaster(?:s|['’]s)?\b/i},{source:/博士/u,zh:/博士/u,en:/\bdoctoral\b|\bdoctorate\b|\bph\.?d\.?\b/i}];
    for(const degree of degrees)if(degree.source.test(item.quote))for(const language of ["zh","en"] as const)if(!degree[language].test(item.skill[language]))errors.push(`${path}.skill.${language}: retain the explicit degree level from the qualification quote, rather than replacing it with general training or ability.`);
    for(const degree of ["硕士","博士"] as const)if(item.quote.includes(`${degree}研究生`)){
     if(!new RegExp(`${degree}(?:研究)?生|在读${degree}|${degree}在读`,"u").test(item.skill.zh))errors.push(`${path}.skill.zh: preserve ${degree}研究生 as student status; academic training is not the advertised qualification.`);
     if(!/\bstudents?\b|\benrolled\b|\bpursuing\b|\bstudying\b/i.test(item.skill.en))errors.push(`${path}.skill.en: preserve the enrolled-student status in the source qualification, not merely a degree or analytical training.`);
    }
   }
   if(advertised){facts.push({path:`${path}.skill`,value:item.skill});facts.push({path:`${path}.application`,value:item.application});}
  }
  prep.materials.forEach((material,index)=>bilingual(material,`depth.preparation.materials[${index}]`));
  prep.practice.forEach((practice,index)=>{
   bilingual(practice.question,`depth.preparation.practice[${index}].question`);bilingual(practice.approach,`depth.preparation.practice[${index}].approach`);
   // Generation-only style checks: saved older answers remain readable.
   if(required)for(const language of ["zh","en"] as const){
    const text=practice.approach[language].trim(),path=`depth.preparation.practice[${index}].approach.${language}`;
    if(text&&!(language==="zh"?/我/u:/\bI\b/u).test(text))errors.push(`${path}: write a first-person interview answer (我会 / I would), without inventing past experience.`);
    const count=Array.from(new Intl.Segmenter(language,{granularity:"sentence"}).segment(text)).filter(part=>part.segment.trim()).length;
    if(count>3)errors.push(`${path}: use at most three sentences for the practice answer.`);
   }
  });
  if(required&&prep.materials.length>2)errors.push("depth.preparation.materials: keep at most two useful work samples; do not fill sparse evidence with exercises.");
  if(required&&prep.practice.length>2)errors.push("depth.preparation.practice: keep at most two specific business practice questions.");
 }
 // Reuse the existing source-aligned checks for newly asserted tasks and
 // qualifications. Proposed outputs, practice tasks and scenarios stay outside.
 const projected={...result,conditions:facts.map(field=>field.value)};
 for(const error of analysisFidelityErrors(projected,raw)){
  const match=error.match(/^conditions\[(\d+)\](.*)$/);
  if(match&&facts[Number(match[1])])errors.push(`${facts[Number(match[1])].path}${match[2]}`);
 }
 if(required||d.preparation||d.deliverables.some(item=>item.object))errors.push(...unsupportedAuthorityDenials(result,raw),...alternativeForceErrors(result,raw));
 return [...new Set(errors)];
}

export function deepEvidenceErrors(result:AnalysisResult,raw:string,requireModelDepth=false,requireQuestionTests=false,requireOperationalBreakdown=false):string[]{
 const errors:string[]=[];const d=result.depth;
 for(const anchor of result.context?.companyEvidence||[])if(!result.context?.sources.find(s=>s.id===anchor.sourceId)?.excerpt?.includes(anchor.quote))errors.push("Company evidence must match an existing external source excerpt.");
 if(result.context?.evidence.some(quote=>!raw.includes(quote)))errors.push("Company-context evidence must be an exact source span from this JD.");
 if(!d){if(requireModelDepth||requireOperationalBreakdown)errors.push("The v2 work map and deliverables are missing.");return errors;}
 errors.push(...operationalBreakdownErrors(result,raw,requireOperationalBreakdown));
 for(const quote of [...d.workMap.quotes,...d.deliverables.map(x=>x.quote),...d.sociologyQuotes])if(!raw.includes(quote))errors.push("A work-map, deliverable or sociology quote is not an exact source span.");
 for(const item of d.deliverables)if(!item.task.zh.trim()||!item.task.en.trim()||!item.output.zh.trim()||!item.output.en.trim()||!item.check.zh.trim()||!item.check.en.trim())errors.push("A proposed deliverable lacks a bilingual task, output or acceptance check.");
 const tests=d.questionTests||[];
 if(requireQuestionTests&&result.questions.length&&!tests.length)errors.push("depth.questionTests: show how two possible answers to a priority question would change the reading; these are hypothetical answers, not employer testimony.");
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
  for(const field of [d.workMap.object,d.workMap.tools,d.workMap.partners,d.workMap.authority])if(!field.zh.trim()||!field.en.trim())errors.push("The work map and sociological reading must be substantive in both languages.");
  if(requireOperationalBreakdown&&result.questions.length>3)errors.push("questions: include at most three substantive employer follow-ups.");
  for(const term of result.terms)if(!term.alternative.zh.trim()||!term.alternative.en.trim()||!term.question.zh.trim()||!term.question.en.trim())errors.push("Each term needs a bilingual alternative and a targeted follow-up.");
  if(!d.workMap.quotes.length)errors.push("The work map needs source anchors.");
  if((result.sociology.zh.trim()||result.sociology.en.trim())&&!d.sociologyQuotes.length)errors.push("The sociological reading needs source anchors.");
  if(!d.deliverables.length)errors.push("At least one source-grounded proposed deliverable is required.");
  for(const term of result.terms)if(!raw.includes(term.term))errors.push("Preserve each competence expression verbatim in term.");
  if(result.terms.some(x=>/核对它实际修饰的动作|把SQL放回任务对象|需要结合上下文才能判断/.test(x.meaning.zh)))errors.push("Replace generic reading instructions with a concrete interpretation of this JD.");
 }
 return [...new Set(errors)];
}
