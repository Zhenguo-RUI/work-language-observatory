import type {AnalysisResult} from "./observatory-types";

/** Conservative, visible extraction helpers, not a claim to exhaust every competence. */
export function extractAdvertisedCompetenceTerms(raw:string):string[]{
 const pattern=/抗压(?:能力)?(?:强|良好)?|自驱力?(?:强)?|自我驱动(?:能力)?|(?:良好的?|较强的?|优秀的?)?(?:沟通(?:协调)?|协调|学习|逻辑思维|执行|团队协作|时间管理|独立思考|独立工作)(?:能力|意识)?(?:强)?|责任心(?:强)?|耐心|细心|主动性|积极主动|数据敏感(?:性)?|独立负责/gu;
 return [...new Set(Array.from(raw.matchAll(pattern),m=>m[0]))];
}

/** Only numbered clauses inside an explicitly labelled duties section are counted. */
export function extractNumberedDuties(raw:string):string[]{
 const heading=/(?:工作职责|岗位职责|工作内容|岗位描述|职位描述|Responsibilities|Duties)\s*[：:]?/i.exec(raw);
 if(!heading)return [];
 let section=raw.slice(heading.index+heading[0].length);
 const end=/(?:任职要求|职位要求|岗位要求|工作要求|任职条件|基本任职条件|申请方式|投递方式|Qualifications|Requirements|Benefits)\s*[：:]?/i.exec(section);
 if(end)section=section.slice(0,end.index);
 const marks=Array.from(section.matchAll(/(?:^|\n|[；;。]\s*)(?:[ \t]*)(?:[\d]+[、.．)）]|[①②③④⑤⑥⑦⑧⑨⑩])\s*/g));
 return marks.map((m,i)=>section.slice(m.index!+m[0].length,marks[i+1]?.index??section.length).trim()).filter(Boolean);
}

export function currentReadingErrors(result:AnalysisResult,raw:string):string[]{
 const errors:string[]=[];
 if(!Array.isArray(result.competenceWords))errors.push("competenceWords: supply the separate advertised competence-word analysis, including [] if absent.");
 const words=result.competenceWords||[];
 for(const term of extractAdvertisedCompetenceTerms(raw))if(!words.some(w=>w.term.includes(term)))errors.push(`competenceWords: preserve the advertised expression verbatim: ${term}`);
 for(const [i,w]of words.entries()){
  const path=`competenceWords[${i}]`;
  if(!raw.includes(w.term)||!raw.includes(w.quote)||!w.quote.includes(w.term))errors.push(`${path}: term and containing sentence must be exact contiguous JD spans.`);
  if(w.evidenceQuotes.some(q=>!raw.includes(q)))errors.push(`${path}.evidenceQuotes: every supporting duty/condition must be an exact source span.`);
  if(!w.meaning.zh.trim()||!w.meaning.en.trim())errors.push(`${path}.meaning: explain the local meaning in both languages.`);
  if(!w.evidenceQuotes.length&&(!w.question.zh.trim()||!w.question.en.trim()||!/未(?:写|说|明确)|没(?:写|说)|不清楚/.test(w.meaning.zh)))errors.push(`${path}: without supporting duties, say what the JD leaves unclear and give a bilingual clarification question.`);
 }
 const duties=extractNumberedDuties(raw),items=result.depth?.deliverables||[],coverage=result.depth?.dutyCoverage;
 if(!coverage)errors.push("depth.dutyCoverage: supply the coverage map, including [] when no numbered duties are detected.");
 if(duties.length){
  for(const quote of duties)if(!coverage?.some(c=>c.quote===quote))errors.push("depth.dutyCoverage: every numbered source duty needs its exact full clause and destination indexes.");
  for(const c of coverage||[]){
   if(!duties.includes(c.quote))errors.push("depth.dutyCoverage.quote must equal a supplied sourceDuties clause.");
   if(!c.deliverableIndexes.length||c.deliverableIndexes.some(i=>!Number.isInteger(i)||i<0||i>=items.length))errors.push("depth.dutyCoverage: indexes must refer to existing deliverables.");
  }
  const mapped=new Set(coverage?.flatMap(c=>c.deliverableIndexes)||[]);
  if(items.some((_,i)=>!mapped.has(i)))errors.push("depth.dutyCoverage: every generated deliverable needs a source duty.");
  if(duties.length!==items.length&&!coverage?.some(c=>c.mergeReason.zh.trim()&&c.mergeReason.en.trim()))errors.push("depth.dutyCoverage: source/output duty counts differ; provide a bilingual merge/split explanation.");
 }
 // This narrow direction guard supplements, never replaces, existing evidence checks.
 if(/外呼|呼出|主动(?:拨打|致电)|outbound/i.test(raw)&&!/接听|来电|呼入|inbound|incoming calls?/i.test(raw)){
  for(const item of items)for(const field of [item.task,item.object,item.action])if(field&&/接听(?:电话|来电)|呼入|answer(?:ing)? incoming|inbound calls?/i.test(field.zh+" "+field.en))errors.push("depth.deliverables: the JD specifies outbound calls, not answering inbound calls; preserve direction.");
 }
 return [...new Set(errors)];
}
