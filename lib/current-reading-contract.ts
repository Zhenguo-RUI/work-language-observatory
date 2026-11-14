import type {AnalysisResult} from "./observatory-types";

export const MAX_DUTY_GROUPS=8;
// Server-owned generation provenance; saved readings without it remain valid.
export const ANALYSIS_CONTRACT_REVISION="numbered-duty-scope-v2" as const;

/** Conservative, visible extraction helpers, not a claim to exhaust every competence. */
export function extractAdvertisedCompetenceTerms(raw:string):string[]{
 const pattern=/抗压(?:能力)?(?:强|良好)?|自驱力?(?:强)?|自我驱动(?:能力)?|(?:良好的?|较强的?|优秀的?)?(?:沟通(?:协调)?|协调|学习|逻辑思维|执行|团队协作|时间管理|独立思考|独立工作)(?:能力|意识)?(?:强|良好|好)?|责任心(?:强)?|耐心|细心|主动性|积极主动|数据敏感(?:性)?|独立负责/gu;
 return [...new Set(Array.from(raw.matchAll(pattern),m=>m[0]))];
}

/** Only numbered clauses inside an explicitly labelled duties section are counted. */
export function extractNumberedDuties(raw:string):string[]{
 const heading=/(?:工作职责|岗位职责|工作内容|岗位描述|职位描述|Responsibilities|Duties|(?:^|\n)[ \t]*职责)\s*[：:]?/i.exec(raw);
 if(!heading)return [];
 let section=raw.slice(heading.index+heading[0].length);
 const end=/(?:任职要求|职位要求|岗位要求|工作要求|任职条件|基本任职条件|申请方式|投递方式|Qualifications|Requirements|Benefits|(?:^|\n)[ \t]*要求[ \t]*[：:])\s*[：:]?/i.exec(section);
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
  if(duties.length<=MAX_DUTY_GROUPS){
   if(items.length!==duties.length)errors.push(`depth.deliverables: for ${duties.length} numbered source duties, keep exactly ${duties.length} separate groups in source order; do not merge or split independent numbered clauses.`);
   for(const [index,quote]of duties.entries()){
    const matches=coverage?.filter(c=>c.quote===quote)||[];
    if(matches.length!==1||matches[0].deliverableIndexes.length!==1||matches[0].deliverableIndexes[0]!==index)errors.push("depth.dutyCoverage: a short numbered list requires exactly one ordered mapping per source duty, with no shared, duplicate or split destination.");
    if(items[index]?.quote!==quote)errors.push("depth.deliverables.quote: each short-list group must retain its own full numbered source clause; do not borrow a neighboring duty's scope.");
    if(matches.some(c=>c.mergeReason.zh.trim()||c.mergeReason.en.trim()))errors.push("depth.dutyCoverage.mergeReason: separate short-list duties need empty merge reasons; do not invent a causal or workflow relationship between them.");
   }
  }
  if(duties.length>MAX_DUTY_GROUPS&&duties.length!==items.length&&!coverage?.some(c=>c.mergeReason.zh.trim()&&c.mergeReason.en.trim()))errors.push("depth.dutyCoverage: source/output duty counts differ; provide a bilingual merge/split explanation.");
 }
 errors.push(...unsupportedProcedureErrors(result,raw));
 // This narrow direction guard supplements, never replaces, existing evidence checks.
 if(/外呼|呼出|主动(?:拨打|致电)|outbound/i.test(raw)&&!/接听|来电|呼入|inbound|incoming calls?/i.test(raw)){
  for(const item of items)for(const field of [item.task,item.object,item.action])if(field&&/接听(?:电话|来电)|呼入|answer(?:ing)? incoming|inbound calls?/i.test(field.zh+" "+field.en))errors.push("depth.deliverables: the JD specifies outbound calls, not answering inbound calls; preserve direction.");
 }
 return [...new Set(errors)];
}

// A narrow source-action guard, not semantic entailment. In particular, checking
// records and reporting an issue does not establish authority to stop use/work.
// It also inspects scenarios: a fictional scene cannot turn an extra procedure
// into a mandatory company rule. A local conditional proposal remains allowed.
function unsupportedProcedureErrors(result:AnalysisResult,raw:string):string[]{
 const controls=[
  {name:"withholding or returning equipment to use",equipment:true,pattern:/停用|暂停使用|停止使用|禁用|不得使用|不可使用|禁止使用|(?:未|没有|不|勿|暂不).{0,8}(?:放回|归还|投入|恢复).{0,12}(?:可用|使用|运行)|等(?:待)?.{0,20}(?:后|再).{0,8}(?:放回|恢复使用)|\b(?:withhold|remov\w*|tak\w*).{0,30}(?:from use|from service|out of service)|\b(?:stop|suspend|prohibit).{0,15}(?:use|using)|\b(?:must not|do not|don't|may not|cannot)\s+(?:use|operate)\b|\b(?:not|never).{0,25}(?:returned|return|put).{0,25}(?:usable|use|service)|\bwait.{0,45}before.{0,25}(?:return|put)/i},
  {name:"halting work or production",equipment:false,pattern:/停工|停产|叫停|停止(?:作业|生产|流程|操作)|\b(?:halt|shut down|stop).{0,20}(?:production|operations?|work|process)/i},
  {name:"disposing of or returning materials",equipment:false,pattern:/销毁|报废|退货|\b(?:scrap|destroy|dispose of|return to (?:the )?supplier)\b/i}
 ];
 const equipment=/量具|卡尺|设备|仪器|机器|机台|测试台|\b(?:gauges?|calipers?|equipment|instruments?|machines?)\b/i;
 const permission=/(?:如果|若|在).{0,30}(?:约定|规定|流程|规程|授权|负责人).{0,20}(?:允许|许可|授权|同意|确认)|经.{0,20}(?:允许|许可|授权|同意).{0,5}(?:后|时)|\bif\b.{0,60}\b(?:agreed|approved|authorized|established)\b.{0,35}\b(?:procedure|policy|protocol)\b.{0,25}\b(?:allows?|permits?|authorizes?)\b|\bif authorized by\b|\bsubject to\b.{0,30}\b(?:approval|permission)\b/i;
 const qualified=/可(?:以)?考虑|建议(?:先)?(?:确认|询问)|待确认|是否|未(?:说明|写明|明确|要求)|没有(?:说明|要求)|不(?:代表|等于|意味着)|\b(?:whether|could consider|not specified|does not (?:state|specify|imply|require)|doesn't (?:state|specify|imply|require))\b/i;
 const authorityDenial=/无权|没有.{0,12}(?:决定权|审批权|权限|权力)|无.{0,8}(?:决定权|审批权)|未授权|\b(?:not authorized|no authority|lack(?:s)? authority)\b/i;
 // Negating a control action differs from prohibiting ordinary use: in
 // “不得使用量具” the match itself is the hold rule, with no negating prefix.
 const deniesControl=(clause:string,pattern:RegExp)=>{const match=pattern.exec(clause);return !!match&&(authorityDenial.test(clause)||/(?:不得|禁止|不能|不(?:要|应|可)|勿)(?:擅自|自行|独自|自己|直接)?(?:决定)?$|\b(?:must not|cannot|may not|do not|don't)\s+(?:(?:unilaterally|independently)\s+)?$/i.test(clause.slice(0,match.index)));};
 const negativeAdvice=(clause:string,pattern:RegExp)=>{
  if(/公司(?:规定|要求|政策)|按照?公司|\b(?:company (?:policy|requires?|rules?)|must)\b/i.test(clause))return false;
  const matches=[...clause.matchAll(new RegExp(pattern.source,pattern.flags+"g"))];
  return matches.length>0&&matches.every(match=>{
   const before=clause.slice(0,match.index),after=clause.slice(match.index!+match[0].length);
   return /(?:不要|勿|避免|不建议|不宜)(?:自行|擅自|独自|自己)(?:决定)?$/u.test(before)||(/\b(?:do not|don't|avoid)\s+(?:(?:unilaterally|independently)\s+)?$/i.test(before)&&(/\b(?:unilaterally|independently)\s*$/i.test(before)||/^.{0,25}\b(?:yourself|on your own|unilaterally)\b/i.test(after)));
  });
 };
 const recordReference=/(?:核对|查看|检查|登记|整理|汇总).{0,35}?(?:台账|记录|报告)|\b(?:check|review|inspect|record)\b.{0,50}?\b(?:logs?|records?|reports?)\b/i;
 const onlyNamesRecords=(clause:string,pattern:RegExp)=>{const match=recordReference.exec(clause);return !!match&&pattern.test(match[0])&&!pattern.test(clause.slice(0,match.index)+clause.slice(match.index+match[0].length));};
 const clauses=(text:string)=>text.split(/[，,。；;\n]|并(?:且)?|然后|\b(?:and|then)\b/iu);
 const duties=extractNumberedDuties(raw),errors:string[]=[];
 for(const [index,item]of(result.depth?.deliverables||[]).entries()){
  const anchors=(result.depth?.dutyCoverage||[]).filter(c=>c.deliverableIndexes.includes(index)&&duties.includes(c.quote)).map(c=>c.quote);
  const source=anchors.length?anchors.join("\n"):raw;
  const fields={task:item.task,object:item.object,action:item.action,purpose:item.purpose,output:item.output,check:item.check,scenario:item.scenario?.text};
  for(const control of controls){
   if(control.equipment&&!equipment.test(source+Object.values(fields).map(value=>value?value.zh+" "+value.en:"").join(" ")))continue;
   if(clauses(source).some(clause=>control.pattern.test(clause)&&!deniesControl(clause,control.pattern)&&!onlyNamesRecords(clause,control.pattern)))continue;
   const sourceDenial=clauses(source).some(clause=>control.pattern.test(clause)&&deniesControl(clause,control.pattern)&&!onlyNamesRecords(clause,control.pattern));
   for(const [key,value]of Object.entries(fields))if(value)for(const language of ["zh","en"] as const){
    for(const sentence of value[language].split(/[。！？;；\n]|(?<=[.!?])\s+/u)){
     if(source.includes(sentence.trim())||permission.test(sentence))continue;
     if(clauses(sentence).some(clause=>control.pattern.test(clause)&&!qualified.test(clause)&&!onlyNamesRecords(clause,control.pattern)&&!negativeAdvice(clause,control.pattern)&&!(sourceDenial&&deniesControl(clause,control.pattern))))errors.push(`depth.deliverables[${index}].${key}.${language}: the mapped source duty does not state ${control.name}. Do not assert an extra required procedure or authority; retain the stated action, or make the additional method explicitly conditional on the agreed procedure or permission.`);
    }
   }
  }
 }
 return [...new Set(errors)];
}
