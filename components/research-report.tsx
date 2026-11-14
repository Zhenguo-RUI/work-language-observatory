"use client";
import {useEffect,useRef,useState,type CSSProperties} from "react";
import {ArrowDownToLine,ArrowRight,ExternalLink,Menu,X} from "lucide-react";
import {trackUsage} from "@/lib/usage-client";
import type {Bi} from "@/lib/observatory-types";
import type {PublicStudy} from "@/lib/public-study-types";
import {fillStats,researchStatValue} from "@/lib/research-stats";
import {researchSourcePairs,researchSourceNames,researchDiagnostics,researchAlternativeReadings,researchFraming,researchHypotheses,researchLimitations,researchMarkdown,researchMethodReferences,researchObservations,researchPipeline,researchPlan,researchQuestions} from "@/lib/research-observations";
import {researchPublicationCopy,researchPublicationMetadata,researchCitation} from "@/lib/research-publication";
import {WloIllustration} from "./design-symbols";
import "./research-pages.css";
import "./report-handoff.css";
import "./research-publication.css";

function PencilArrow(){return <svg className="research-pencil-arrow" viewBox="0 0 72 24" fill="none" aria-hidden="true"><path d="M3 13C17 17 28 8 42 12S59 15 68 11M59 5l10 6-10 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}

export function ResearchReport({data,lang,onSelectTerm}:{data:PublicStudy;lang:"zh"|"en";onSelectTerm?:(term:string)=>void}){
 const [directoryOpen,setDirectoryOpen]=useState(false),[active,setActive]=useState("research-question");
 const t=(zh:string,en:string)=>lang==="zh"?zh:en,b=(value:Bi)=>fillStats(value[lang],lang);
 const paperRef=useRef<HTMLDivElement>(null),directoryButton=useRef<HTMLButtonElement>(null),printDetails=useRef(new Map<HTMLDetailsElement,boolean>());
 const closeDirectory=()=>{setDirectoryOpen(false);directoryButton.current?.focus()};
 useEffect(()=>{
  if(!directoryOpen)return;
  const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){setDirectoryOpen(false);directoryButton.current?.focus()}};
  window.addEventListener("keydown",escape);return()=>window.removeEventListener("keydown",escape);
 },[directoryOpen]);
 useEffect(()=>{
  const previous=printDetails.current;
  const openDetails=()=>{if(previous.size)return;paperRef.current?.querySelectorAll("details").forEach(detail=>{previous.set(detail,detail.open);detail.open=true})};
  const restoreDetails=()=>{previous.forEach((open,detail)=>{detail.open=open});previous.clear()};
  window.addEventListener("beforeprint",openDetails);window.addEventListener("afterprint",restoreDetails);
  return()=>{window.removeEventListener("beforeprint",openDetails);window.removeEventListener("afterprint",restoreDetails);restoreDetails()};
 },[]);
 const printReport=()=>{
  trackUsage("export_download",{view:"research",format:"pdf"});
  if(!printDetails.current.size)paperRef.current?.querySelectorAll("details").forEach(detail=>{printDetails.current.set(detail,detail.open);detail.open=true});
  window.print();
 };
 const downloadMarkdown=()=>{
  trackUsage("export_download",{view:"research",format:"markdown"});
  const url=URL.createObjectURL(new Blob([researchMarkdown(data,lang)],{type:"text/markdown;charset=utf-8"}));
  const link=document.createElement("a");link.href=url;link.download=`work-language-research-current.${lang}.md`;document.body.appendChild(link);link.click();link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 const sections=[["research-question",t("问题","Question")],["research-findings",t("发现","Findings")],["research-discussion",t("讨论","Discussion")],["research-method",t("方法与复现","Methods")]];
 return <article className="study-page research-note wlo-research research-progress-edition">
  <div className="research-issue-strip"><span>{t("研究观察 · 探索性研究","Research Notes · Exploratory study")}</span><span>{t("本轮计划","Current plan")} · {researchPlan.date}</span></div>
  <button ref={directoryButton} className="text-button research-directory-toggle" aria-expanded={directoryOpen} aria-controls="research-directory" onClick={()=>setDirectoryOpen(!directoryOpen)}><Menu size={18}/>{t("目录","Contents")}</button>
  <nav className={`research-margin-nav ${directoryOpen?"is-open":""}`} id="research-directory" aria-label={t("报告目录","Report contents")}><button className="icon-button research-directory-close" aria-label={t("关闭目录","Close contents")} onClick={closeDirectory}><X size={18}/></button>{sections.map(([id,label])=><a href={`#${id}`} className={active===id?"active":""} onClick={()=>{setActive(id);setDirectoryOpen(false)}} key={id}>{active===id&&<PencilArrow/>}<span>{label}</span></a>)}</nav>
  <div className="research-paper" ref={paperRef}>
   <header className="section-heading"><div><div className="research-title-row"><h1>{b(researchFraming.title)}</h1><span className="research-paper-label"><span>{t("观察","Notes")}</span></span></div><dl className="research-quick-summary"><div><dt>{t("问了什么","Question")}</dt><dd>{b(researchFraming.question)}</dd></div><div><dt>{t("目前最清楚的结果","Clearest current finding")}</dt><dd>{b(researchObservations[0].title)}</dd></div><div><dt>{t("还没完成什么","Still unfinished")}</dt><dd>{b(researchPublicationCopy.unfinished)}</dd></div></dl><p>{b(researchFraming.lead)}</p><p className="research-scope-note">{b(researchFraming.scope)}</p></div></header>
   <div className="research-downloads"><button className="text-button" onClick={printReport}><ArrowDownToLine size={15}/>{t("打印 / 存为 PDF","Print / save as PDF")}</button><button className="text-button" onClick={downloadMarkdown}>Markdown <ArrowDownToLine size={14}/></button><a className="text-button" href="/research/stats.json" download>{t("聚合数据","Aggregate data")}<ArrowDownToLine size={14}/></a></div>
   {lang==="en"&&<details className="research-abstract"><summary>Abstract</summary><p>{b(researchFraming.abstract)}</p></details>}
   <section id="research-question" className="research-section"><h2>{t("问题","Question")}</h2><p className="research-formula">{b(researchFraming.question)}</p></section>
   <section id="research-findings" className="research-section"><div className="research-comparison-heading"><h2>{t("初步发现","Preliminary findings")}<span className="research-section-subtitle">{t("探索性词面结果","Exploratory lexical comparisons")}</span></h2><WloIllustration name="scale-stone" width={130} className="research-counter-illustration"/></div><div className="research-findings">{researchObservations.map((observation,index)=><section className="research-finding" key={observation.id} id={`observation-${observation.id}`} aria-labelledby={`observation-title-${observation.id}`}><div className="research-observation-heading"><span className="finding-index">{String(index+1).padStart(2,"0")}</span><h3 id={`observation-title-${observation.id}`}>{b(observation.title)}</h3></div><p className="research-observation-numbers">{b(observation.numbers)}</p><figure className="research-association-chart"><figcaption>{b(observation.chartLabel)}</figcaption>{observation.rows.map((row,rowIndex)=>{const rate=researchStatValue(row.rateKey),width=rate===null?0:Math.max(0,Math.min(100,rate*100));return <div className={`research-association-row pattern-${rowIndex}`} key={row.countKey}><span className="research-association-label">{b(row.label)}</span><span className="research-association-track" style={{"--bar-value":`${width}%`} as CSSProperties}><i style={{width:`${width}%`}}/>{index===0&&rowIndex===0&&<span className="research-bar-flag"><WloIllustration name="flag" width={64}/></span>}</span><strong>{fillStats(`{{stat:${row.rateKey}|pct}}`,lang)}</strong><small>{fillStats(`{{stat:${row.countKey}|int}} / {{stat:${row.denominatorKey}|int}}`,lang)} {t("份广告","ads")}</small></div>})}</figure><p className="research-observation-takeaway">{b(observation.interpretation)}</p>{onSelectTerm&&<button className="text-button research-observation-term" onClick={()=>onSelectTerm(observation.term)}>{t(`查看“${observation.term}”词条`,`Explore ${data.keywords.find(k=>k.term===observation.term)?.english.toLowerCase()||observation.term}`)}<ArrowRight size={13}/></button>}</section>)}</div></section>
   {researchDiagnostics.map(d=><section className="research-section" key={d.title.en}><h2>{b(d.title)}</h2><p>{b(d.body)}</p></section>)}
   <section id="research-discussion" className="research-section"><h2>{t("讨论","Discussion")}</h2><p>{b(researchFraming.discussion)}</p><div className="research-practical-question"><span>{t("面试中可以具体问","Questions an applicant can ask")}</span><ul>{researchQuestions.map(q=><li key={q.en}>{b(q)}</li>)}</ul></div></section>
   <span id="research-methods" className="research-anchor" aria-hidden="true"/><section id="research-method" className="research-section"><details className="study-method"><summary>{t("方法、不同读法与复现材料","Methods, alternative readings and reproducibility")}</summary><p>{b(researchFraming.rationale)}</p>
   <section id="research-data" className="research-section"><h2>{t("用的是哪些广告","The archive")}</h2><p>{b(researchFraming.data)}</p><p className="small muted">{b(researchFraming.units)}</p></section>
   <section id="research-hypothesis" className="research-section research-hypothesis"><div><h2>{t("探索性假设","Exploratory hypotheses")} <span className="pill pill--ok">{t("待检验","Untested")}</span></h2><p className="small muted">{b(researchFraming.hypothesisNote)}</p><a className="research-plan-link" href={researchPlan.url} target="_blank" rel="noreferrer">{t("编码前写定","Fixed before new coding")} · {researchPlan.date} · {researchPlan.commit}<ExternalLink size={12}/></a><div className="research-hypotheses">{researchHypotheses.map(h=><div key={h.id}><strong>{h.id}</strong><p>{b(h.plain)}</p><details><summary>{t("技术定义","Technical definition")}</summary><p>{b(h.text)}</p></details></div>)}</div></div><WloIllustration name="scale-empty" width={130} className="research-hypothesis-illustration"/></section>
   <section id="research-pipeline" className="research-section"><h2>{t("做到哪一步了","Progress through the study")}</h2><ol className="research-pipeline">{researchPipeline.map(step=><li className={step.complete?"is-complete":""} key={step.label.en}><div><strong>{b(step.label)}</strong><span>{b(step.status)}</span></div><p>{b(step.detail)}</p></li>)}</ol><details className="research-background"><summary>{t("为什么需要这些步骤","Why these steps?")}</summary><p>{b(researchFraming.pipelineNote)}</p></details></section>
   <section id="research-alternatives" className="research-section research-alternatives"><h2>{t("还可能怎样解释","Alternative readings")}</h2>{researchAlternativeReadings.map(reading=><details key={reading.question.en}><summary>{b(reading.question)}<ArrowRight size={15}/></summary><p>{b(reading.answer)}</p></details>)}</section>
   <section className="research-section"><h2>{t("来源分层比较","Source-stratified comparisons")}</h2>{researchSourcePairs.map(pair=><div key={pair.key}><h3>{b(pair.title)}</h3><div style={{maxWidth:"100%",overflowX:"auto"}}><table><thead><tr><th>{t("来源","Source")}</th><th>{t("含焦点词","Term present")}</th><th>{t("不含焦点词","Term absent")}</th><th>OR (95% CI)</th></tr></thead><tbody>{researchSourceNames.map(source=>{const k=`assoc.${pair.key}.source.${source.key}`;return <tr key={source.key}><td>{source.label}</td><td>{fillStats(`{{stat:${k}.first_rate|pct}} (n={{stat:${k}.first_n|int}})`,lang)}</td><td>{fillStats(`{{stat:${k}.other_rate|pct}} (n={{stat:${k}.other_n|int}})`,lang)}</td><td>{fillStats(`{{stat:${k}.or|or}} ({{stat:${k}.or|or-ci}})`,lang)}</td></tr>})}</tbody></table></div><p>{t("来源分层合并 OR","Source-stratified pooled OR")} {fillStats(`{{stat:assoc.${pair.key}.mh.or|or}} (95% CI {{stat:assoc.${pair.key}.mh.or|or-ci}})`,lang)}</p></div>)}<p className="small">{t("比例指同一来源内同时含另一词的广告比例；各行分母及原始列联表见聚合数据。","Shares refer to ads also containing the paired term within each source; denominators and contingency tables are in the aggregate data.")}</p></section>
   <section id="research-limits" className="research-section"><h2>{t("解释范围","Limits on interpretation")}</h2><ul className="research-limit-list">{researchLimitations.map(limit=><li key={limit.en}>{b(limit)}</li>)}</ul></section>
   <section id="research-reproduce" className="research-section"><h2>{t("复现材料","Reproducibility")}</h2><p>{b(researchFraming.reproducibility)}</p><p>{b(researchPublicationCopy.methodRecord)}</p><div className="research-material-links"><a href={researchPlan.url} target="_blank" rel="noreferrer">{t("编码前分析计划","Analysis plan")}<ExternalLink size={13}/></a><a href="https://github.com/Zhenguo-RUI/work-language-observatory/tree/main/research" target="_blank" rel="noreferrer">{t("脚本、规则与记录","Scripts, rules and logs")}<ExternalLink size={13}/></a><a href="/research/stats.json" download>{t("下载聚合统计","Download aggregate statistics")}<ArrowDownToLine size={13}/></a></div></section>
   <section id="research-references" className="research-section"><h2>{t("参考文献","References")}</h2><div className="study-reference-grid">{researchMethodReferences.map(ref=><div key={ref.author}><h3>{ref.author}</h3><a href={ref.url} target="_blank" rel="noreferrer">{ref.title}<ExternalLink size={12}/></a></div>)}</div></section>
   <section id="research-publication" className="research-section research-publication"><h2>{t("资料说明与引用","Materials and citation")}</h2>
    <details id="research-license"><summary>{t("语料使用许可","Permission to use the archive")}</summary><p>{b(researchPublicationCopy.license)}</p><p><a href="https://huggingface.co/datasets/Shifat2110724169/job-market-intel-corpus" target="_blank" rel="noreferrer">Shifat2110724169/job-market-intel-corpus</a> · <a href="https://github.com/zeitvex/JobResearchHub" target="_blank" rel="noreferrer">zeitvex/JobResearchHub</a></p><div className="research-material-links"><a href="https://github.com/Zhenguo-RUI/work-language-observatory/blob/main/research/source-decision.md" target="_blank" rel="noreferrer">{t("查看来源处理决定","Read the source decision")}<ExternalLink size={13}/></a></div></details>
    <details id="research-citation"><summary>{t("版本与引用","Version and citation")}</summary><dl className="research-version"><div><dt>{t("语料版本","Corpus version")}</dt><dd>{researchPublicationMetadata.corpusVersion}</dd></div><div><dt>{t("词表补充","Vocabulary supplement")}</dt><dd>{researchPublicationMetadata.vocabularyVersion}</dd></div><div><dt>{t("数据更新","Data updated")}</dt><dd>{researchPublicationMetadata.updatedAt}</dd></div></dl><p>{b(researchPublicationCopy.versionNote)}</p><p className="research-citation-text">{researchCitation(lang)}</p></details>
   </section>
   </details></section>
  </div>
 </article>;
}
