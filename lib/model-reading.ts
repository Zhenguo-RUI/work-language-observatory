import {currentReadingErrors,extractAdvertisedCompetenceTerms,extractNumberedDuties} from "./current-reading-contract";
import {companyBriefSchema,companyBriefErrors,attachCompanyBrief,companyBriefOutputSchema,type CompanyBrief} from "./company-brief";
import {ANALYSIS_INSTRUCTIONS,ANALYSIS_OUTPUT_LAYOUT} from "./analysis-prompt";
import {resultSchema,modelOutputSchema,deepEvidenceErrors} from "./analysis-contract";
import {evidenceErrors} from "./analysis-engine";
import {requestModelJson,type ModelProvider,type ModelRequestDiagnostics} from "./model-client";
import {planEnglishRepair,englishRepairOutputSchema,applyEnglishRepair,ENGLISH_REPAIR_INSTRUCTIONS,type EnglishRepair} from "./english-field-repair";
import {safeModelFailure} from "./usage-diagnostics";
import type {AnalysisResult,CorpusEntry,CompanyContext} from "./observatory-types";

// Company metadata, translation and provenance belong to the application. A bad
// optional company brief must not discard a separately verified JD reading.
const coreReadingSchema=resultSchema.omit({context:true,sourceTranslation:true,analysisVersion:true});
const briefOnlyOutputSchema={type:"object",additionalProperties:false,required:["companyBrief"],properties:{companyBrief:companyBriefOutputSchema}};
export const MODEL_READING_LIMITS={totalMs:270000,firstMs:200000,recoveryMs:90000,briefRepairMs:30000,englishRepairMs:30000,firstTokens:32768,recoveryTokens:24576,briefRepairTokens:6000,englishRepairTokens:4000} as const;
const recoverable=new Set(["model_network_error","model_timeout","model_incomplete_output","model_incomplete_stream","model_empty_response","model_invalid_response","model_invalid_stream","model_stream_error","model_http_429","model_http_500","model_http_502","model_http_503","model_http_504"]);

export type ReadingCallDiagnostics=ModelRequestDiagnostics&{phase:"generation"|"transport_recovery"|"contract_repair"|"english_repair"|"company_repair";attempt:number};
type ReadingRequest={apiKey:string;model:string;provider?:ModelProvider;raw:string;title:string;company?:string;context?:CompanyContext;onProgress?:(stage:string)=>void;onDiagnostics?:(diagnostics:ReadingCallDiagnostics)=>void;comparators:CorpusEntry[];methodNote:string;request?:typeof fetch;now?:()=>number};
function readBrief(value:unknown,context:CompanyContext|undefined):{brief:CompanyBrief|null;errors:string[]}{
 const parsed=companyBriefSchema.nullable().optional().safeParse(value);
 if(!parsed.success)return {brief:null,errors:parsed.error.issues.slice(0,5).map(issue=>`companyBrief.${issue.path.join(".")}: ${issue.message}`)};
 return {brief:parsed.data||null,errors:companyBriefErrors(parsed.data,context)};
}
function sourceOnlyContext(context:CompanyContext|undefined):CompanyContext|undefined{
 if(!context)return context;
 return {...context,briefBasis:"source",companyEvidence:undefined,company:{...context.company,description:{zh:context.company.description.zh,en:context.company.basis==="official"?context.company.description.en:"Company sources were found, but a verified bilingual company brief could not be completed. Consult the cited sources below."}},notice:{zh:"JD解读已保留；公司简介未完成可靠生成，本次只展示资料摘要与来源。"+context.notice.zh,en:"The JD reading is retained. A verified company brief could not be completed, so this card shows source material only. "+context.notice.en}};
}
export async function runModelReading(options:ReadingRequest):Promise<{result:AnalysisResult;calls:number}>{
 const request=options.request||fetch,now=options.now||Date.now,deepseek=options.provider==="deepseek";
 const deadline=now()+(deepseek?MODEL_READING_LIMITS.totalMs:52000);
 let repair:string[]=[],previousFinalJson:string|undefined,recoveryReason:string|undefined,verifiedCore:AnalysisResult|undefined,englishRepair:EnglishRepair|undefined,calls=0;
 const finish=(result:AnalysisResult,brief?:CompanyBrief|null,sourceOnly=false)=>{
  if(options.context)result.context=sourceOnly?sourceOnlyContext(options.context):attachCompanyBrief(options.context,brief);
  return {result,calls};
 };
 // At most two metered provider calls across generation, transport recovery,
 // evidence repair, English-field repair and company-only repair. Never salvage partial JSON.
 for(let attempt=0;attempt<2;attempt++){
  const remaining=deadline-now();if(remaining<5000){if(verifiedCore)return finish(verifiedCore,null,true);throw new Error("analysis_deadline");}
  const briefOnly=!!verifiedCore,englishOnly=!!englishRepair;
  const timeoutMs=Math.min(remaining,englishOnly?MODEL_READING_LIMITS.englishRepairMs:briefOnly?MODEL_READING_LIMITS.briefRepairMs:deepseek?(attempt?MODEL_READING_LIMITS.recoveryMs:MODEL_READING_LIMITS.firstMs):remaining);
  const phase:ReadingCallDiagnostics["phase"]=englishOnly?"english_repair":briefOnly?"company_repair":attempt?(recoveryReason?"transport_recovery":"contract_repair"):"generation";
  const onDiagnostics=(diagnostics:ModelRequestDiagnostics)=>{const entry={...diagnostics,phase,attempt:attempt+1};if(options.onDiagnostics)options.onDiagnostics(entry);else if(entry.outcome==="completed")console.info("Observatory provider request",entry);else console.warn("Observatory provider request",entry);};
  options.onProgress?.(attempt?(recoveryReason?"retrying":"repairing"):"analysis");
  let text:string;
  try{
   calls++;
   text=await requestModelJson({provider:options.provider,apiKey:options.apiKey,model:options.model,request,timeoutMs,onDiagnostics,maxOutputTokens:englishOnly?MODEL_READING_LIMITS.englishRepairTokens:briefOnly?2000:7500,maxCompletionTokens:briefOnly?MODEL_READING_LIMITS.briefRepairTokens:attempt?MODEL_READING_LIMITS.recoveryTokens:MODEL_READING_LIMITS.firstTokens,...(englishOnly?{thinking:false}:{}),reasoningEffort:attempt?"low":"high",instructions:englishOnly?ENGLISH_REPAIR_INSTRUCTIONS:briefOnly?ANALYSIS_INSTRUCTIONS+"\nThis is a company-only repair. Return only {companyBrief: ...}; do not regenerate the JD reading. If a sourced brief cannot be supported, return companyBrief:null.":ANALYSIS_INSTRUCTIONS,schemaName:englishOnly?"english_field_repair":briefOnly?"company_brief_repair":"jd_context_reading_v2",schema:englishOnly?englishRepairOutputSchema(englishRepair!):briefOnly?briefOnlyOutputSchema:modelOutputSchema,input:englishOnly?{title:options.title,jd:options.raw,fields:englishRepair!.targets}:{title:options.title,jd:options.raw,employerLabel:options.company||null,sourceContext:options.context||null,methodNote:options.methodNote,advertisedCompetenceTerms:extractAdvertisedCompetenceTerms(options.raw),sourceDuties:extractNumberedDuties(options.raw),comparators:briefOnly?[]:options.comparators.map(c=>({id:c.id,title:c.title,reading:c.semantic||null})),repairRequirements:repair,...(previousFinalJson?{previousFinalJson}:{}),...(recoveryReason?{recoveryReason}:{})}});
  }catch(error){
   if(verifiedCore)return finish(verifiedCore,null,true);
   const code=safeModelFailure(error);
   if(deepseek&&attempt===0&&recoverable.has(code)&&deadline-now()>5000){recoveryReason=code;repair=[];previousFinalJson=undefined;options.onProgress?.("retrying");await new Promise(resolve=>setTimeout(resolve,500));continue;}
   throw error;
  }
  options.onProgress?.("validating");
  let data:unknown;
  try{data=JSON.parse(text);}catch{
   if(verifiedCore)return finish(verifiedCore,null,true);
   // A malformed answer is not a repair template: repeating its misplaced
   // closing braces can reproduce the same error. Regenerate from the JD and
   // explicit layout, then run the normal schema and evidence checks below.
   repair=["The previous response was not one valid JSON object. Generate a fresh complete bilingual reading from the supplied JD and evidence; preserve every substantive duty and condition.",ANALYSIS_OUTPUT_LAYOUT,"Return one complete object with balanced braces and no trailing text. Do not return or complete a partial JSON fragment."];
   previousFinalJson=undefined;continue;
  }
  if(briefOnly){
   const candidate=data&&typeof data==="object"?(data as {companyBrief?:unknown}).companyBrief:undefined;
   const brief=readBrief(candidate,options.context);return finish(verifiedCore!,brief.errors.length?null:brief.brief,!!brief.errors.length);
  }
  if(englishOnly){
   const merged=applyEnglishRepair(englishRepair!,data);
   if(!merged)throw new Error("model_contract_invalid_after_one_repair");
   // Preserve the original company candidate and every non-target field. The
   // merged core still goes through parsing and the complete evidence checks.
   data={...merged,companyBrief:englishRepair!.companyBrief};englishRepair=undefined;
  }
  const parsed=coreReadingSchema.safeParse(data);
  if(!parsed.success){repair=parsed.error.issues.slice(0,6).map(issue=>`${issue.path.join(".")}: ${issue.message}`);previousFinalJson=text.slice(0,100000);continue;}
  const result=parsed.data;
  repair=[...new Set([...evidenceErrors(result,options.raw),...deepEvidenceErrors(result,options.raw,true,true,true),...currentReadingErrors(result,options.raw)])];
  const allowed=new Set(options.comparators.map(c=>c.id));
  if(result.comparisons.some(c=>!allowed.has(c.id)))repair.push("Only supplied comparator IDs are allowed; if none were supplied, comparisons must be empty.");
  const candidate=data&&typeof data==="object"?(data as {companyBrief?:unknown}).companyBrief:undefined;
  if(repair.length){
   if(attempt===0)englishRepair=planEnglishRepair(result,repair,candidate);
   previousFinalJson=englishRepair?undefined:text.slice(0,100000);continue;
  }
  const brief=readBrief(candidate,options.context);
  if(!brief.errors.length)return finish(result,brief.brief);
  // Only identity-matched company material merits a short second call. Other
  // company claims are discarded; they cannot invalidate a sound JD reading.
  if(attempt===1||options.context?.lookup?.status!=="matched")return finish(result,null,options.context?.lookup?.status==="matched");
  verifiedCore=result;repair=brief.errors;previousFinalJson=JSON.stringify({companyBrief:candidate??null}).slice(0,20000);
 }
 if(verifiedCore)return finish(verifiedCore,null,true);
 throw new Error("model_contract_invalid_after_one_repair");
}
