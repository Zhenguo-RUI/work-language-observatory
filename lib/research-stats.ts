import rawStats from "../research/aggregates/stats.json";

type Statistic = {value:number|null; unit:string; method:string; source:string; script:string; n?:number};
const stats = rawStats as Record<string, Statistic>;
export function researchStatValue(key:string):number|null {
  if (!(key in stats)) throw new Error(`Unknown research statistic: ${key}`);
  return stats[key].value;
}
export function fillStats(text:string, lang:"zh"|"en"):string {
  return text.replace(/\{\{stat:([^{}|]+)(?:\|([^{}]+))?\}\}/g, (_token,key:string,format?:string)=>{
    const value=researchStatValue(key);
    if(value===null)return "—";
    const locale=lang==="zh"?"zh-CN":"en-US";
    if(format==="pct")return new Intl.NumberFormat(locale,{style:"percent",maximumFractionDigits:1}).format(value);
    if(format==="int")return new Intl.NumberFormat(locale,{maximumFractionDigits:0}).format(value);
    return new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(value);
  });
}
