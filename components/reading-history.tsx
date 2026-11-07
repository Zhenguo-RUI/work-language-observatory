"use client";
import {useEffect, useState, type CSSProperties} from "react";
import {ArrowUpRight, MoreHorizontal, Plus, Search, Trash2} from "lucide-react";
import type {Analysis} from "@/lib/observatory-types";
import {WloIllustration} from "./design-symbols";
import "./history-handoff.css";

type Props={records:Analysis[];localIds:Set<string>;admin:boolean;authenticated:boolean;lang:"zh"|"en";titleFor:(a:Analysis)=>string;onRead:(a:Analysis)=>void;onNew:()=>void;onDelete:(a:Analysis)=>void;query:string;onQuery:(q:string)=>void;filter:string;onFilter:(f:string)=>void;onKeyword?:(term:string)=>void};
const statusText={draft:{zh:"待复核",en:"Draft"},in_review:{zh:"复核中",en:"In review"},published:{zh:"已发布",en:"Published"},archived:{zh:"已归档",en:"Archived"}};
function FilterRing(){return <svg className="history-filter-ring ring" viewBox="0 0 110 52" preserveAspectRatio="none" aria-hidden="true"><path d="M90 5C66-2 27 3 11 14C-9 30 11 47 49 48C83 50 108 36 108 23C108 13 101 8 94 8"/></svg>}
function IndexTape({extra=false}:{extra?:boolean}){return <svg className={`history-tape ${extra?"history-extra-tape":""}`} viewBox="0 0 140 36" aria-hidden="true"><path d="M7 4L25 3L36 5L49 3L62 5L76 3L89 4L103 3L116 4L135 3L132 9L135 13L132 18L135 22L131 27L133 33L118 32L104 34L90 32L75 33L61 32L48 34L34 32L20 33L4 32L7 27L4 23L8 17L5 13L9 8Z"/></svg>}
function IndexFold(){return <svg className="history-fold" viewBox="0 0 22 22" aria-hidden="true"><path d="M2 20L3 5Q3 3 6 3L20 2L2 20" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.2" strokeLinejoin="round"/></svg>}
function TitleUnderline(){return <svg className="history-title-underline scribble" viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true"><path d="M2 8Q20 4 43 7T84 6T129 7T171 6T214 7T253 6T298 5"/></svg>}

export function ReadingHistory({records,localIds,admin,authenticated,lang,titleFor,onRead,onNew,onDelete,query,onQuery,filter,onFilter,onKeyword}:Props){
 const [confirmId,setConfirmId]=useState<string|null>(null),[menuId,setMenuId]=useState<string|null>(null);
 const t=(zh:string,en:string)=>lang==="zh"?zh:en;
 const state=(a:Analysis)=>a.id.startsWith("draft-")?"unfinished":a.engine==="rules"?"draft":"complete";
 const filtered=records.filter(a=>(filter==="all"||(admin?a.status===filter:state(a)===filter))&&[a.title,titleFor(a),a.company].join(" ").toLowerCase().includes(query.toLowerCase().trim()));
 const labels={complete:t("完整","Complete"),draft:t("草稿","Draft"),unfinished:t("未完成","Unfinished")};
 const filters=admin?["all","draft","in_review","published","archived"]:["all","complete","draft","unfinished"];
 const recent=[...records].sort((a,b)=>Date.parse(b.updated_at)-Date.parse(a.updated_at)).slice(0,2);
 const latest=recent[0]?.updated_at;
 const dateLabel=(value:string)=>new Date(value).toLocaleString(lang==="zh"?"zh-CN":"en-GB",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false});
 useEffect(()=>{if(!menuId&&!confirmId)return;const close=(event:KeyboardEvent)=>{if(event.key==="Escape"){setMenuId(null);setConfirmId(null)}};window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close)},[menuId,confirmId]);
 return <div className="wlo-history wlo-history-paper">
  {!admin&&<div className="history-status-strip"><span>{authenticated?t("本机与账户记录","Browser and account records"):t("本机存储","Saved locally")} · {records.length} {t("条","readings")}</span><span>{latest?<>{t("最近","Latest")} <time dateTime={latest}>{new Date(latest).toLocaleTimeString(lang==="zh"?"zh-CN":"en-GB",{hour:"2-digit",minute:"2-digit",hour12:false})}</time></>:t("尚无记录","No readings yet")}</span></div>}
  <div className="history-content">
  <div className="section-heading">
   <div><h1>{t(admin?"分析与复核":"我的分析",admin?"Review queue":"My Analyses")}</h1><p className="history-intro-copy">{t(admin?"核对原文、修改双语解释并记录分歧。":"分析过的岗位都会留在这里。",admin?"Check the source, edit both languages and record disagreements.":"Your saved job readings, ready when you return.")}</p></div>
   {!admin&&<div className="history-create"><WloIllustration name="clerk-card" width={64} className="history-clerk"/><button className="button primary" onClick={onNew}>{t("新建分析","New analysis")}<Plus size={18}/></button></div>}
  </div>

  <div className="filter-bar">
   <label className="search-box"><Search size={16}/><span className="sr-only">{t("搜索岗位或公司","Search role or company")}</span><input type="search" placeholder={t("搜索岗位或公司","Search role or company")} value={query} onChange={e=>onQuery(e.target.value)}/></label>
   <div className="filter-tabs">{filters.map(s=><button key={s} className={filter===s?"active":""} aria-pressed={filter===s} onClick={()=>onFilter(s)}><span>{s==="all"?t("全部","All"):admin?statusText[s as keyof typeof statusText][lang]:labels[s as keyof typeof labels]}{filter===s&&<FilterRing/>}</span></button>)}</div>
   <span className="history-filter-count">{filtered.length} {t("条","readings")}</span>
  </div>
  <div className="wlo-history-list">{filtered.map((a,i)=>{
   const itemState=state(a),title=titleFor(a),canDelete=!admin&&localIds.has(a.id);
   return <article className={`wlo-history-entry card-index history-state-${itemState}${confirmId===a.id?" is-confirming":""}`} style={{"--tilt":`${[-.5,.4,-.4,.5,-.3][i%5]}deg`} as CSSProperties} key={a.id}>
    <span className={`history-file-tab tab tab--${itemState==="complete"?"ok":itemState==="draft"?"draft":"fail"}`}>{admin?statusText[a.status][lang]:labels[itemState]}</span>
    {itemState==="draft"&&<><IndexTape/><IndexFold/></>}{i===0&&<IndexTape extra/>}
    <div className="wlo-history-row">
     <button className="wlo-history-title" onClick={()=>onRead(a)}><strong><span>{title}</span>{i===0&&<TitleUnderline/>}</strong><small>{a.company||t("未填写公司","Company not provided")} <span aria-hidden="true">·</span> <time dateTime={a.updated_at}>{dateLabel(a.updated_at)}</time></small></button>
     {confirmId===a.id?<div className="wlo-delete-confirm" role="group" aria-label={t("确认删除","Confirm deletion")}><div><strong>{t("删除这条本机记录？","Delete this local record?")}</strong><span>{t("删除后无法恢复。云端记录不受影响。","This cannot be undone. Cloud records are unaffected.")}</span></div><button className="button secondary compact" onClick={()=>setConfirmId(null)}>{t("取消","Cancel")}</button><button className="button history-delete-submit compact" onClick={()=>{onDelete(a);setConfirmId(null)}}>{t("删除","Delete")}</button></div>:<><span className="history-storage-badge">{localIds.has(a.id)?t("本机","Local"):t("账户","Account")}</span><button className="icon-button history-more" aria-label={t(`更多操作：${title}`,`More actions: ${title}`)} aria-expanded={menuId===a.id} aria-controls={`history-actions-${a.id}`} onClick={()=>{setMenuId(menuId===a.id?null:a.id);setConfirmId(null)}}><MoreHorizontal size={20}/></button></>}
    </div>
    {menuId===a.id&&<div className="history-actions" id={`history-actions-${a.id}`} role="group" aria-label={t(`操作：${title}`,`Actions: ${title}`)}><button className="text-button" onClick={()=>{setMenuId(null);onRead(a)}}><ArrowUpRight size={15}/>{t("查看分析","Open analysis")}</button>{canDelete&&<button className="text-button" onClick={()=>{setMenuId(null);setConfirmId(a.id)}}><Trash2 size={15}/>{t("删除本机记录","Delete local record")}</button>}<button className="text-button" onClick={()=>setMenuId(null)}>{t("收起","Close")}</button></div>}

    {!admin&&i===filtered.length-1&&<WloIllustration name="peek" width={96} className="history-card-peek"/>}
   </article>
  })}</div>
  {!!filtered.length&&<p className="history-list-end">↑ {query||filter!=="all"?t(`显示 ${filtered.length} / ${records.length} 条`,`Showing ${filtered.length} / ${records.length} readings`):t(`共 ${records.length} 条 · 已全部显示`,`${records.length} readings · All shown`)}</p>}
  {!filtered.length&&<div className="wlo-history-empty">
   <WloIllustration name={records.length?"drawer":"shelf"} width={130} className="history-empty-illustration"/>
   <h2>{records.length?t(`没有匹配「${query||t("所选状态","this status")}」的记录`,`No readings match “${query||"this status"}”`):t("还没有分析记录","No readings yet")}</h2>
   <p>{records.length?t("换个岗位词，或去词典查这个词。","Try another role, or look up a keyword."):t("分析第一份 JD 后，就会保存在这里。","Your first JD analysis will be saved here.")}</p>
   {!records.length&&<ul className="history-empty-promises"><li>{authenticated?t("本机与账户记录","Browser and account records"):t("只存在这台设备上","Saved in this browser")}</li><li>{t("可随时导出 PDF 或 Markdown","Export as PDF or Markdown")}</li><li>{t("不会同步给其他访客","Not shared with other visitors")}</li></ul>}
   <div className="history-empty-actions">{records.length?<><button className="button secondary" onClick={()=>{onQuery("");onFilter("all")}}>{t("清除搜索","Clear search")}</button>{onKeyword&&<button className="text-button" onClick={()=>onKeyword(query)}>{query?t(`在「工作关键词」里查「${query}」→`,`Look up “${query}” in Work Keywords →`):t("去工作关键词看看","Explore Work Keywords")}</button>}</>:<><button className="button primary" onClick={onNew}>{t("分析一份 JD","Analyse a JD")}</button>{onKeyword&&<button className="text-button" onClick={()=>onKeyword("")}>{t("从一个关键词开始","Start with a keyword")}<ArrowUpRight size={14}/></button>}</>}</div>
   {!!records.length&&<section className="history-recent"><h3>{t("最近的分析","Recent analyses")}</h3>{recent.map(a=><button key={a.id} onClick={()=>onRead(a)}><span>{titleFor(a)}</span><ArrowUpRight size={15}/></button>)}</section>}
  </div>}
  {!admin&&<details className="local-history-note"><summary>{authenticated?t("本机与账户记录","Browser and account records"):t("只存在这台设备上","Saved in this browser")}</summary><p>{t("本机记录不会同步给其他人。清除本站浏览器数据会移除记录，重要结果可导出 PDF 或 Markdown。","Local readings are not shared with other visitors. Clearing this site’s browser data removes them. Export important results as PDF or Markdown.")}{authenticated&&t("你的云端记录也会合并显示。","Your cloud records also appear here.")}</p></details>}
  </div>
 </div>;
}
