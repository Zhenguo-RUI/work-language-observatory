"use client";
import {useEffect,useRef,useState} from "react";
import {ExternalLink,Search} from "lucide-react";
import {trackUsage} from "@/lib/usage-client";
import type {CompanyContext} from "@/lib/observatory-types";
import "./company-lookup.css";

export function CompanyLookupPreview({company,lang,disabled=false,compact=false}:{company:string;lang:"zh"|"en";disabled?:boolean;compact?:boolean}){
 const [context,setContext]=useState<CompanyContext|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState("");
 const controller=useRef<AbortController|null>(null),run=useRef(0),t=(zh:string,en:string)=>lang==="zh"?zh:en;
 useEffect(()=>{run.current++;controller.current?.abort();setContext(null);setError("");setLoading(false);return()=>controller.current?.abort();},[company]);
 async function search(){
  if(!company.trim()||loading||disabled)return;
  trackUsage("company_lookup",{view:"analyze"});const current=++run.current;controller.current?.abort();const activeController=new AbortController();controller.current=activeController;setLoading(true);setError("");
  const timeout=setTimeout(()=>activeController.abort(),22000);
  try{
   const response=await fetch("/api/company-context",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({company:company.trim()}),signal:activeController.signal});
   const data=await response.json();if(!response.ok)throw new Error(data.error||t("公司检索暂未完成，请重试。","Company lookup failed. Please retry."));
   if(current===run.current)setContext(data.context);
  }catch(error){if(current===run.current)setError((error as Error).name==="AbortError"?t("检索连接超时，请重试；你也可以直接开始JD分析。","The lookup connection timed out. Retry, or proceed to JD analysis."):(error as Error).message);}
  finally{clearTimeout(timeout);if(current===run.current)setLoading(false);}
 }
 const lookup=context?.lookup,selected=lookup?.matches.find(m=>m.id===lookup.selectedId);
 return <section className={`company-lookup-preview${compact?" company-lookup-compact":""}`} aria-label={t("公司资料检索","Company research")}>
  <div className="company-lookup-action">{!compact&&<p>{t("分析时会自动检索，也可以先看看。仅搜索公司名。","Company research runs with your analysis. Preview it here; only the company name is searched.")}</p>}<button className="button secondary compact" disabled={disabled||loading||!company.trim()} onClick={()=>void search()}>{loading?<span className="spinner small-lookup-spinner"/>:!compact&&<Search size={15}/>}<span>{loading?t("正在检索…","Searching…"):t("查背景",compact?"Look up":"Look up background")}</span></button></div>
  {error&&<p className="company-lookup-error" role="status">{error}</p>}
  {context&&<div className="company-lookup-result" aria-live="polite"><div className="section-row"><strong>{lang==="zh"?context.company.name.zh:context.company.name.en}</strong><span className="micro-label">{lookup?.status==="matched"?t("找到匹配资料","MATCHED SOURCES"):context.company.basis==="official"?t("已核对的参考资料","REVIEWED REFERENCE"):lookup?.status==="ambiguous"?t("名称需要确认","NAME NEEDS CONFIRMATION"):lookup?.status==="not_found"?t("暂未找到明确匹配","NO CLEAR MATCH"):t("检索暂不可用","LOOKUP UNAVAILABLE")}</span></div><p>{context.company.description[lang]}</p>{lookup&&<small>{t("检索词","Query")}: {lookup.query} · {lookup.provider}</small>}
   {selected&&<p className="company-lookup-scope">{t("以上为检索材料摘要；生成JD分析时，会进一步解释公司业务与该岗位的关系。","This is a source preview. The JD analysis will explain how the company’s business relates to the advertised work.")}</p>}
   {context.company.basis==="official"&&lookup?.status!=="matched"&&<small>{context.notice[lang]}</small>}
   {!!context.sources.length&&<details><summary>{t("查看资料来源","View sources")}</summary>{context.sources.slice(0,4).map(source=><a href={source.url} target="_blank" rel="noreferrer" key={source.id||source.url}>{source.title}<ExternalLink size={12}/></a>)}</details>}
  </div>}
 </section>;
}
