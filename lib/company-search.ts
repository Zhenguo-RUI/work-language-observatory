/** Public company lookup. Only the company name is sent; no JD or personal data.
 * Provider docs: https://www.wikidata.org/wiki/Wikidata:Data_access and
 * https://www.mediawiki.org/wiki/Wikibase/API. DuckDuckGo Lite is a public HTML
 * fallback, not a guaranteed API: challenge/errors are surfaced as unavailable.
 */
export type CompanySearchMatch={id:string;title:string;url:string;snippet:string;kind:"encyclopedia"|"search";retrievedAt:string;nameZh?:string;nameEn?:string;match:"exact"|"alias"|"candidate"};
export type CompanySearchResult={query:string;status:"matched"|"ambiguous"|"not_found"|"unavailable";provider:string;searchedAt:string;matches:CompanySearchMatch[];selectedId?:string};
type Options={request?:typeof fetch;timeoutMs?:number;now?:()=>Date};
type ProviderResult={ok:boolean;matches:CompanySearchMatch[]};
const USER_AGENT="WorkLanguageObservatory/0.3 (+https://work-language-observatory.vercel.app/)";
const MAX_BYTES=800_000,MAX_MATCHES=6;
const cache=new Map<string,{until:number;value:CompanySearchResult}>();
const normalize=(value:string)=>value.normalize("NFKC").toLowerCase().replace(/[\s\p{P}\p{S}]/gu,"");
const baseName=(value:string)=>normalize(value).replace(/(?:股份有限公司|有限责任公司|有限公司|集团公司|公司|incorporated|corporation|limited|inc|ltd|corp)$/u,"");
const companyPattern=/company|corporat|platform|manufacturer|investment|venture|fund\b|business|organization|organisation|producer|studio|software|streaming service|企业|公司|集团|基金|投资|平台|制造|机构|品牌|银行|大学|university/i;
const decodeEntities=(value:string)=>value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp|hellip);/gi,(whole,entity:string)=>{const lower=entity.toLowerCase();if(lower.startsWith("#")){const n=lower.startsWith("#x")?parseInt(lower.slice(2),16):parseInt(lower.slice(1),10);return n>0&&n<=0x10ffff&&!((n>=0xd800&&n<=0xdfff))?String.fromCodePoint(n):"";}return ({amp:"&",quot:'"',apos:"'",lt:"<",gt:">",nbsp:" ",hellip:"…"} as Record<string,string>)[lower]||whole;});
const text=(value:string)=>decodeEntities(value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]*>/g," ")).replace(/\s+/g," ").trim();

function publicLink(value:string):string|null{
 try{
  let url=new URL(decodeEntities(value),"https://lite.duckduckgo.com");
  if(["duckduckgo.com","www.duckduckgo.com","lite.duckduckgo.com"].includes(url.hostname)&&url.pathname.startsWith("/l/")){const target=url.searchParams.get("uddg");if(!target)return null;url=new URL(target);}
  if(!["https:","http:"].includes(url.protocol)||url.username||url.password||url.href.length>1500)return null;
  const host=url.hostname.toLowerCase();
  if(!host.includes(".")||/^(?:\d{1,3}\.){3}\d{1,3}$/.test(host)||host.includes(":")||/(?:^|\.)(?:localhost|local|internal|test|invalid|example)$/.test(host)||/^(?:metadata|metadata\.google\.internal)$/.test(host)||host.endsWith(".duckduckgo.com")||host==="duckduckgo.com")return null;
  return url.href;
 }catch{return null;}
}
async function getText(url:string,request:typeof fetch,signal:AbortSignal):Promise<{body:string;type:string}>{
 const allowed=["www.wikidata.org","lite.duckduckgo.com"];
 if(!allowed.includes(new URL(url).hostname))throw new Error("company_search_destination");
 const response=await request(url,{method:"GET",redirect:"error",signal,headers:{"User-Agent":USER_AGENT,Accept:"application/json,text/html;q=0.9"}});
 if(response.status!==200||!response.body)throw new Error("company_search_unavailable");
 if(Number(response.headers.get("content-length")||0)>MAX_BYTES)throw new Error("company_search_too_large");
 const reader=response.body.getReader(),decoder=new TextDecoder();let body="",total=0;
 const abort=()=>{void reader.cancel().catch(()=>{});};signal.addEventListener("abort",abort,{once:true});
 try{
  signal.throwIfAborted();
  for(;;){const next=await reader.read();signal.throwIfAborted();if(next.done)break;total+=next.value.byteLength;if(total>MAX_BYTES)throw new Error("company_search_too_large");body+=decoder.decode(next.value,{stream:true});}
  body+=decoder.decode();return {body,type:response.headers.get("content-type")||""};
 }finally{signal.removeEventListener("abort",abort);void reader.cancel().catch(()=>{});reader.releaseLock();}
}
function attr(tag:string,name:string){const match=tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`,"i"));return match?decodeEntities(match[2]):"";}

async function duckDuckGo(query:string,request:typeof fetch,signal:AbortSignal,searchedAt:string):Promise<ProviderResult>{
 try{
  const url="https://lite.duckduckgo.com/lite/?q="+encodeURIComponent(/[\u3400-\u9fff]/u.test(query)?query+" 官网 公司":query+" company official about");
  const {body,type}=await getText(url,request,signal);
  if(!type.includes("text/html")||/id=["']challenge-form|anomaly\.js|Unfortunately, bots use DuckDuckGo/i.test(body))return {ok:false,matches:[]};
  const anchors=[...body.matchAll(/<a\b[^>]*class\s*=\s*["'][^"']*\bresult-link\b[^"']*["'][^>]*>[\s\S]*?<\/a>/gi)];
  if(!anchors.length)return {ok:/No (?:more )?results|no-results|没有找到|找不到结果/i.test(text(body)),matches:[]};
  const matches:CompanySearchMatch[]=[];
  const needle=normalize(query),base=baseName(query);
  for(let index=0;index<anchors.length&&matches.length<MAX_MATCHES;index++){
   const anchor=anchors[index],tag=anchor[0],title=text(tag).slice(0,220),url=publicLink(attr(tag,"href"));if(!url)continue;
   const end=anchors[index+1]?.index??Math.min(body.length,anchor.index!+8000),scope=body.slice(anchor.index!+tag.length,end);
   const snippetMatch=scope.match(/<td\b[^>]*class\s*=\s*["'][^"']*\bresult-snippet\b[^"']*["'][^>]*>([\s\S]*?)<\/td>/i);
   const snippet=text(snippetMatch?.[1]||"").slice(0,650);if(!snippet)continue;
   const inTitle=normalize(title).includes(needle)||(base.length>=3&&normalize(title).includes(base));
   const inSnippet=normalize(snippet).includes(needle)||(base.length>=3&&normalize(snippet).includes(base));
   if(!inTitle&&!inSnippet)continue;
   // A passing mention in a long directory/news list is a candidate, not proof
   // that the company is the main subject of this result.
   const exactSubject=inTitle&&companyPattern.test(title+" "+snippet);
   matches.push({id:`web-${matches.length+1}`,title,url,snippet,kind:"search",retrievedAt:searchedAt,match:exactSubject?"exact":"candidate"});
  }
  return {ok:true,matches};
 }catch{return {ok:false,matches:[]};}
}
type SearchEntity={id?:string;label?:string;description?:string;match?:{text?:string};aliases?:string[]};
type Entity={labels?:Record<string,{value?:string}>;descriptions?:Record<string,{value?:string}>;aliases?:Record<string,{value?:string}[]>};
async function wikidata(query:string,request:typeof fetch,signal:AbortSignal,searchedAt:string):Promise<ProviderResult>{
 try{
  const language=/[\u3400-\u9fff]/u.test(query)?"zh":"en";
  const searchUrl="https://www.wikidata.org/w/api.php?"+new URLSearchParams({action:"wbsearchentities",search:query,language,uselang:language,format:"json",limit:"4",type:"item"});
  const {body}=await getText(searchUrl,request,signal);const search=JSON.parse(body) as {search?:SearchEntity[];success?:number};
  if(search.success!==1||!Array.isArray(search.search))return {ok:false,matches:[]};
  const entities=search.search.filter(e=>/^Q\d+$/.test(e.id||""));if(!entities.length)return {ok:true,matches:[]};
  let details:Record<string,Entity>={};
  try{
   const detailsUrl="https://www.wikidata.org/w/api.php?"+new URLSearchParams({action:"wbgetentities",ids:entities.map(e=>e.id).join("|"),props:"labels|descriptions|aliases",languages:"zh|zh-hans|en",format:"json"});
   const result=JSON.parse((await getText(detailsUrl,request,signal)).body);if(result.entities&&typeof result.entities==="object")details=result.entities;
  }catch{}
  const needle=normalize(query),base=baseName(query),matches:CompanySearchMatch[]=[];
  for(const item of entities){
   const detail=details[item.id!]||{},zh=detail.labels?.["zh-hans"]?.value||detail.labels?.zh?.value,en=detail.labels?.en?.value;
   const title=zh||en||item.label||item.id!;
   const names=[item.label,item.match?.text,...item.aliases||[],zh,en,...Object.values(detail.aliases||{}).flat().map(a=>a.value)].filter((v):v is string=>!!v);
   const equal=names.some(name=>normalize(name)===needle),alias=!equal&&base.length>=2&&needle.length>base.length&&names.some(name=>baseName(name)===base);
   const descriptions=[detail.descriptions?.["zh-hans"]?.value,detail.descriptions?.zh?.value,detail.descriptions?.en?.value,item.description].filter((v):v is string=>!!v);
   const snippet=[...new Set(descriptions)].join(" / ").slice(0,650);if(!snippet)continue;
   if(!equal&&!alias&&!names.some(name=>normalize(name).includes(needle)||needle.includes(normalize(name))))continue;
   const company=companyPattern.test(snippet);
   matches.push({id:`wiki-${item.id}`,title,url:`https://www.wikidata.org/wiki/${item.id}`,snippet,kind:"encyclopedia",retrievedAt:searchedAt,...(zh?{nameZh:zh}:{}),...(en?{nameEn:en}:{}),match:company?(equal?"exact":alias?"alias":"candidate"):"candidate"});
  }
  return {ok:true,matches};
 }catch{return {ok:false,matches:[]};}
}

export async function searchCompany(name:string,options:Options={}):Promise<CompanySearchResult>{
 const query=name.normalize("NFKC").replace(/\s+/g," ").trim();
 if(query.length<2||query.length>160||/[<>\u0000-\u001f]|https?:\/\/|\bsk-[a-z\d]{20}/i.test(query))throw new Error("company_search_invalid_name");
 const searchedAt=(options.now?.()||new Date()).toISOString(),key=normalize(query);
 const hit=!options.request?cache.get(key):undefined;if(hit&&hit.until>Date.now())return structuredClone(hit.value);
 const controller=new AbortController(),timeout=Math.max(500,Math.min(options.timeoutMs??7000,12000));
 const timer=setTimeout(()=>controller.abort(),timeout),request=options.request||fetch;
 let results:ProviderResult[];
 try{results=await Promise.all([duckDuckGo(query,request,controller.signal,searchedAt),wikidata(query,request,controller.signal,searchedAt)]);}finally{clearTimeout(timer);}
 const all=results.flatMap(r=>r.matches),seen=new Set<string>(),matches:CompanySearchMatch[]=[];
 // Prefer structured exact identity over a search engine's ranked position.
 for(const m of [...all].sort((a,b)=>Number(b.kind==="encyclopedia"&&b.match!=="candidate")-Number(a.kind==="encyclopedia"&&a.match!=="candidate"))){if(seen.has(m.url))continue;seen.add(m.url);matches.push(m);if(matches.length===MAX_MATCHES)break;}
 const identities=matches.filter(m=>m.kind==="encyclopedia"&&m.match!=="candidate");
 const webSubjects=matches.filter(m=>m.kind==="search"&&m.match==="exact");
 // Multiple pages about the same legal organization are corroborating sources,
 // not multiple identities. Distinct legal names still require disambiguation.
 const legalNames=new Set(webSubjects.flatMap(m=>m.title.match(/[\u3400-\u9fff]{2,40}(?:股份有限公司|有限责任公司|有限公司)/gu)||[]).map(normalize));
 const webIdentity=webSubjects.length===1||legalNames.size===1?webSubjects.find(m=>/\.(?:edu|gov)(?:\.[a-z]{2})?$/i.test(new URL(m.url).hostname))||webSubjects[0]:undefined;
 const selected=identities.length===1?identities[0]:identities.length===0?webIdentity:undefined;
 const status:CompanySearchResult["status"]=selected?"matched":matches.length?"ambiguous":results.some(r=>r.ok)?"not_found":"unavailable";
 const result:CompanySearchResult={query,status,provider:"DuckDuckGo Lite + Wikidata",searchedAt,matches,...(selected?{selectedId:selected.id}:{})};
 if(!options.request){if(cache.size>=80)cache.delete(cache.keys().next().value!);cache.set(key,{until:Date.now()+(status==="matched"?30*60000:60000),value:structuredClone(result)});}
 return result;
}
