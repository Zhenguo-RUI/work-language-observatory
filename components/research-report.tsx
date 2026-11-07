"use client";
import {useEffect, useRef, useState, type CSSProperties} from "react";
import {ArrowDownToLine,ArrowRight,ExternalLink,Menu,X} from "lucide-react";
import {trackUsage} from "@/lib/usage-client";
import type {PublicStudy} from "@/lib/public-study-types";
import {researchAlternativeReadings,researchFraming,researchMarkdown,researchMethodReferences,researchMicroTable,researchObservations} from "@/lib/research-observations";
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
 const downloadMarkdown=()=>{
  trackUsage("export_download",{view:"research",format:"markdown"});
  const url=URL.createObjectURL(new Blob([researchMarkdown(data,lang)],{type:"text/markdown;charset=utf-8"}));
  const link=document.createElement("a");link.href=url;link.download=`work-language-research.${lang}.md`;document.body.appendChild(link);link.click();link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 const focusTerms=researchObservations.map(o=>data.keywords.find(k=>k.term===o.term)).filter(k=>k!==undefined);
 const sections=[["research-question",t("问题","Question")],["research-hypothesis",t("假设","Hypothesis")],["research-findings",t("三条观察","Three observations")],["research-counterexamples",t("反例","Counterexample")],["research-alternatives",t("不同读法","Other readings")],["research-discussion",t("讨论","Discussion")],["research-method",t("方法","Method")]];
 return <article className="study-page research-note wlo-research">
  <div className="research-issue-strip"><span>{t("研究观察 · 招聘语言", "Research Notes · Work language")}</span><span>{t("数据发布", "Data release")} · {date}</span></div>
  <button ref={directoryButton} className="text-button research-directory-toggle" aria-expanded={directoryOpen} aria-controls="research-directory" onClick={()=>setDirectoryOpen(!directoryOpen)}><Menu size={18}/>{t("目录","Contents")}</button>
  <nav className={`research-margin-nav ${directoryOpen?"is-open":""}`} id="research-directory" aria-label={t("报告目录","Report contents")}><button className="icon-button research-directory-close" aria-label={t("关闭目录","Close contents")} onClick={closeDirectory}><X size={18}/></button>{sections.map(([id,label])=><a href={`#${id}`} className={active===id?"active":""} onClick={()=>{setActive(id);setDirectoryOpen(false)}} key={id}>{active===id&&<PencilArrow/>}<span>{label}</span></a>)}</nav>
  <div className="research-paper" ref={paperRef}>
   <header className="section-heading"><div><div className="research-title-row"><h1>{t("招聘如何描绘“合适的人”？","How do job ads describe the right person?")}</h1><span className="research-paper-label"><span>{t("观察", "Notes")}</span></span></div><p>{researchFraming.lead[lang]}</p></div></header>
   <div className="research-downloads"><button className="text-button" onClick={printReport}><ArrowDownToLine size={15}/>{t("打印 / 存为 PDF","Print / save as PDF")}</button><button className="text-button" onClick={downloadMarkdown}>Markdown <ArrowDownToLine size={14}/></button></div>
   <section id="research-question" className="research-section"><h2>{t("问题","Question")}</h2><p className="research-formula">{researchFraming.question[lang]}</p><p className="small muted research-scope-note">{researchFraming.scope[lang]}</p></section>
   <section id="research-hypothesis" className="research-section research-hypothesis"><div><h2>{t("假设","Hypothesis")} <span className="pill pill--ok">{t("待检验","Not yet tested")}</span></h2><p className="research-formula">{researchFraming.hypothesis[lang]}</p><p className="small muted">{researchFraming.hypothesisNote[lang]}</p></div><WloIllustration name="scale-empty" width={130} className="research-hypothesis-illustration"/></section>
   <section id="research-findings" className="research-section">
    <div className="research-comparison-heading"><h2>{t("三条观察","Three observations")}</h2><WloIllustration name="scale-stone" width={130} className="research-counter-illustration"/></div>
    <div className="research-findings">{researchObservations.map((o,index)=><section className="research-finding" key={o.id} id={`observation-${o.id}`} aria-labelledby={`observation-title-${o.id}`}>
     <div className="research-observation-heading"><span className="finding-index">{String(index+1).padStart(2,"0")}</span><h3 id={`observation-title-${o.id}`}>{o.title[lang]}</h3></div>
     <p className="research-observation-takeaway">{o.takeaway[lang]}</p>
     <p className="research-observation-numbers">{o.numbers[lang]}</p>
     <details className="research-observation-details"><summary>{t("看两个语境、反例与解释","Read two contexts, a counterexample and the interpretation")}<ArrowRight className="research-finding-chevron" size={15}/></summary>
      <p className="research-paraphrase-note">{t("以下均为去识别的语料释义，不是原文引句。","The examples below are deidentified paraphrases, not source quotations.")}</p>
      <div className="research-context-grid">{o.contexts.map(context=><section className="research-context" key={context.role.en}><h4>{context.role[lang]}</h4><p className="research-context-work">{context.work[lang]}</p><p>{context.reading[lang]}</p></section>)}</div>
      <section className="research-counterexample"><h4>{t("反例：不要一概而论","Counterexample: avoid a blanket reading")}</h4><p>{o.counterexample[lang]}</p></section>
      <section className="research-interpretation"><h4>{t("这说明了什么","What this suggests")}</h4><p>{o.interpretation[lang]}</p></section>
      <details className="research-counting"><summary>{t("统计怎样计算","How the counts were made")}</summary><p>{o.counting[lang]}</p></details>
     </details>
     <div className="research-practical-question"><span>{t("可以追问","A question to ask")}</span><p>{o.question[lang]}</p></div>
     {onSelectTerm&&<button className="text-button research-observation-term" onClick={()=>onSelectTerm(o.term)}>{t(`继续看“${o.term}”的语境`,`Explore ${data.keywords.find(k=>k.term===o.term)?.english.toLowerCase()||o.term}`)}<ArrowRight size={13}/></button>}
    </section>)}</div>
   </section>
   <section id="research-counterexamples" className="research-section research-micro-comparison">
    <h2>{t("反例：", "Counterexample: ")}{researchMicroTable.title[lang]}</h2>
    <p className="research-formula">{researchMicroTable.takeaway[lang]}</p>
    <div className="research-micro-table" role="region" aria-label={researchMicroTable.title[lang]} tabIndex={0}><table><thead><tr>{researchMicroTable.columns.map(column=><th scope="col" key={column.en}>{column[lang]}</th>)}</tr></thead><tbody>{researchMicroTable.rows.map(row=><tr key={row[0].en}>{row.map((cell,i)=>i===0?<th scope="row" key={i}>{cell[lang]}</th>:<td key={i}>{cell[lang]}</td>)}</tr>)}</tbody></table></div>
    <p className="small muted">{researchMicroTable.note[lang]}</p>
   </section>
   <section id="research-alternatives" className="research-section research-alternatives"><h2>{t("可能的不同读法","Alternative readings")}</h2>{researchAlternativeReadings.map(reading=><details key={reading.question.en}><summary>{reading.question[lang]}<ArrowRight size={15}/></summary><p>{reading.answer[lang]}</p></details>)}</section>
   <section id="research-discussion" className="research-section"><h2>{t("讨论","Discussion")}</h2><p className="research-formula research-underlined"><span>{researchFraming.thesis[lang]}</span></p><details><summary>{t("展开讨论","Read the discussion")}</summary><p>{researchFraming.discussion[lang]}</p></details></section>
   <section id="research-method" className="research-section"><details className="study-method"><summary>{t("方法 · 口径 · 局限 · 参考","Method · scope · limits · references")}</summary><p>{researchFraming.methodStatus[lang]}</p><p>{data.methods.scope[lang]}</p><p>{data.methods.sampleNote[lang]}</p><p className="t-mono">{data.methods.sources.map(s=>`${s.label}: ${s.n.toLocaleString()}`).join(" · ")}</p><p>{t("词面未出现，不表示现实中不存在。来源差别也混合了岗位构成、时期和采集方式，不能直接归因于平台。","A missing word does not establish a real-world absence. Source differences also reflect role mix, period and collection methods; they do not establish platform effects.")}</p><a className="text-button" href="/work-language-study-aggregates.json" download>{t("下载汇总数据","Download aggregate data")}<ExternalLink size={14}/></a><p>{data.methods.frequencyNote[lang]}</p>   <section id="research-evidence" className="research-section"><div className="research-section-heading"><h2>{t("这次比较的三个词", "The three words in this comparison")}</h2><span>{t("出现频率，不是词义占比", "Frequency, not semantic shares")}</span></div><div className="research-frequency-chart">{focusTerms.map((k,i)=>{const pct=data.methods.corpusN?100*k.documents/data.methods.corpusN:0;return <button key={k.term} onClick={()=>onSelectTerm?.(k.term)} className={`research-frequency-row pattern-${i===0?0:1+(i-1)%3}`} aria-label={`${lang==="zh"?k.term:k.english}: ${k.documents} / ${data.methods.corpusN}`}><span>{lang==="zh"?k.term:k.english}</span><span className="research-bar-track" style={{"--bar-value":`${pct}%`} as CSSProperties}><i style={{width:`${pct}%`}}/>{i===0&&<span className="research-bar-flag"><WloIllustration name="flag" width={64}/></span>}</span><strong>{pct.toFixed(1)}%</strong><ArrowRight size={14}/></button>})}</div><p className="t-mono">n = {data.methods.corpusN.toLocaleString()} · {t("包含该词的广告 / 全部样本","ads containing the term / all ads")}</p><p className="small muted">{t("每份广告每词只计一次。点击词语可继续比较具体岗位；这些比例不能测量词义弹性。","Each ad is counted once per term. Select a word to compare roles; these proportions do not measure semantic flexibility.")}</p></section>
   <details className="research-cross-tabs study-method"><summary>{t("查看交叉表与比较分母","Cross-tabs and comparison groups")}</summary>{data.report.crossTabs.map(tab=><section className="study-cross-tab" key={tab.title.en}><h3>{tab.title[lang]}</h3><div className="table-wrap" role="region" aria-label={tab.title[lang]} tabIndex={0}><table><thead><tr><th scope="col">{t("文本组","Ad group")}</th>{tab.columns.map(c=><th scope="col" key={c.en}>{c[lang]}</th>)}<th scope="col">{t("命中比例","Hit rate")}</th></tr></thead><tbody>{tab.cells.map((row,i)=>{const total=row.reduce((a,b)=>a+b,0),rate=total?100*row[0]/total:0;return <tr key={i}><th scope="row">{tab.rowLabels[i][lang]}</th>{row.map((n,j)=><td key={j}>{n.toLocaleString()}</td>)}<td>{rate.toFixed(1)}%</td></tr>})}</tbody></table></div><p className="small muted">{tab.note[lang]}</p></section>)}</details>
<div className="study-reference-grid">{[...data.report.bibliography,...researchMethodReferences].map(ref=><div key={ref.author}><h3>{ref.author}</h3><a href={ref.url} target="_blank" rel="noreferrer">{ref.title}<ExternalLink size={12}/></a><p>{ref.contribution[lang]}</p></div>)}</div></details></section>
  </div>
 </article>;
}
