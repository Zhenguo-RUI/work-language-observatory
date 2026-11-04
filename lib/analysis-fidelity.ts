import type {AnalysisResult} from "./observatory-types";

type Bilingual={zh:string;en:string};
const digits:Record<string,number>={零:0,〇:0,一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};
const words:Record<string,number>={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12};
const value=(s:string):number|null=>{if(/^\d+$/.test(s))return Number(s);if(s in words)return words[s];if(s in digits)return digits[s];if(/^[一二三四五六七八九]?十[一二三四五六七八九]?$/.test(s)){const [a,b]=s.split('十');return (a?digits[a]:1)*10+(b?digits[b]:0);}return null;};
const unit=(s:string)=>s==='年'?'year':s==='月'?'month':s==='天'?'day':'age';
const zhBounds=(text:string,upper=false)=>{
 const pattern=upper?/([零〇一二两三四五六七八九十\d]+)\s*个?\s*(年|月|天|岁)\s*(?:以)?内/g:/([零〇一二两三四五六七八九十\d]+)\s*个?\s*(年|月|天)\s*(?:及|或)?以上/g;
 const prefix=upper?/(?:至多|最多|不超过|≤)\s*([零〇一二两三四五六七八九十\d]+)\s*个?\s*(年|月|天|岁)/g:/(?:至少|最少|不低于|≥)\s*([零〇一二两三四五六七八九十\d]+)\s*个?\s*(年|月|天)/g;
 return [...text.matchAll(pattern),...text.matchAll(prefix)].map(m=>({n:value(m[1]),unit:unit(m[2]),text:m[0]})).filter(x=>x.n!==null);
};
const enBounds=(text:string,upper=false)=>{
 const pattern=new RegExp(`\\b${upper?'(?:under|less than)':'(?:over|more than|greater than)'}\\s+(\\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\\s+(?:[a-z]+\\s+){0,2}(years? old|years?|months?|days?)\\b`,'gi');
 const found=[...text.matchAll(pattern)].filter(m=>!/(?:not|no)\s*$/i.test(text.slice(Math.max(0,m.index!-8),m.index))).map(m=>({n:value(m[1].toLowerCase()),unit:/old$/i.test(m[2])?'age':m[2].toLowerCase().replace(/s$/,''),text:m[0]}));
 // Bare age expressions need source/local age alignment below; do not match durations.
 if(upper)for(const m of text.matchAll(/\b(?:under|less than)\s+(?:age\s+)?(\d+)(?!\d)(?!\s+(?:years?|months?|days?)\b)/gi)){
  if(!/(?:not|no)\s*$/i.test(text.slice(Math.max(0,m.index!-8),m.index)))found.push({n:value(m[1]),unit:'age',text:m[0]});
 }
 return found;
};

// A narrow bilingual source check, not a general semantic or sociological judge.
// Warn only when a matching inclusive bound exists in both the source and Chinese condition.
export function bilingualBoundaryErrors(conditions:Bilingual[],raw:string):string[]{
 const errors:string[]=[];
 for(const c of conditions){
  for(const upper of [false,true]){
   const advertised=zhBounds(raw,upper),local=zhBounds(c.zh,upper),translated=enBounds(c.en,upper);
   for(const b of local)if(advertised.some(a=>a.n===b.n&&a.unit===b.unit)&&translated.some(e=>e.n===b.n&&e.unit===b.unit))errors.push(`Translate the inclusive ${upper?'maximum':'minimum'} ${b.text} without excluding its boundary: use ${upper?'within / at most':'at least / or more'}, preserving the original required/preferred status.`);
  }
  if(/\d+\s*字\s*[/／]\s*分钟/.test(raw)&&/\d+\s*字\s*[/／]\s*分钟/.test(c.zh)&&/\bwords?(?:\s*\/\s*characters?)?\s+per minute\b/i.test(c.en))errors.push('Translate 字/分钟 as characters per minute, not words or words/characters per minute.');
  if(zhBounds(c.zh,true).some(b=>b.unit==='age')&&zhBounds(raw,true).some(b=>b.unit==='age')&&/under\s*\/\s*within\s+age/i.test(c.en))errors.push('Use one unambiguous inclusive age boundary, such as 45 or under; do not offer under/within as alternative translations.');
 }
 return [...new Set(errors)];
}

type FactField={path:string;value:Bilingual};
const numericToken="[零〇一二两三四五六七八九十\\d]+";
const englishNumericToken="\\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve";

// Inspect only assertion-bearing fields. Quotes, questions, alternative readings,
// proposed outputs and hypothetical examples deliberately stay outside this list.
function factFields(result:AnalysisResult):FactField[]{
 const fields:FactField[]=[{path:"headline",value:result.headline},{path:"role",value:result.role},{path:"sociology",value:result.sociology}];
 result.terms.forEach((term,i)=>fields.push({path:`terms[${i}].meaning`,value:term.meaning}));
 result.conditions.forEach((condition,i)=>fields.push({path:`conditions[${i}]`,value:condition}));
 if(result.depth)for(const key of ["object","tools","partners","authority"] as const)fields.push({path:`depth.workMap.${key}`,value:result.depth.workMap[key]});
 return fields;
}

function assertions(text:string):string{
 // When a sentence explicitly introduces a possibility/example, omitting it is
 // safer than treating its numbers as advertised facts. This is not a modal parser.
 return (text.match(/[^。！？.!?\n;；]+[。！？.!?;；]?/g)||[]).filter(sentence=>
  !/[?？]/.test(sentence)&&!/(?:假设|假如|如果|例如|举例|虚构|教学示例|(?:^|[，,:：\s])若)|\b(?:if|suppose|supposing|assuming|hypothetical|imagine|for example)\b/i.test(sentence)
 ).join(" ");
}

function projectYears(text:string):number[]{
 const result:number[]=[];
 const patterns=[new RegExp(`(${numericToken})\\s*年\\s*(?:(?:及|或)?以上)?\\s*(?:的)?\\s*项目(?:管理)?(?:工作)?(?:经验)?`,"g"),new RegExp(`项目管理(?:工作)?经验\\s*(?:至少|最少|不低于|不少于|为|须)?\\s*(${numericToken})\\s*年`,"g")];
 for(const pattern of patterns)for(const match of text.matchAll(pattern)){const n=value(match[1]);if(n!==null)result.push(n);}
 return result;
}

function projectCounts(text:string):number[]{
 // Broad exemption: when the source also supplies a matching project count,
 // omission and substitution cannot be distinguished safely by this guard.
 return [...text.matchAll(new RegExp(`(${numericToken})\\s*(?:个|项)\\s*[^。；;,，\\n]{0,16}?项目`,"g"))].map(match=>value(match[1])).filter((n):n is number=>n!==null);
}

type TeamReference={n:number;clause:string};
function teamReferences(text:string,english=false):TeamReference[]{
 const refs:TeamReference[]=[];
 const clauses=text.split(/[。！？.!?;；\n]/);
 const patterns=english?
  [new RegExp(`\\bteams?\\s+of\\s+(?:(?:at least|over|more than)\\s+)?(${englishNumericToken})(?!\\d)\\b`,"gi"),new RegExp(`\\b(${englishNumericToken})(?!\\d)[ -](?:person|member)\\s+teams?\\b`,"gi")]:
  [new RegExp(`(${numericToken})\\s*人\\s*(?:(?:及)?以上)?\\s*(?:的)?\\s*(?:运营)?团队`,"g"),new RegExp(`团队(?:规模|人数)?\\s*(?:为|是|有|约|至少|不少于|:|：)?\\s*(${numericToken})\\s*人`,"g")];
 for(const clause of clauses)for(const pattern of patterns)for(const match of clause.matchAll(pattern)){const n=value(match[1].toLowerCase());if(n!==null)refs.push({n,clause});}
 return refs;
}

const historicalTeam=(text:string,english=false)=>english?
 /\b(?:experience|experienced|previous|previously|past|formerly|prior|had managed|have managed|has managed)\b/i.test(text):
 /经验|经历|曾经|过去|曾(?:任|管理|带领)|管理过|带领过/.test(text);
const uncertainTeam=(text:string,english=false)=>english?
 /\b(?:not|no|never|unspecified|unknown|may|might|could|whether)\b/i.test(text):
 /未(?:说明|写明|披露|给出|提供|列出|列明|明确)|不详|未知|可能|待确认|需确认|是否|不能|并非|不(?:是|代表|等于|意味着|确定)/.test(text);
const explicitCurrentTeam=(text:string)=>/当前|目前|现在|现有|现任|现阶段|本岗|入职后|将管理|需管理/.test(text);

/** Narrow, source-aligned checks; this does not validate general meaning or mechanisms. */
export function analysisFidelityErrors(result:AnalysisResult,raw:string):string[]{
 const errors:string[]=[];
 const fields=factFields(result).map(field=>({path:field.path,value:{zh:assertions(field.value.zh),en:assertions(field.value.en)}}));
 const sourceProjectYears=projectYears(raw),sourceProjectCounts=projectCounts(raw);
 for(const field of fields){
  for(const error of bilingualBoundaryErrors([field.value],raw))errors.push(`${field.path}.en: ${error}`);
  const translatedCounts=[...field.value.en.matchAll(new RegExp(`\\b(${englishNumericToken})(?!\\d)\\s+(?:complete(?:d)?\\s+)?projects\\b`,"gi"))].map(match=>value(match[1].toLowerCase()));
  const translatedYears=[...field.value.en.matchAll(new RegExp(`\\b(${englishNumericToken})(?!\\d)\\s*(?:full\\s+)?years?\\b`,"gi"))].map(match=>value(match[1].toLowerCase()));
  for(const n of new Set(projectYears(field.value.zh)))if(sourceProjectYears.includes(n)&&translatedCounts.includes(n)&&!translatedYears.includes(n)&&!sourceProjectCounts.includes(n)&&!projectCounts(field.value.zh).includes(n))errors.push(`${field.path}.en: Preserve ${n} years of project-management experience as a duration; do not translate it as ${n} projects.`);
 }

 const sourceTeams=teamReferences(raw);
 const historicalSizes=new Set(sourceTeams.filter(ref=>historicalTeam(ref.clause)&&!explicitCurrentTeam(ref.clause)).map(ref=>ref.n));
 for(const n of historicalSizes){
  // Any non-historical or explicitly current source size makes scope ambiguous.
  // Even a different current number may support an output's weaker lower bound.
  if(sourceTeams.some(ref=>!historicalTeam(ref.clause)||explicitCurrentTeam(ref.clause)))continue;
  for(const field of fields.filter(field=>field.path==="headline"||field.path==="role"))for(const language of ["zh","en"] as const){
   const english=language==="en";
   if(teamReferences(field.value[language],english).some(ref=>ref.n===n&&!historicalTeam(ref.clause,english)&&!uncertainTeam(ref.clause,english)&&(english?/\b(?:manage|manages|managing|lead|leads|leading|team)\b/i:/管理|带领|领导|统筹|团队规模|团队有/).test(ref.clause)))errors.push(`${field.path}.${language}: The source assigns the ${n}-person team size only to prior management experience; do not assert it as the current vacancy's team size.`);
  }
 }

 if(/(?:编程)?语言[^。；;\n]{0,40}(?:包括|包含)但不限于/.test(raw))for(const field of fields.filter(field=>field.path.startsWith("conditions["))){
  const zh=field.value.zh,en=field.value.en;
  if(/至少\s*(?:一|1)\s*(?:门|种)\s*(?:上述|所列|列出|以下)(?:的)?\s*(?:编程)?语言|(?:上述|所列|以下)(?:的)?\s*(?:编程)?语言(?:中)?(?:的)?(?:至少)?(?:一门|一种|之一)/.test(zh)&&!/不限于|非穷尽|或其他|仅为示例|只是示例/.test(zh))errors.push(`${field.path}.zh: Preserve the source's non-exhaustive programming-language examples; do not require one of only the listed languages.`);
  if(/\bat least one\s+(?:of\s+the\s+)?(?:listed|following|above)(?:\s+programming)?\s+languages?\b/i.test(en)&&!/\b(?:not limited to|non-exhaustive|or (?:another|other)|examples? only)\b/i.test(en))errors.push(`${field.path}.en: Preserve the source's non-exhaustive programming-language examples; do not require one of only the listed languages.`);
 }

 const seen=new Map<string,number>();
 result.terms.forEach((term,i)=>{const normalized=term.term.replace(/\s+/gu,"").toLowerCase();if(!normalized)return;const first=seen.get(normalized);if(first!==undefined)errors.push(`terms[${i}].term: Duplicate competence expression after whitespace/case normalization; already present at terms[${first}].term.`);else seen.set(normalized,i);});
 return [...new Set(errors)];
}
