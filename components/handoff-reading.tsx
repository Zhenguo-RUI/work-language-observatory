"use client";
import {useRef,useState,type ReactNode} from "react";
import {ArrowRight,ArrowUpRight} from "lucide-react";
import type {Analysis} from "@/lib/observatory-types";
import {displayTerm} from "@/lib/localization";
import {sociologyReference} from "@/lib/sociology-references";
import {QuestionsPanel} from "./deep-reading";
import {WloIllustration} from "./design-symbols";
import "./handoff-reading.css";

type Props={analysis:Analysis;lang:"zh"|"en";title:string;selectedQuote:string;onEvidence:(quote:string)=>void;onTerm:(term:string)=>void;sourcePanel:ReactNode;companyPanel:ReactNode;feedbackPanel:ReactNode};
export function HandoffReading({analysis,lang,title,selectedQuote,onEvidence,onTerm,sourcePanel,companyPanel,feedbackPanel}:Props){
 const [tab,setTab]=useState<"reading"|"source">("reading"),[active,setActive]=useState("work");
 const sourceRef=useRef<HTMLElement>(null),readPosition=useRef(0);
 const t=(zh:string,en:string)=>lang==="zh"?zh:en,r=analysis.result,depth=r.depth;
 const tasks=depth?.deliverables||[],preparation=depth?.preparation;
 const levelLabel={required:t("明确要求","Required"),preferred:t("优先考虑","Preferred"),suggested:t("准备建议","Suggested"),clarify:t("待确认","Clarify")};
 const longRole=r.role[lang].length>(lang==="zh"?100:250);
 const longConditions=r.conditions.reduce((total,condition)=>total+condition[lang].length,0)>(lang==="zh"?150:400);
 const conditions=!!r.conditions.length&&<div className="handoff-conditions" aria-label={t("工作条件","Advertised conditions")}>{r.conditions.map((condition,i)=><p key={i}>{condition[lang]}</p>)}</div>;
 const hasSociology=Boolean(r.sociology[lang].trim()),concept=sociologyReference(depth?.sociologyConceptId);
 const shortSociology=Array.from(r.sociology.zh.trim()||r.sociology[lang].trim()).length<=250;
 const providedSummary=depth?.sociologySummary?.[lang]?.trim()||"";
 const distinctSummary=providedSummary&&!r.sociology[lang].includes(providedSummary)?providedSummary:"";
 function sourceLabel(quote:string){const index=r.sourceTranslation?.paragraphs.findIndex(p=>p.source.includes(quote))??-1;return index>=0?`¶${String(index+1).padStart(2,"0")}`:t("原文","Source");}
 function markedQuote(quote:string){const words=r.terms.map(term=>term.term).filter(term=>term&&quote.includes(term));if(!words.length)return quote;const word=words.sort((a,b)=>b.length-a.length)[0];const at=quote.indexOf(word);return <>{quote.slice(0,at)}<mark>{word}</mark>{quote.slice(at+word.length)}</>; }
 function showSource(quote:string){
  onEvidence(quote);
  if(window.matchMedia("(max-width: 900px)").matches){readPosition.current=window.scrollY;setTab("source");requestAnimationFrame(()=>sourceRef.current?.scrollIntoView({block:"start"}));}
 }
 function changeTab(next:"reading"|"source"){
  if(next==="source")readPosition.current=window.scrollY;
  setTab(next);
  if(next==="reading")requestAnimationFrame(()=>window.scrollTo({top:readPosition.current,behavior:"instant"}));
 }
 return <div className="handoff-reading" data-mobile-tab={tab}>
  <header className="handoff-reading-intro">
   <div className="handoff-title"><h1>{title}</h1>{analysis.engine==="rules"&&<span className="slip">{t("草稿","Draft")}</span>}</div>
   <p className="handoff-role-headline">{r.headline[lang]}</p>
   {longRole?<details className="handoff-intro-details" key={`role-${analysis.id}`}><summary>{t("岗位概览","Role overview")}</summary><p className="handoff-role">{r.role[lang]}</p></details>:<p className="handoff-role">{r.role[lang]}</p>}
   {longConditions?<details className="handoff-intro-details" key={`conditions-${analysis.id}`}><summary>{t("工作条件与待确认事项","Conditions and points to clarify")}</summary>{conditions}</details>:conditions}
   <div className="handoff-company-row"><span>{r.context?.company.name[lang]||analysis.company}</span>{companyPanel&&<details><summary>{t("公司背景","Company background")}</summary>{companyPanel}</details>}</div>
  </header>
  <div className="handoff-mobile-tabs" aria-label={t("阅读视图","Reading view")}><button aria-pressed={tab==="reading"} onClick={()=>changeTab("reading")}>{t("拆解","Reading")}</button><button aria-pressed={tab==="source"} onClick={()=>changeTab("source")}>{t("原文","Original")}</button></div>
  <div className="handoff-main">
   {!!tasks.length&&<section className="handoff-chain handoff-outputs" aria-label={t("工作概览","At a glance")}><p className="small muted">{t("工作概览","At a glance")}</p><ul>{tasks.map((task,i)=><li key={i}><span title={task.task[lang]}>{task.task[lang]}</span></li>)}</ul></section>}
   <section id="work" className="handoff-section"><div className="section-row"><h2>{t("逐条拆解工作职责","The work, step by step")}</h2><span className="t-mono">{tasks.length||r.terms.length} {t("条","items")}</span></div>
    {tasks.length?tasks.map((task,i)=><article className="handoff-task" key={i}>
     <details className="handoff-task-body" open={i===0}><summary><h3><span className="handoff-task-number">{String(i+1).padStart(2,"0")}</span>{task.task[lang]}</h3><span className="task-expand-label">{t("查看拆解","Read this task")} <ArrowRight size={14}/></span></summary>
     <button className={`handoff-quote quote ${selectedQuote===task.quote?"selected":""}`} onClick={()=>showSource(task.quote)}><span>{markedQuote(task.quote)}</span><span className="t-mono">{sourceLabel(task.quote)} <ArrowUpRight size={13}/></span></button>
     <dl className="handoff-task-detail">
      {task.object&&<div><dt>{t("对象","Object")}</dt><dd>{task.object[lang]}</dd></div>}
      {task.action&&<div><dt>{t("具体做什么","What you do")}</dt><dd>{task.action[lang]} <span className="slip">{t("参考做法","Suggested approach")}</span></dd></div>}
      {task.purpose&&<div><dt>{t("为什么要做","Why it matters")}</dt><dd>{task.purpose[lang]}</dd></div>}
      {task.scenario&&<div className="handoff-duty-example"><dt>{t("举个例子","An example")}</dt><dd>{task.scenario.text[lang]} <span className="slip">{t("情境示例","Illustrative scenario")}</span></dd></div>}
      <div><dt>{t("最后交什么","What you hand over")}</dt><dd>{task.output[lang]} <span className="slip">{t("建议","Proposed")}</span></dd></div><div><dt>{t("做到什么算好","What good work looks like")}</dt><dd>{task.check[lang]}</dd></div></dl>
     {r.terms.some(term=>term.quote===task.quote||task.quote.includes(term.quote)||term.quote.includes(task.quote))&&<details className="handoff-task-terms"><summary>{t("这项里的词","Words in this task")}</summary>{r.terms.filter(term=>term.quote===task.quote||task.quote.includes(term.quote)||term.quote.includes(task.quote)).map((term,j)=><div key={j}><h4>{displayTerm(term.term,lang)}</h4><p>{term.meaning[lang]}</p><p className="muted">{term.alternative[lang]}</p><button className="text-button" onClick={()=>onTerm(term.term)}>{t("对照其他用法","Compare other uses")} <ArrowRight size={14}/></button></div>)}</details>}
    </details></article>):r.terms.map((term,i)=><article className="handoff-task" key={i}><h3>{displayTerm(term.term,lang)}</h3><button className="handoff-quote quote" onClick={()=>showSource(term.quote)}>{term.quote}</button><p>{term.meaning[lang]}</p><details><summary>{t("另一种读法","Another reading")}</summary><p>{term.alternative[lang]}</p></details></article>)}
   </section>
   <div className="handoff-mobile-character"><WloIllustration name="ladder" width={156}/></div>
   {depth?.example&&<details className="handoff-example"><summary>{t("举例：把工作串起来看","Example: how the work fits together")} <span className="slip">{t("假设","Hypothetical")}</span></summary><p>{depth.example.scenario[lang]}</p><ol>{depth.example.steps.map((step,i)=><li key={i}>{step[lang]}</li>)}</ol><p>{depth.example.lesson[lang]}</p></details>}
   <section id="prepare" className="handoff-section handoff-preparation"><h2>{t("能力与准备","Skills and preparation")}</h2>
    {preparation&&<><ul className="handoff-competencies">{preparation.competencies.map((item,i)=><li key={i}><span className={`requirement-level ${item.level}`}>{levelLabel[item.level]}</span><div><strong>{item.skill[lang]}</strong><p>{item.application[lang]}</p>{item.quote&&<button className="text-button small" onClick={()=>showSource(item.quote)}>{t("查看依据","See source")} ↗</button>}</div></li>)}</ul>{!!preparation.materials.length&&<div className="handoff-materials"><h3>{t("可以准备的材料","Materials you could prepare")} <span className="slip">{t("建议","Suggested")}</span></h3><ul>{preparation.materials.map((item,i)=><li key={i}>{item[lang]}</li>)}</ul></div>}{!!preparation.practice.length&&<div className="handoff-practice"><h3>{t("面试可以练什么","Practice for the interview")} <span className="slip">{t("练习","Practice")}</span></h3>{preparation.practice.map((item,i)=><div key={i}><h4>{item.question[lang]}</h4><p>{item.approach[lang]}</p></div>)}</div>}</>}{depth&&<details className="handoff-work-map-details"><summary>{t("工具、协作与决定权","Tools, collaboration and decisions")}</summary><dl className="handoff-work-map"><div><dt>{t("面对什么工作","What you work on")}</dt><dd>{depth.workMap.object[lang]}</dd></div><div><dt>{t("用到的工具","Tools involved")}</dt><dd>{depth.workMap.tools[lang]}</dd></div><div><dt>{t("与谁协作","Who you work with")}</dt><dd>{depth.workMap.partners[lang]}</dd></div><div><dt>{t("哪些决定要确认","Decisions to clarify")}</dt><dd>{depth.workMap.authority[lang]}</dd></div></dl></details>}
    {!preparation&&!!tasks.length&&<details className="handoff-prepare-material"><summary>{t("可以准备的材料","Materials you could prepare")} <span className="slip">{t("建议","Proposed")}</span></summary><p className="small muted">{t("从上面的交付建议中挑一项，用自己的真实经历展示做法。","Choose an output above and use your own experience to show your approach.")}</p><ul>{tasks.slice(0,2).map((task,i)=><li key={i}>{task.output[lang]}</li>)}</ul></details>}
    <QuestionsPanel questions={r.questions} tests={depth?.questionTests} lang={lang} onEvidence={showSource}/>
   </section>
   {hasSociology&&<section id="understand" className="handoff-section handoff-sociology"><h2>{t("社会学分析","A sociological reading")}</h2>{shortSociology?<><p>{r.sociology[lang]}</p>{concept&&<p className="small"><a href={concept.url} target="_blank" rel="noreferrer">{concept.concept[lang]} · {concept.citation} ↗</a></p>}{depth?.sociologyQuotes.map((quote,i)=><button key={i} className="handoff-quote quote" onClick={()=>showSource(quote)}>{quote}</button>)}</>:<details><summary>{distinctSummary}<span className="text-button">{t("阅读 / 收起完整分析","Read / close the full analysis")}</span></summary><p>{r.sociology[lang]}</p>{concept&&<p className="small"><a href={concept.url} target="_blank" rel="noreferrer">{concept.concept[lang]} · {concept.citation} ↗</a></p>}{depth?.sociologyQuotes.map((quote,i)=><button key={i} className="handoff-quote quote" onClick={()=>showSource(quote)}>{quote}</button>)}</details>}</section>}
   {!!r.comparisons.length&&<details className="handoff-comparisons"><summary>{t("对照相近岗位","Compare related roles")}</summary>{r.comparisons.map(c=><article key={c.id}><h3>{lang==="en"?(c.titleEn||c.title):c.title}</h3><p>{c.reading[lang]}</p></article>)}</details>}
   {!!r.gaps.length&&<details className="handoff-limits"><summary>{t("还有哪些信息不清楚","What remains unclear")}</summary>{r.gaps.map((gap,i)=><p key={i}>{gap[lang]}</p>)}</details>}
   {feedbackPanel}
  </div>
  <aside className="handoff-source" ref={sourceRef}><h2>{t("原文","Original")}</h2>{sourcePanel}</aside>
  <aside className="handoff-margin"><nav aria-label={t("本页目录","On this page")}>{[["work",t("工作拆解","The work")],["prepare",t("能力与准备","Preparation")],["understand",t("进一步理解","Further reading")]].filter(([id])=>id!=="understand"||hasSociology).map(([id,label])=><a key={id} href={`#${id}`} className={active===id?"active":""} onClick={()=>setActive(id)}>{active===id&&<ArrowRight size={16}/>}<span>{label}</span></a>)}</nav><WloIllustration name="ladder" width={168}/><WloIllustration name="twocards" width={168}/></aside>
 </div>;
}
