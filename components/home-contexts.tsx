"use client";
import {ArrowRight} from "lucide-react";
import {WloIllustration} from "./design-symbols";
import archive from "@/data/home-archive-contexts.json";

export function HomeContexts({lang,onCompare}:{lang:"zh"|"en";onCompare:()=>void}){
 const t=(zh:string,en:string)=>lang==="zh"?zh:en;
 return <aside className="wlo-home-aside">
  <p className="home-context-kicker">{t("一个词，两种事项","One expression, two kinds of work")}</p>
  <h2 className="home-context-term"><mark>{lang==="zh"?archive.term:archive.english}</mark></h2>
  <div className="home-context-cards">
   {archive.examples.map((example,index)=><article key={example.role.zh} className={`home-context-card card-index${index===1?" home-context-secondary":""}`}>
    <span className="tape" aria-hidden="true"/><span className="fold" aria-hidden="true"/>
    {index===1&&<WloIllustration name="reader" width={110} className="home-context-reader"/>}
    <div className="home-context-meta"><span>{example.role[lang]}</span><span className="home-quote-label">{index===0?t("案例 A","Example A"):t("案例 B","Example B")}</span></div>
    <h3>{example.task[lang]}</h3>
    <blockquote>{example.context[lang]}</blockquote>
    <dl><div><dt>{t("工作","Work")}</dt><dd>{example.reading[lang]}</dd></div><div><dt>{t("交付建议","Suggested output")}</dt><dd>{example.deliverable[lang]}</dd></div></dl>
   </article>)}
   <svg className="home-context-brace" viewBox="0 0 50 132" aria-hidden="true"><path d="M21 3C5 3 9 26 10 45Q11 62 3 65Q12 68 10 88C8 110 6 127 22 128M24 65h22m-9-7 9 7-9 7"/><circle cx="49" cy="65" r="3"/></svg>
  </div>
  <p className="home-context-conclusion">{t("看测试结果，或查招聘流程。先问数据用来做什么。","Test results or hiring stages: ask what the data are used for.")}</p>
  <button className="text-button home-context-more" onClick={onCompare}>{t("看更多对照","Compare more contexts")} <ArrowRight size={22}/></button>
  <p className="home-context-source">{t("案例取自归档广告，已去识别并改写。交付是准备建议。","Examples paraphrase archived advertisements without identifying details. Outputs are preparation suggestions.")}</p>
 </aside>;
}
