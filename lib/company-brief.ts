import {z} from "zod";
import type {Bi,CompanyContext} from "./observatory-types";

const bilingual=z.object({zh:z.string().trim().min(1).max(1000),en:z.string().trim().min(1).max(1600)});
export const companyBriefSchema=z.object({nameEn:z.string().trim().min(1).max(200).optional(),overview:bilingual,relevance:bilingual,anchors:z.array(z.object({sourceId:z.string().min(1).max(120),quote:z.string().min(1).max(200)})).min(1).max(3)});
export type CompanyBrief=z.infer<typeof companyBriefSchema>;

export function companyBriefErrors(brief:CompanyBrief|undefined|null,context:CompanyContext|undefined):string[]{
 if(!brief)return context?.lookup?.status==="matched"&&context.sources.some(s=>s.excerpt)?["companyBrief: matched public company sources are available; provide a short sourced bilingual overview and a specific connection to this JD, with exact sourceId/quote anchors."]:[];
 if(!context?.lookup||context.lookup.status!=="matched")return ["companyBrief: no matched company source is available; return null rather than resolve an ambiguous company yourself."];
 const errors:string[]=[];
 for(const anchor of brief.anchors){const source=context.sources.find(s=>s.id===anchor.sourceId),match=context.lookup.matches.find(m=>m.id===anchor.sourceId);if(!source?.excerpt?.includes(anchor.quote)||!match||match.match==="candidate")errors.push("companyBrief.anchors: use only identity-matched company sources, with the existing sourceId and an exact source excerpt.");}
 if(/[\u3400-\u9fff]/u.test((brief.nameEn||"")+brief.overview.en+brief.relevance.en))errors.push("companyBrief: translate English prose completely; keep original source quotations only in anchors.");
 return [...new Set(errors)];
}

export function attachCompanyBrief(context:CompanyContext|undefined,brief:CompanyBrief|undefined|null):CompanyContext|undefined{
 if(!context||!brief||companyBriefErrors(brief,context).length)return context;
 return {...context,company:{...context.company,description:brief.overview,name:{...context.company.name,...(brief.nameEn?{en:brief.nameEn}:{})},basis:"retrieved"},status:"sourced",implication:brief.relevance,companyEvidence:brief.anchors,briefBasis:"model"};
}

export const companyBriefOutputSchema={anyOf:[{type:"null"},{type:"object",additionalProperties:false,required:["nameEn","overview","relevance","anchors"],properties:{nameEn:{type:"string"},overview:{type:"object",additionalProperties:false,required:["zh","en"],properties:{zh:{type:"string"},en:{type:"string"}}},relevance:{type:"object",additionalProperties:false,required:["zh","en"],properties:{zh:{type:"string"},en:{type:"string"}}},anchors:{type:"array",items:{type:"object",additionalProperties:false,required:["sourceId","quote"],properties:{sourceId:{type:"string"},quote:{type:"string"}}}}}}]};

export function sourcePreviewText(excerpt:string,lang:"zh"|"en"):Bi{
 const shortened=excerpt.trim().slice(0,lang==="zh"?180:300);
 return {zh:`公开资料摘要：${shortened}`,en:/[\u3400-\u9fff]/u.test(shortened)?"Public source material was found. Its original-language excerpt is available below; the JD analysis will provide a bilingual company brief.":`Public source summary: ${shortened}`};
}
