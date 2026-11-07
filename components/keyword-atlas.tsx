"use client";

import {useEffect, useRef, useState} from "react";
import {ArrowUpRight, Search, X, Menu} from "lucide-react";
import {WloIllustration} from "./design-symbols";
import {trackUsage} from "@/lib/usage-client";
import type {PublicStudy} from "@/lib/public-study-types";
import "./research-pages.css";
import "./keyword-handoff.css";

type Lang = "zh" | "en";

function PencilOval(){
  return <svg className="atlas-pencil-oval" viewBox="0 0 220 90" preserveAspectRatio="none" aria-hidden="true"><path d="M179 10C145-2 54 1 19 25C-18 51 22 83 89 85C146 88 209 72 216 44C222 24 196 12 176 12"/></svg>;
}
function PaperTape({extra=false}:{extra?:boolean}){
  return <svg className={`atlas-tape${extra?" atlas-tape-extra":""}`} viewBox="0 0 150 40" aria-hidden="true"><path d="M7 4L18 3L26 5L37 3L48 5L61 3L72 4L85 3L97 4L111 3L123 4L143 3L140 10L143 15L139 20L142 25L138 30L140 36L126 35L113 37L101 35L89 36L76 35L63 37L50 35L38 36L25 35L12 36L3 35L6 29L3 25L7 20L4 15L8 10Z"/></svg>;
}
function ContextArrow(){
  return <svg className="atlas-context-arrow" viewBox="0 0 30 116" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4C13 15 15 26 14 36M6 13L14 3L23 14M14 82C13 94 15 102 14 112M6 103L14 113L23 102"/></g><g fill="var(--sage)"><circle cx="14" cy="49" r="2"/><circle cx="14" cy="59" r="2"/><circle cx="14" cy="69" r="2"/></g></svg>;
}
function PaperFold(){
  return <svg className="atlas-paper-fold" viewBox="0 0 24 24" aria-hidden="true"><path d="M1 23L23 1L23 24H1Z" fill="var(--paper)"/><path d="M1 23L2 5Q2 2 6 2L23 1L1 23" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.2" strokeLinejoin="round"/></svg>;
}

export function KeywordAtlas({data, lang, initialTerm = "", onResearch}: {
  data: PublicStudy;
  lang: Lang;
  initialTerm?: string;
  onResearch?: () => void;
}) {
  const [directoryOpen,setDirectoryOpen]=useState(false);
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState(initialTerm || data.keywords[0]?.term || "");
  const detail = useRef<HTMLElement>(null);
  useEffect(() => {
    if (initialTerm && data.keywords.some(k => k.term === initialTerm)) {
      setTerm(initialTerm);
      setQuery("");
    }
  }, [initialTerm, data.keywords]);
  const t = (z: string, e: string) => lang === "zh" ? z : e;
  const selected = data.keywords.find(k => k.term === term) || data.keywords[0];
  const filtered = data.keywords.filter(k => [k.term, k.english, k.short[lang]].join(" ").toLowerCase().includes(query.toLowerCase().trim()));
  const choose = (value: string) => {
    trackUsage("keyword_select", {view: "keywords"});
    setTerm(value);setDirectoryOpen(false);
    const u = new URL(location.href);
    u.searchParams.set("term", value);
    history.replaceState(null, "", u);
    if (window.matchMedia("(max-width: 800px)").matches) {
      detail.current?.scrollIntoView({behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start"});
    }
  };
  useEffect(()=>{if(!directoryOpen)return;const close=(event:KeyboardEvent)=>{if(event.key==="Escape")setDirectoryOpen(false)};window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close);},[directoryOpen]);
  if (!selected) return null;

  return <div className="study-page keyword-atlas">
    <header className="section-heading">
      <div><h1>{t("同一个词，不同的工作要求。", "One word, different work.")}</h1><p>{t("保留岗位与语境，比较熟悉的能力词如何被使用。", "Keep the role and context in view to compare familiar work terms.")}</p></div>
      {onResearch && <button className="text-button" onClick={onResearch}>{t("研究报告", "Research report")}<ArrowUpRight size={16}/></button>}
    </header>
    <div className="study-source-strip">
      <span>{data.methods.corpusN.toLocaleString()} {t("份去重广告", "unique ads")}</span>
      <span>{t(`${data.keywords.length}个高频词 · ${data.keywords.reduce((n,k)=>n+k.examples.length,0)}个语境案例`, `${data.keywords.length} terms · ${data.keywords.reduce((n,k)=>n+k.examples.length,0)} context examples`)}</span>
    </div>
    <button className="text-button atlas-directory-toggle" aria-expanded={directoryOpen} aria-controls="keyword-directory" onClick={()=>setDirectoryOpen(!directoryOpen)}><Menu size={18}/>{t("词条目录","Term directory")} · {data.keywords.length}<WloIllustration name="hand" width={44} className="atlas-directory-hand"/></button><div className="atlas-layout">
      <aside id="keyword-directory" className={`atlas-index ${directoryOpen?"is-open":""}`} aria-label={t("关键词排名与检索", "Keyword ranking and search")}>
        <button className="icon-button atlas-directory-close" aria-label={t("关闭目录","Close directory")} onClick={()=>setDirectoryOpen(false)}><X size={18}/></button><label className="atlas-search"><Search size={17}/><span className="sr-only">{t("搜索关键词", "Search keywords")}</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={t("搜索词语", "Search terms")}/></label>
        <div className="atlas-list-label"><span>{t("按出现频次排序", "By frequency")}</span><span>{t("广告数", "Ads")}</span></div>
        <div className="atlas-list">{filtered.map(k => <button key={k.term} className={`atlas-term ${selected.term === k.term ? "selected" : ""}`} aria-pressed={selected.term === k.term} onClick={() => choose(k.term)}>
          <span className="atlas-rank">{String(k.rank).padStart(2, "0")}</span>
          <span className="atlas-term-name"><span className="atlas-term-label">{lang === "zh" ? k.term : k.english}{selected.term === k.term&&<PencilOval/>}</span><small>{lang === "zh" ? k.english : k.term}</small></span>
          <span className="atlas-count">{k.documents.toLocaleString()}</span>
        </button>)}</div>
        {!filtered.length && <p className="atlas-empty">{t("没有找到这个词，试试其他说法。", "No match. Try another term.")}</p>}
        <WloIllustration name="pointer" width={112} className="atlas-index-pointer"/><p className="atlas-index-note">{t("在33项候选词中排序。计数表示包含该词的广告数。", "Ranked within 33 candidate expressions. Counts show ads containing each term.")}</p>
      </aside>
      <section className="atlas-detail" ref={detail} aria-labelledby="atlas-detail-title">
        <header className="atlas-detail-heading">
          <div className="atlas-title-row"><h2 id="atlas-detail-title" tabIndex={-1}><span>{lang === "zh" ? selected.term : selected.english}</span><PencilOval/></h2><p className="atlas-gloss">{lang === "zh" ? selected.english : selected.term}</p></div>
          <p className="atlas-detail-count" title={t("包含该词的广告数 / 样本总数","Ads containing the term / all ads")}><strong>{(data.methods.corpusN?100*selected.documents/data.methods.corpusN:0).toFixed(1)}%</strong><span>{selected.documents.toLocaleString()} / {data.methods.corpusN.toLocaleString()} {t("份", "ads")}</span><span className="atlas-count-slip">{t("样本内","In sample")}</span></p>
          <p className="atlas-provenance">{t("以下三例来自不同来源广告，均为去识别释义，非原文引句。", "Three deidentified paraphrases from different ad sources, not direct quotations.")}</p>
        </header>
        <div className="atlas-contexts-heading"><h3>{t("几个不同的语境","Different contexts")}</h3><span>{selected.examples.length} {t("例","examples")}</span></div>
        <div className="atlas-examples">{selected.examples.map((example, i) => <article className="atlas-example card-index" style={{"--tilt":`${[-1.2,.8,-.6][i%3]}deg`} as React.CSSProperties} key={selected.term + i}>
          <PaperTape/><PaperFold/>{i===0&&<WloIllustration name="peek" width={100} className="atlas-card-peek"/>}{i===1&&<PaperTape extra/>}{i>0&&<ContextArrow/>}
          <div className="atlas-example-top"><span className="atlas-example-number">{String(i + 1).padStart(2, "0")}</span><h3>{example.role[lang]}</h3></div>
          <p className="atlas-reading">{example.reading[lang]}</p>
          <p className="atlas-context">{example.context[lang]}</p><span className="atlas-paraphrase-label">{t("归档释义 · 非原文引句","Archive paraphrase · not a quotation")}</span>
          <details className="atlas-question"><summary>{t("可以追问", "A useful follow-up")}</summary><p>{example.question[lang]}</p></details>
        </article>)}</div>
        <div className="atlas-closing"><p className="atlas-definition atlas-bottom-reading">{selected.short[lang]}<svg viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true"><path d="M2 7Q23 2 43 6T86 6T128 7T169 6T213 7T255 6T298 5"/></svg></p><WloIllustration name="twocards" width={120} className="atlas-two-cards"/></div>
      </section>
    </div>
    <details className="study-method"><summary>{t("词表与统计方法", "Vocabulary and counting method")}</summary>
      <p>{data.methods.frequencyNote[lang]}</p><p>{data.methods.scope[lang]}</p><p>{data.methods.sampleNote[lang]}</p>
      <p>{t("例子用于比较语境，不代表各词义的占比；词频也不是岗位质量评分。", "Examples compare contexts, not the prevalence of each meaning. Frequency is not a job-quality score.")}</p>
      <p className="study-vocabulary">{data.methods.candidateVocabulary?.join(" · ")}</p>
      <a className="text-button" href="/work-language-study-aggregates.json" download>{t("下载词频与交叉表", "Download frequencies and cross-tabs")}<ArrowUpRight size={14}/></a>
    </details>
  </div>;
}
