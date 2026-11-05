import {ANALYSIS_INSTRUCTIONS} from "./analysis-prompt";
import {resultSchema,modelOutputSchema,deepEvidenceErrors} from "./analysis-contract";
import {evidenceErrors} from "./analysis-engine";
import {requestModelJson,type ModelProvider} from "./model-client";
import type {AnalysisResult,CorpusEntry,CompanyContext} from "./observatory-types";

type ReadingRequest={apiKey:string;model:string;provider?:ModelProvider;raw:string;title:string;company?:string;context?:CompanyContext;onProgress?:(stage:string)=>void;comparators:CorpusEntry[];methodNote:string;request?:typeof fetch};
export async function runModelReading(options:ReadingRequest):Promise<{result:AnalysisResult;calls:number}>{
 const request=options.request||fetch;
 const deadline=Date.now()+(options.provider==="deepseek"?120000:52000);
 let repair:string[]=[];
 // One normal call; one bounded repair only for an observable contract failure.
 for(let attempt=0;attempt<2;attempt++){
  const remaining=deadline-Date.now();if(remaining<5000)throw new Error("analysis_deadline");
  options.onProgress?.(attempt?"repairing":"analysis");
  const text=await requestModelJson({provider:options.provider,apiKey:options.apiKey,model:options.model,request,timeoutMs:remaining,maxOutputTokens:7500,instructions:ANALYSIS_INSTRUCTIONS,schemaName:"jd_context_reading_v2",schema:modelOutputSchema,input:{title:options.title,jd:options.raw,employerLabel:options.company||null,sourceContext:options.context||null,methodNote:options.methodNote,comparators:options.comparators.map(c=>({id:c.id,title:c.title,reading:c.semantic||null})),repairRequirements:repair}});
  options.onProgress?.("validating");
  let result:AnalysisResult;
  try{const parsed=resultSchema.safeParse(JSON.parse(text));if(!parsed.success){repair=parsed.error.issues.slice(0,6).map(issue=>`${issue.path.join(".")}: ${issue.message}`);continue;}result=parsed.data;}catch{repair=["Return the entire valid bilingual v2 schema object as JSON. Do not omit required fields."];continue;}
  repair=[...evidenceErrors(result,options.raw),...deepEvidenceErrors(result,options.raw,true,true)];
  const allowed=new Set(options.comparators.map(c=>c.id));
  if(result.comparisons.some(c=>!allowed.has(c.id)))repair.push("Only supplied comparator IDs are allowed; if none were supplied, comparisons must be empty.");
  if(!repair.length){if(options.context)result.context=options.context;return {result,calls:attempt+1};}
 }
 throw new Error("model_contract_invalid_after_one_repair");
}
