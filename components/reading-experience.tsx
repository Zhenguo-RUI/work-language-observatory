"use client";
import {useEffect,useRef,useState} from "react";
import {Check,Clock3,ExternalLink,MessageSquare,ThumbsDown,ThumbsUp} from "lucide-react";
import type {Analysis,AnalysisResult,Bi} from "@/lib/observatory-types";
import {feedbackIdentity,trackUsage} from "@/lib/usage-client";
import "./reading-experience.css";
type Lang="zh"|"en";
const timingsKey="observatory-analysis-timings-v1";
export function recordAnalysisTiming(duration:number,model:boolean){try{const previous=JSON.parse(localStorage.getItem(timingsKey)||"[]") as {duration:number;model:boolean}[];localStorage.setItem(timingsKey,JSON.stringify([...previous,{duration,model}].slice(-30)));}catch{}}
export function GenerationProgress({stage,startedAt,model,lang}:{stage:string;startedAt:number;model:boolean;lang:Lang}){
 const [elapsed,setElapsed]=useState(0),[estimate,setEstimate]=useState<{low:number;high:number}|null>(null);
 const t=(zh:string,en:string)=>lang==="zh"?zh:en;
 useEffect(()=>{const tick=()=>setElapsed(Math.floor((Date.now()-startedAt)/1000));tick();const timer=setInterval(tick,1000);return()=>clearInterval(timer);},[startedAt]);
 useEffect(()=>{try{const samples=(JSON.parse(localStorage.getItem(timingsKey)||"[]") as {duration:number;model:boolean}[]).filter(s=>s.model===model&&s.duration>0).map(s=>s.duration/1000).sort((a,b)=>a-b);if(samples.length>=3)setEstimate({low:Math.max(1,Math.floor(samples[Math.floor(samples.length*.25)])),high:Math.ceil(samples[Math.min(samples.length-1,Math.floor(samples.length*.9))])});}catch{}},[model]);
 const steps=[t("接收 JD","Receive JD"),t("核对公司与行业语境","Check company and industry context"),t(model?"生成语境分析":"整理证据草稿",model?"Generate situated reading":"Prepare evidence draft"),t("检查证据与双语结构","Check evidence and bilingual structure"),t("整理结果并保存到本机","Prepare result and save locally")];
 const index=stage==="saving"?4:stage==="validating"?3:["analysis","repairing","retrying"].includes(stage)?2:stage==="context"?1:0;
 return <section className="generation-progress panel" aria-busy="true" aria-label={t("分析进度","Analysis progress")}>
  <div className="generation-status"><span className="spinner"/><div><strong role="status" aria-live="polite">{stage==="retrying"?t("正在自动恢复模型分析","Automatically recovering the model analysis"):stage==="repairing"?t("正在修正未通过检查的内容","Revising content that did not pass checks"):steps[index]}</strong><p><Clock3 size={13}/>{t(`已等待 ${elapsed} 秒`,`Elapsed: ${elapsed}s`)} · {stage==="retrying"?t("正在自动恢复，本次可能接近 4 分钟","Automatic recovery is running; this attempt may take close to 4 minutes"):estimate?t(`本机近期同类分析约 ${estimate.low}–${estimate.high} 秒`,`Recent similar readings on this browser: about ${estimate.low}–${estimate.high}s`):model?t("请预留约 1–2 分钟；自动恢复时可能接近 4 分钟","Allow about 1–2 minutes; automatic recovery may take closer to 4 minutes"):t("正在处理，通常比模型分析更快","Processing; evidence drafts usually take less time")}</p></div></div>
  <ol>{steps.map((label,i)=><li key={label} className={i<index?"done":i===index?"current":""}><span>{i<index?<Check size={12}/>:i+1}</span>{label}</li>)}</ol>
  <p className="generation-note">{t("阶段来自实际处理状态；时间为估计，不是倒计时。请保持本页打开。","Stages reflect actual processing. Time is an estimate, not a countdown. Keep this page open.")}</p>
 </section>;
}
export function ModelRetryPanel({lang,message,canRun,disabled,generating,onRetry}:{lang:Lang;message?:Bi;canRun:boolean;disabled:boolean;generating:boolean;onRetry:()=>void}){
 const t=(zh:string,en:string)=>lang==="zh"?zh:en;
 return <section className="model-retry-panel" aria-label={t("模型分析重试","Retry model analysis")}>
  <div><strong role="status">{message?.[lang]||t("当前为规则辅助证据草稿。","This is a rule-assisted evidence draft.")}</strong><p>{canRun?t("重新生成会使用这份已保存的 JD；当前草稿和历史记录会保留。","Retry uses this saved JD. Your current draft and reading history are retained."):t("模型分析暂不可用，当前草稿仍可阅读和下载。","Model analysis is currently unavailable. You can still read and download this draft.")}</p></div>
  <button className="button primary compact" disabled={!canRun||disabled} onClick={onRetry}>{generating?<span className="spinner small-spinner"/>:<MessageSquare size={15}/>}<span>{generating?t("正在重新生成…","Regenerating…"):t("重新生成模型分析","Retry model analysis")}</span></button>
 </section>;
}
export function CompanyContext({context,lang}:{context:NonNullable<AnalysisResult["context"]>;lang:Lang}){
 const t=(zh:string,en:string)=>lang==="zh"?zh:en;
 const labels={employer:t("招聘组织","Hiring organization"),platform:t("工作涉及的平台","Platform involved in the work"),client:t("客户或合作方","Client or partner"),unresolved:t("组织关系待确认","Organization relationship unconfirmed")};
 const lookup=context.lookup,lookupLabels={matched:t("已找到匹配资料","Matching sources found"),ambiguous:t("有多个可能匹配，需确认名称","Multiple possible matches; check the name"),not_found:t("已检索，暂未找到明确匹配","Searched; no clear match found"),unavailable:t("检索暂不可用","Lookup temporarily unavailable")};
 const sourceLabels={official:t("官网核对资料","Official reference"),encyclopedia:t("百科资料","Encyclopedia"),search:t("搜索结果摘要","Search excerpt")};
 return <section className="company-context panel"><div className="section-row"><h2>{t("公司与行业语境","Company and industry context")}</h2><span className="micro-label">{context.company.basis==="official"?t("官方资料","OFFICIAL REFERENCE"):context.company.basis==="retrieved"?t("公开资料检索","PUBLIC SOURCE RESEARCH"):t("根据 JD 识别","BASED ON THE JD")}</span></div>
  {lookup&&<div className="context-lookup-status"><strong>{lookupLabels[lookup.status]}</strong><span>{t("检索词","Query")}: {lookup.query}</span><span>{lookup.provider}</span></div>}
  <div className="company-context-grid"><div><span className="micro-label">{labels[context.company.relationship]}</span><h3>{context.company.name[lang]}</h3><p>{context.company.description[lang]}</p></div><div><span className="micro-label">{t("岗位所在业务","ROLE / INDUSTRY")}</span><h3>{context.industry.name[lang]}</h3><p>{context.industry.description[lang]}</p></div></div>
  <p className="context-implication"><strong>{t("这家公司与岗位要求有什么关系","How this company’s business relates to the role")}</strong>{context.implication[lang]}</p>
  <details><summary>{t("检索来源与分析依据","Research sources and evidence")}</summary><p>{context.notice[lang]}</p>{lookup&&<p className="small muted">{t("检索时间","Searched")}: {new Date(lookup.searchedAt).toLocaleString(lang==="zh"?"zh-CN":"en-GB")}</p>}{context.evidence.map((q,i)=><blockquote key={i}>{q}</blockquote>)}{context.sources.map(source=><a className="source-link" key={source.id||source.url} href={source.url} target="_blank" rel="noreferrer"><span className="source-kind">{sourceLabels[source.kind||"official"]}</span>{source.title}<ExternalLink size={12}/><span>{source.kind&&source.kind!=="official"?t("检索于","Retrieved"):source.verification==="reviewed"?t("资料核对日期","Reference checked"):t("本次查阅","Retrieved")} {new Date(source.retrievedAt).toLocaleDateString(lang==="zh"?"zh-CN":"en-GB")}</span></a>)}{!!context.companyEvidence?.length&&<div className="context-source-quote"><strong>{t("公司简介的原始资料锚点","Original source anchors for the company brief")}</strong>{context.companyEvidence.map((anchor,i)=><blockquote key={i}>{anchor.quote}<small> — {context.sources.find(s=>s.id===anchor.sourceId)?.title}</small></blockquote>)}</div>}</details>
 </section>;
}
export function ReadingFeedback({analysis,lang}:{analysis:Analysis;lang:Lang}){
 const [vote,setVote]=useState<"up"|"down"|null>(null),[note,setNote]=useState(""),[category,setCategory]=useState("usefulness"),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[share,setShare]=useState(false);
 const identity=useRef<string>(""),t=(zh:string,en:string)=>lang==="zh"?zh:en;
 useEffect(()=>{identity.current=feedbackIdentity(analysis.id);try{const stored=JSON.parse(localStorage.getItem(`observatory-vote-${analysis.id}`)||"null");if(stored==="up"||stored==="down")setVote(stored);}catch{}},[analysis.id]);
 async function send(next:"up"|"down",withNote=false){
  if(busy)return;setBusy(true);setMessage("");
  try{
   const readingId=/^(?:preview-|local-)?[a-f\d-]{36}$/i.test(analysis.id)?analysis.id:identity.current;
   const response=await fetch("/api/usage/feedback",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({readingId,feedbackId:identity.current,vote:next,...(withNote?{note}:{}),category})});
   if(!response.ok){const data=await response.json();throw new Error(data.error||t("反馈未发送，请重试。","Feedback was not sent. Please retry."));}
   setVote(next);try{localStorage.setItem(`observatory-vote-${analysis.id}`,JSON.stringify(next));}catch{}
   if(withNote&&share){
    const shared=await fetch("/api/usage/share",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({consent:true,readingId,analysis:{title:analysis.title,company:analysis.company,rawText:analysis.raw_text,sourceUrl:analysis.source_url,engine:analysis.engine,result:analysis.result}})});
    setMessage(shared.ok?t("评价、留言和这份分析已送达运营端，供私下复核。","Your rating, comment and reading reached the operator for private review."):t("评价已收到，但附带分析未能提交。请稍后再试。","Your rating was received, but the attached reading could not be shared. Please retry later."));
   }else setMessage(withNote?t("评价与留言已送达运营端，谢谢。","Your rating and comment reached the operator. Thank you."):t("评价已收到，你也可以补充具体原因。","Rating received. You can add a specific reason below."));
  }catch(error){setMessage((error as Error).message);}finally{setBusy(false);}
 }
 return <section className="feedback-card reading-feedback"><div><MessageSquare size={18}/><strong>{t("这份解释对你有帮助吗？","Was this reading useful?")}</strong></div><div className="feedback-options"><button disabled={busy} aria-pressed={vote==="up"} className={vote==="up"?"chosen":""} onClick={()=>{trackUsage("feedback_open");void send("up");}}><ThumbsUp size={15}/>{t("有帮助","Helpful")}</button><button disabled={busy} aria-pressed={vote==="down"} className={vote==="down"?"chosen":""} onClick={()=>{trackUsage("feedback_open");void send("down");}}><ThumbsDown size={15}/>{t("需要改进","Needs work")}</button></div>
  {vote&&<div className="feedback-detail"><label>{t("最想反馈哪一方面","What is your feedback about?")}<select value={category} onChange={e=>setCategory(e.target.value)}>{[["accuracy",t("准确性／误读","Accuracy / misreading")],["usefulness",t("实用性","Usefulness")],["clarity",t("清晰度","Clarity")],["context",t("公司与行业语境","Company / industry context")],["other",t("其他","Other")]].map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><label className="sr-only" htmlFor="reading-feedback-note">{t("反馈留言","Feedback comment")}</label><textarea id="reading-feedback-note" rows={3} maxLength={2000} placeholder={t("哪条有帮助，或哪句话需要改？（选填）","What helped, or which sentence should change? (optional)")} value={note} onChange={e=>setNote(e.target.value)}/><label className="feedback-consent"><input type="checkbox" checked={share} onChange={e=>setShare(e.target.checked)}/><span>{t("同时附上这份 JD 与分析，供运营者私下复核（可选）","Attach this JD and analysis for private operator review (optional)")}</span></label><p className="small muted">{t("评价与留言仅发给项目运营者，不公开展示；仅勾选后才附上 JD。","Ratings and comments go only to the project operator and are not public. The JD is attached only if you select the option above.")}</p><button className="button secondary compact" disabled={busy} onClick={()=>void send(vote,true)}>{busy?t("正在发送…","Sending…"):t("提交补充反馈","Send details")}</button></div>}{message&&<p className="feedback-message" role="status">{message}</p>}
 </section>;
}
