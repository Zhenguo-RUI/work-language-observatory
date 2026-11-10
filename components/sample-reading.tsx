"use client";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useState} from "react";
import rawSample from "@/data/sample-analysis.json";
import type {Analysis} from "@/lib/observatory-types";
import {HandoffReading} from "./handoff-reading";
import {SourceTranslationPanel} from "./source-translation";
import {WloMark} from "./design-symbols";
import "./sample-reading.css";
import {readingMarkdown} from "@/lib/reading-export";
const sample=rawSample.analysis as Analysis;
export function SampleReading({lang}:{lang:"zh"|"en"}){
 const router=useRouter();
 const [quote,setQuote]=useState(""),[pdfBusy,setPdfBusy]=useState(false),[error,setError]=useState("");
 const t=(zh:string,en:string)=>lang==="zh"?zh:en;
 function markdown(){const u=URL.createObjectURL(new Blob([readingMarkdown(sample,lang)],{type:"text/markdown;charset=utf-8"}));const a=document.createElement("a");a.href=u;a.download=`wlo-sample.${lang}.md`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
 return <div className="app-shell reader-shell public-reader wlo-handoff sample-page"><Link className="skip-link" href="#main-content">{t("跳至正文","Skip to content")}</Link><header className="site-header"><div className="site-header-inner"><Link className="site-brand" href={`/?lang=${lang}`}><WloMark/><span><strong>{t("工作语言观察站","Work Language Observatory")}</strong><small>WORK LANGUAGE OBSERVATORY</small></span></Link><nav className="site-nav" aria-label={t("主要导航","Main navigation")}><Link aria-current="page" href={`/?lang=${lang}`}>{t("JD 分析","JD Analysis")}</Link><Link href={`/?page=history&lang=${lang}`}>{t("我的分析","My Analyses")}</Link><Link href={`/?page=keywords&lang=${lang}`}>{t("工作关键词","Work Keywords")}</Link><Link href={`/?page=research&lang=${lang}`}>{t("研究观察","Research Notes")}</Link></nav><div className="site-tools"><div className="wlo-language" aria-label={t("界面语言","Interface language")}>{(["zh","en"] as const).map(l=><Link key={l} href={`/?page=sample&lang=${l}`} aria-current={lang===l?"page":undefined}>{l==="zh"?"中":"EN"}</Link>)}</div></div></div></header>
 <div className="workspace"><main className="main-content view-read" id="main-content"><p className="sample-provenance"><strong>{t("完整分析示例","Complete sample analysis")}</strong> · {t("生成于","Generated on")} {rawSample.generatedDate}{rawSample.editedDate&&<> · {t("整理于","Edited on")} {rawSample.editedDate}</>}</p><p className="small muted">{rawSample.sourceNote[lang]}</p>
 <div className="result-heading"><div><button className="text-button" onClick={markdown}>Markdown ↓</button><button className="text-button" disabled={pdfBusy} onClick={async()=>{setPdfBusy(true);setError("");try{const {exportReadingPdf}=await import("@/lib/reading-pdf");await exportReadingPdf(sample,lang)}catch{setError(t("PDF未生成，请先下载Markdown或重试。","PDF export failed. Download Markdown or try again."))}finally{setPdfBusy(false)}}}>{pdfBusy?t("正在准备…","Preparing…"):"PDF ↓"}</button></div><Link className="button primary compact" href={`/?lang=${lang}`}>{t("分析自己的 JD","Analyse your JD")} →</Link></div>{error&&<p role="alert">{error}</p>}
 <HandoffReading defaultExpanded analysis={sample} lang={lang} title={lang==="en"?sample.result.sourceTranslation!.titleEn:sample.title} selectedQuote={quote} onEvidence={setQuote} onTerm={word=>{router.push(`/?page=keywords&lang=${lang}&term=${encodeURIComponent(word)}`)}} companyPanel={null} feedbackPanel={null} sourcePanel={<SourceTranslationPanel title={sample.title} rawText={sample.raw_text} translation={sample.result.sourceTranslation} lang={lang} selectedQuote={quote} onQuote={setQuote}/>}/>
 </main><footer className="app-footer"><span>© 2026 {t("工作语言观察站","Work Language Observatory")}</span><Link href={`/?page=research&lang=${lang}`}>{t("研究观察","Research Notes")}</Link></footer></div></div>;
}
