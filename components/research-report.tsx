"use client";
import {useEffect, useRef, useState, type CSSProperties} from "react";
import {ArrowDownToLine,ArrowRight,ExternalLink,Menu,X} from "lucide-react";
import {trackUsage} from "@/lib/usage-client";
import type {PublicStudy} from "@/lib/public-study-types";
import {WloIllustration} from "./design-symbols";
import "./research-pages.css";
import "./report-handoff.css";

function PencilArrow({className=""}:{className?:string}) {
 return <svg className={`research-pencil-arrow ${className}`} viewBox="0 0 72 24" fill="none" aria-hidden="true"><path d="M3 13C17 17 28 8 42 12S59 15 68 11M59 5l10 6-10 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
export function ResearchReport({data,lang,onSelectTerm}:{data:PublicStudy;lang:"zh"|"en";onSelectTerm?:(term:string)=>void}){
 const [directoryOpen,setDirectoryOpen]=useState(false),[active,setActive]=useState("research-question");
 const t=(z:string,e:string)=>lang==="zh"?z:e;
 const paperRef=useRef<HTMLDivElement>(null),directoryButton=useRef<HTMLButtonElement>(null);
 const printDetails=useRef(new Map<HTMLDetailsElement,boolean>());
 const date=data.methods.publishedAt?.slice(0,10)||"2026";
 const closeDirectory=()=>{setDirectoryOpen(false);directoryButton.current?.focus()};
 useEffect(()=>{
  if(!directoryOpen)return;
  const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){setDirectoryOpen(false);directoryButton.current?.focus()}};
  window.addEventListener("keydown",escape);
  return()=>window.removeEventListener("keydown",escape);
 },[directoryOpen]);
 useEffect(()=>{
  const previous=printDetails.current;
  const openDetails=()=>{if(previous.size)return;paperRef.current?.querySelectorAll("details").forEach(detail=>{previous.set(detail,detail.open);detail.open=true})};
  const restoreDetails=()=>{previous.forEach((open,detail)=>{detail.open=open});previous.clear()};
  window.addEventListener("beforeprint",openDetails);
  window.addEventListener("afterprint",restoreDetails);
  return()=>{window.removeEventListener("beforeprint",openDetails);window.removeEventListener("afterprint",restoreDetails);restoreDetails()};
 },[]);
 const printReport=()=>{
  trackUsage("export_download",{view:"research",format:"pdf"});
  // Open all sections before the print snapshot; afterprint restores the reader's place.
  if(!printDetails.current.size)paperRef.current?.querySelectorAll("details").forEach(detail=>{printDetails.current.set(detail,detail.open);detail.open=true});
  window.print();
 };
 const sections=[["research-question",t("问题","Question")],["research-hypothesis",t("假设","Hypothesis")],["research-evidence",t("证据","Evidence")],["research-findings",t("对照","Comparisons")],["research-discussion",t("讨论","Discussion")],["research-method",t("方法","Method")]];
 return <article className="study-page research-note wlo-research">
  <div className="research-issue-strip"><span>{t("研究观察 · 招聘语言", "Research Notes · Work language")}</span><span>{date} {t("更新", "updated")}</span></div>
  <button ref={directoryButton} className="text-button research-directory-toggle" aria-expanded={directoryOpen} aria-controls="research-directory" onClick={()=>setDirectoryOpen(!directoryOpen)}><Menu size={18}/>{t("目录","Contents")}</button>
  <nav className={`research-margin-nav ${directoryOpen?"is-open":""}`} id="research-directory" aria-label={t("报告目录","Report contents")}><button className="icon-button research-directory-close" aria-label={t("关闭目录","Close contents")} onClick={closeDirectory}><X size={18}/></button>{sections.map(([id,label])=><a href={`#${id}`} className={active===id?"active":""} onClick={()=>{setActive(id);setDirectoryOpen(false)}} key={id}>{active===id&&<PencilArrow/>}<span>{label}</span></a>)}</nav>
  <div className="research-paper" ref={paperRef}>
   <header className="section-heading"><div><div className="research-title-row"><h1>{t("招聘如何描绘“合适的人”？","How do job ads describe the right person?")}</h1><span className="research-paper-label"><span>{t("观察", "Notes")}</span></span></div><p>{t("从反复出现的表达出发，观察工作要求如何被写成个人品质，以及这些词语留下了哪些解释空间。","Explore how recurring words present work requirements as personal qualities, and what they leave open to interpretation.")}</p></div></header>
   <div className="research-downloads"><button className="text-button" onClick={printReport}><ArrowDownToLine size={15}/>{t("打印 / 存为 PDF","Print / save as PDF")}</button><a className="text-button" href={`/work-language-research.${lang}.md`} onClick={()=>trackUsage("export_download",{view:"research",format:"markdown"})} download>Markdown <ArrowDownToLine size={14}/></a></div>
   <section id="research-question" className="research-section"><h2>{t("问题","Question")}</h2><p className="research-formula">{data.report.title[lang]}</p><details className="research-background"><summary>{t("展开研究背景", "Read the research background")}</summary><p>{data.report.standfirst[lang]}</p></details></section>
   <section id="research-hypothesis" className="research-section research-hypothesis"><div><h2>{t("假设","Hypothesis")} <span className="pill pill--ok">{t("待检验","Not yet tested")}</span></h2><p className="research-formula">{t("词义的弹性，可能有助于它跨职业流通。","Flexible meanings may help a word travel across occupations.")}</p><p className="small muted">{t("目前还没有测量词义弹性，下面的词频不能单独验证这个假设。","Semantic flexibility has not yet been measured. Frequencies alone cannot test this hypothesis.")}</p></div><WloIllustration name="scale-empty" width={130} className="research-hypothesis-illustration"/></section>
   <section id="research-evidence" className="research-section"><div className="research-section-heading"><h2>{t("证据", "Evidence")}</h2><span>{t("词语在样本中的出现频率", "How often the words appear")}</span></div><div className="research-frequency-chart">{data.keywords.slice(0,5).map((k,i)=>{const pct=data.methods.corpusN?100*k.documents/data.methods.corpusN:0;return <button key={k.term} onClick={()=>onSelectTerm?.(k.term)} className={`research-frequency-row pattern-${i===0?0:1+(i-1)%3}`} aria-label={`${lang==="zh"?k.term:k.english}: ${k.documents} / ${data.methods.corpusN}`}><span>{lang==="zh"?k.term:k.english}</span><span className="research-bar-track" style={{"--bar-value":`${pct}%`} as CSSProperties}><i style={{width:`${pct}%`}}/>{i===0&&<span className="research-bar-flag"><WloIllustration name="flag" width={64}/></span>}</span><strong>{pct.toFixed(1)}%</strong><ArrowRight size={14}/></button>})}</div><p className="t-mono">n = {data.methods.corpusN.toLocaleString()} · {t("包含该词的广告 / 全部样本","ads containing the term / all ads")}</p><p className="small muted">{data.methods.frequencyNote[lang]}</p></section>
   <section id="research-findings" className="research-section"><div className="research-comparison-heading"><h2>{t("对照：词语连着什么工作","Comparisons: what work the words describe")}</h2><WloIllustration name="scale-stone" width={130} className="research-counter-illustration"/></div><div className="research-findings">{data.report.findings.map((f,index)=><details className="research-finding" open={index===0} key={f.id}><summary><span className="finding-index">{String(index+1).padStart(2,"0")}</span><span>{f.title[lang]}</span><ArrowRight className="research-finding-chevron" size={16}/></summary><p>{f.interpretation[lang]}</p><div className="research-evidence-pair"><div><h3>{t("样本中的关系","Relationship in the sample")}</h3><p>{f.quantitative[lang]}</p></div><div><h3>{t("对照与边界","Comparison and limits")}</h3><p>{f.contrast[lang]}</p><p>{f.caveat[lang]}</p></div></div><p>{f.mechanism[lang]}</p>{onSelectTerm&&<div className="finding-terms">{f.terms.map(term=>{const k=data.keywords.find(k=>k.term===term);return <button className="text-button" key={term} onClick={()=>onSelectTerm(term)}>{lang==="zh"?term:k?.english||term}<ArrowRight size={13}/></button>})}</div>}</details>)}</div></section>
   <details className="research-cross-tabs study-method"><summary>{t("查看交叉表与比较分母","Cross-tabs and comparison groups")}</summary>{data.report.crossTabs.map(tab=><section className="study-cross-tab" key={tab.title.en}><h3>{tab.title[lang]}</h3><div className="table-wrap" role="region" aria-label={tab.title[lang]} tabIndex={0}><table><thead><tr><th scope="col">{t("文本组","Ad group")}</th>{tab.columns.map(c=><th scope="col" key={c.en}>{c[lang]}</th>)}<th scope="col">{t("命中比例","Hit rate")}</th></tr></thead><tbody>{tab.cells.map((row,i)=>{const total=row.reduce((a,b)=>a+b,0),rate=total?100*row[0]/total:0;return <tr key={i}><th scope="row">{tab.rowLabels[i][lang]}</th>{row.map((n,j)=><td key={j}>{n.toLocaleString()}</td>)}<td>{rate.toFixed(1)}%</td></tr>})}</tbody></table></div><p className="small muted">{tab.note[lang]}</p></section>)}</details>
   <section id="research-discussion" className="research-section"><h2>{t("讨论","Discussion")}</h2><p className="research-formula research-underlined"><span>{data.report.thesis[lang]}</span></p><details><summary>{t("展开讨论","Read the discussion")}</summary><p>{data.report.conclusion[lang]}</p></details></section>
   <section id="research-method" className="research-section"><details className="study-method"><summary>{t("方法 · 口径 · 局限 · 参考","Method · scope · limits · references")}</summary><p>{data.methods.scope[lang]}</p><p>{data.methods.sampleNote[lang]}</p><p className="t-mono">{data.methods.sources.map(s=>`${s.label}: ${s.n.toLocaleString()}`).join(" · ")}</p><p>{t("词面未出现，不表示现实中不存在。来源差别也混合了岗位构成、时期和采集方式，不能直接归因于平台。","A missing word does not establish a real-world absence. Source differences also reflect role mix, period and collection methods; they do not establish platform effects.")}</p><a className="text-button" href="/work-language-study-aggregates.json" download>{t("下载汇总数据","Download aggregate data")}<ExternalLink size={14}/></a><div className="study-reference-grid">{data.report.bibliography.map(ref=><div key={ref.author}><h3>{ref.author}</h3><a href={ref.url} target="_blank" rel="noreferrer">{ref.title}<ExternalLink size={12}/></a><p>{ref.contribution[lang]}</p></div>)}</div></details></section>
  </div>
 </article>;
}
