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
 useEffect(()=>{const frame=requestAnimationFrame(()=>{try{const samples=(JSON.parse(localStorage.getItem(timingsKey)||"[]") as {duration:number;model:boolean}[]).filter(s=>s.model===model&&s.duration>0).map(s=>s.duration/1000).sort((a,b)=>a-b);if(samples.length>=3)setEstimate({low:Math.max(1,Math.floor(samples[Math.floor(samples.length*.25)])),high:Math.ceil(samples[Math.min(samples.length-1,Math.floor(samples.length*.9))])});}catch{}});return()=>cancelAnimationFrame(frame);},[model]);
 const steps=[t("核对语境","Context"),t(model?"分析岗位":"整理草稿",model?"Reading":"Draft"),t("检查证据","Evidence"),t("保存结果","Save")];
 const statuses=[t("正在核对公司与行业资料","Checking company and industry sources"),t(model?"正在阅读这份 JD":"正在整理证据草稿",model?"Reading this JD":"Preparing an evidence draft"),t("正在核对原文与分析","Checking the reading against the JD"),t("正在保存分析结果","Saving your reading")];
 const index=stage==="saving"?3:stage==="validating"?2:["analysis","repairing","retrying","reconnecting","checking_result"].includes(stage)?1:0;
 return <section className="generation-progress panel" aria-busy="true" aria-label={t("分析进度","Analysis progress")}>
  <div className="generation-status"><span className="spinner"/><div><strong role="status" aria-live="polite">{stage==="checking_result"?t("连接不稳定，正在查询已提交的结果","The connection is unstable. Checking the submitted result."):stage==="reconnecting"?t("连接中断，正在自动重连一次","Connection interrupted. Reconnecting once."):stage==="retrying"?t("正在重试，请稍候","Trying again. One moment."):stage==="repairing"?t("正在复核并修正分析","Reviewing and refining the reading"):statuses[index]}</strong><p><Clock3 size={13}/>{t(`已等待 ${elapsed} 秒`,`Elapsed: ${elapsed}s`)} · {stage==="retrying"?t("正在重试，总等待可能接近 5 分钟","Retrying; total waiting time may approach 5 minutes"):estimate?t(`近期通常用时 ${estimate.low}–${estimate.high} 秒`,`Recent readings: usually ${estimate.low}–${estimate.high}s`):model?t("完整分析可能需要 2–3 分钟；重试时可能接近 5 分钟","A full reading may take 2–3 minutes; close to 5 minutes if a retry is needed"):t("正在处理","Processing")}</p></div></div>
  <ol>{steps.map((label,i)=><li key={label} aria-current={i===index?"step":undefined} className={i<index?"done":i===index?"current":""}><span>{i<index?<Check size={12}/>:i+1}</span>{label}</li>)}</ol>
  <div className="wlo-stage-bar" aria-hidden="true">{steps.map((_,i)=><i key={i} className={i<index?"done":i===index?"now":""}/>)}</div><p className="generation-note">{t("请保持本页打开，完成后会自动保存。","Keep this page open. Your reading will save when it is ready.")}</p>
 </section>;
}
export function ModelRetryPanel({lang,message,canRun,disabled,generating,onRetry}:{lang:Lang;message?:Bi;canRun:boolean;disabled:boolean;generating:boolean;onRetry:()=>void}){
 const t=(zh:string,en:string)=>lang==="zh"?zh:en;
 return <section className="model-retry-panel" aria-label={t("模型分析重试","Retry model analysis")}>
  <div><strong role="status">{message?.[lang]||t("模型分析尚未完成，已保留证据草稿。","The model reading is unfinished. An evidence draft is available.")}</strong><p>{canRun?t("可用原 JD 重试，已有记录会保留。","Retry with the same JD. Your existing readings will stay saved."):t("模型分析暂不可用，当前草稿仍可阅读和下载。","Model analysis is currently unavailable. You can still read and download this draft.")}</p></div>
  <button className="button primary compact" disabled={!canRun||disabled} onClick={onRetry}>{generating?<span className="spinner small-spinner"/>:<MessageSquare size={15}/>}<span>{generating?t("正在重新生成…","Regenerating…"):t("重新分析","Try again")}</span></button>
  <a className="text-button" href={`/?page=sample&lang=${lang}`}>{t("先看一份完整示例","Read a complete sample")}</a>
 </section>;
}
export function CompanyContext({context,lang}:{context:NonNullable<AnalysisResult["context"]>;lang:Lang}){
 const t=(zh:string,en:string)=>lang==="zh"?zh:en;
 const labels={employer:t("招聘组织","Hiring organization"),platform:t("工作涉及的平台","Platform involved in the work"),client:t("客户或合作方","Client or partner"),unresolved:t("组织关系待确认","Organization relationship unconfirmed")};
 const lookup=context.lookup,lookupLabels={matched:t("已找到匹配资料","Matching sources found"),ambiguous:t("有多个可能匹配，需确认名称","Multiple possible matches; check the name"),not_found:t("已检索，暂未找到明确匹配","Searched; no clear match found"),unavailable:t("检索暂不可用","Lookup temporarily unavailable")};
 const sourceLabels={official:t("官网核对资料","Official reference"),encyclopedia:t("百科资料","Encyclopedia"),search:t("搜索结果摘要","Search excerpt")};
 return <section className="company-context panel"><div className="section-row"><h2>{t("公司与行业","Company and industry")}</h2></div>
  {lookup&&lookup.status!=="matched"&&<p className="context-lookup-notice">{lookupLabels[lookup.status]}</p>}
  <div className="company-context-grid"><div><span className="micro-label">{labels[context.company.relationship]}</span><h3>{context.company.name[lang]}</h3><p>{context.company.description[lang]}</p></div><div><span className="micro-label">{t("业务语境","Business context")}</span><h3>{context.industry.name[lang]}</h3><p>{context.industry.description[lang]}</p></div></div>
  <p className="context-implication"><strong>{t("与这份工作的关系","What this means for the role")}</strong>{context.implication[lang]}</p>
  <details><summary>{t("查看来源与依据","Sources and evidence")}</summary><p>{context.notice[lang]}</p><p className="context-basis">{context.company.basis==="official"?t("依据：官方资料","Basis: official reference"):context.company.basis==="retrieved"?t("依据：公开检索资料","Basis: public source research"):t("依据：招聘原文","Basis: the JD")}</p>{lookup&&<div className="context-lookup-status"><span>{lookupLabels[lookup.status]}</span><span>{t("检索词","Query")}: {lookup.query}</span><span>{lookup.provider} · {new Date(lookup.searchedAt).toLocaleString(lang==="zh"?"zh-CN":"en-GB")}</span></div>}{context.evidence.map((q,i)=><blockquote key={i}>{q}</blockquote>)}{context.sources.map(source=><a className="source-link" key={source.id||source.url} href={source.url} target="_blank" rel="noreferrer"><span className="source-kind">{sourceLabels[source.kind||"official"]}</span>{source.title}<ExternalLink size={12}/><span>{source.kind&&source.kind!=="official"?t("检索于","Retrieved"):source.verification==="reviewed"?t("资料核对日期","Reference checked"):t("本次查阅","Retrieved")} {new Date(source.retrievedAt).toLocaleDateString(lang==="zh"?"zh-CN":"en-GB")}</span></a>)}{!!context.companyEvidence?.length&&<div className="context-source-quote"><strong>{t("公司资料原文","Company source excerpts")}</strong>{context.companyEvidence.map((anchor,i)=><blockquote key={i}>{anchor.quote}<small> — {context.sources.find(s=>s.id===anchor.sourceId)?.title}</small></blockquote>)}</div>}</details>
 </section>;
}
export function ReadingFeedback({analysis,lang}:{analysis:Analysis;lang:Lang}){
 const [vote,setVote]=useState<"up"|"down"|null>(null),[note,setNote]=useState(""),[category,setCategory]=useState("usefulness"),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[share,setShare]=useState(false);
 const identity=useRef<string>(""),t=(zh:string,en:string)=>lang==="zh"?zh:en;
 useEffect(()=>{identity.current=feedbackIdentity(analysis.id);const frame=requestAnimationFrame(()=>{try{const stored=JSON.parse(localStorage.getItem(`observatory-vote-${analysis.id}`)||"null");if(stored==="up"||stored==="down")setVote(stored);}catch{}});return()=>cancelAnimationFrame(frame);},[analysis.id]);
 async function send(next:"up"|"down",withNote=false){
  if(busy)return;setBusy(true);setMessage("");
  try{
   const readingId=/^(?:preview-|local-)?[a-f\d-]{36}$/i.test(analysis.id)?analysis.id:identity.current;
   const response=await fetch("/api/usage/feedback",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({readingId,feedbackId:identity.current,vote:next,...(withNote?{note}:{}),category})});
   if(!response.ok){const data=await response.json();throw new Error(data.error||t("反馈未发送，请重试。","Feedback was not sent. Please retry."));}
   setVote(next);try{localStorage.setItem(`observatory-vote-${analysis.id}`,JSON.stringify(next));}catch{}
   if(withNote&&share){
    const shared=await fetch("/api/usage/share",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({consent:true,readingId,analysis:{title:analysis.title,company:analysis.company,rawText:analysis.raw_text,sourceUrl:analysis.source_url,engine:analysis.engine,result:analysis.result}})});
    setMessage(shared.ok?t("已收到反馈和附带的分析，谢谢。我们会私下复核。","Thank you. Your feedback and attached reading were received for private review."):t("评价已收到，但附带分析未能提交。请稍后再试。","Your rating was received, but the attached reading could not be shared. Please retry later."));
   }else setMessage(withNote?t("已收到你的反馈，谢谢。","Thank you for your feedback."):t("谢谢，也欢迎留下一点建议。","Thank you. You can add a comment below."));
  }catch(error){setMessage((error as Error).message);}finally{setBusy(false);}
 }
 return <section className="feedback-card reading-feedback"><div className="feedback-heading"><strong>{t("这份分析有帮助吗？","Was this reading useful?")}</strong></div><div className="feedback-options"><button disabled={busy} aria-pressed={vote==="up"} className={vote==="up"?"chosen":""} onClick={()=>{trackUsage("feedback_open");void send("up");}}><ThumbsUp size={15}/>{t("有帮助","Helpful")}</button><button disabled={busy} aria-pressed={vote==="down"} className={vote==="down"?"chosen":""} onClick={()=>{trackUsage("feedback_open");void send("down");}}><ThumbsDown size={15}/>{t("需要改进","Needs work")}</button></div>
  {vote&&<div className="feedback-detail"><label>{t("反馈方面","About")}<select value={category} onChange={e=>setCategory(e.target.value)}>{[["accuracy",t("准确性／误读","Accuracy / misreading")],["usefulness",t("实用性","Usefulness")],["clarity",t("清晰度","Clarity")],["context",t("公司与行业语境","Company / industry context")],["other",t("其他","Other")]].map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><label className="sr-only" htmlFor="reading-feedback-note">{t("反馈留言","Feedback comment")}</label><textarea id="reading-feedback-note" rows={3} maxLength={2000} placeholder={t("哪条有帮助，或哪句话需要改？（选填）","What helped, or which sentence should change? (optional)")} value={note} onChange={e=>setNote(e.target.value)}/><label className="feedback-consent"><input type="checkbox" checked={share} onChange={e=>setShare(e.target.checked)}/><span>{t("附上这份 JD 与分析，供项目团队私下复核（选填）","Attach this JD and analysis for private review by the project team (optional)")}</span></label><p className="small muted">{t("反馈不公开。只有勾选后，才会附上 JD 和分析。","Feedback is private. The JD and analysis are attached only if you select the option above.")}</p><button className="button secondary compact" disabled={busy} onClick={()=>void send(vote,true)}>{busy?t("正在发送…","Sending…"):t("发送反馈","Send feedback")}</button></div>}{message&&<p className="feedback-message" role="status">{message}</p>}
 </section>;
}
