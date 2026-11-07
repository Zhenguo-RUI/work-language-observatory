"use client";
import {ArrowRight} from "lucide-react";
import {WloIllustration} from "./design-symbols";

export function HomeContexts({lang,onCompare}:{lang:"zh"|"en";onCompare:()=>void}){
 const t=(zh:string,en:string)=>lang==="zh"?zh:en;
 return <aside className="wlo-home-aside">
  <p className="home-context-kicker">{t("一个词，两种事项","One expression, two kinds of work")}</p>
  <h2 className="home-context-term"><mark>{t("数据分析","Data analysis")}</mark></h2>
  <div className="home-context-cards">
   <article className="home-context-card card-index">
    <span className="tape" aria-hidden="true"/><span className="fold" aria-hidden="true"/>
    <div className="home-context-meta"><span>{t("策略运营实习生 · 抖音 UGC","Strategy operations intern · Douyin UGC")}</span><span className="home-quote-label">{t("引用","Translated excerpt")}</span></div>
    <h3>{t("看投稿 + 找规律 → 判断趋势","Study posts → spot patterns → assess trends")}</h3>
    <blockquote>{lang==="zh"?<>对用户内容投稿行为、消费行为进行<mark>数据分析</mark></>:<>Analyse how users <mark>post and consume content</mark>.</>}</blockquote>
    <dl><div><dt>{t("实际","Work")}</dt><dd>{t("看投稿与消费数据，找内容变化","Look for changes in posting and viewing patterns")}</dd></div><div><dt>{t("交付","Output")}</dt><dd>{t("趋势观察记录与分类建议","Trend notes and suggestions for content categories")} <small>{t("建议","Suggested")}</small></dd></div></dl>
   </article>
   <svg className="home-context-brace" viewBox="0 0 50 132" aria-hidden="true"><path d="M21 3C5 3 9 26 10 45Q11 62 3 65Q12 68 10 88C8 110 6 127 22 128M24 65h22m-9-7 9 7-9 7"/><circle cx="49" cy="65" r="3"/></svg>
   <article className="home-context-card home-context-hypothetical card-index">
    <span className="tape" aria-hidden="true"/><span className="fold" aria-hidden="true"/>
    <WloIllustration name="reader" width={110} className="home-context-reader"/>
    <div className="home-context-meta"><span>{t("电商运营 · 某零售品牌","E-commerce operations · A retail brand")}</span><span className="slip">{t("假设","Hypothetical")}</span></div>
    <h3>{t("看转化 + 调排品 → 出周报","Review conversion → adjust products → report")}</h3>
    <blockquote>{lang==="zh"?<><mark>数据分析</mark>，能独立分析转化。</>:<>Use <mark>data analysis</mark> to review conversion independently.</>}</blockquote>
    <dl><div><dt>{t("实际","Work")}</dt><dd>{t("看后台，调整主图与商品排序","Review store data; adjust images and product order")}</dd></div><div><dt>{t("交付","Output")}</dt><dd>{t("一份转化周报","A weekly conversion report")}</dd></div></dl>
   </article>
  </div>
  <p className="home-context-conclusion">{t("同一个词，两种事项，两种交付。","One expression. Different tasks and outputs.")}</p>
  <button className="text-button home-context-more" onClick={onCompare}>{t("看更多对照","Compare more contexts")} <ArrowRight size={22}/></button>
  <p className="home-context-source">{t("案例 A：用户提供的招聘文本摘句 · 案例 B：假设","A: a user-supplied job-ad excerpt · B: a hypothetical example")}</p>
 </aside>;
}
