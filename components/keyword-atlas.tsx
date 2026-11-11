"use client";

import {useEffect, useRef, useState} from "react";
import {ArrowUpRight, Search, X, Menu} from "lucide-react";
import {WloIllustration} from "./design-symbols";
import {trackUsage} from "@/lib/usage-client";
import type {PublicStudy} from "@/lib/public-study-types";
import {keywordContexts, keywordGroups, type KeywordGroup} from "@/lib/keyword-contexts";
import {fillStats} from "@/lib/research-stats";
import "./research-pages.css";
import "./keyword-handoff.css";

type Lang = "zh" | "en";
type PointerLine = {path:string;endX:number;endY:number;width:number;height:number;clerkTop:number|null;visible:boolean};

function PencilOval({index=false}:{index?:boolean}){
  return <svg className="atlas-pencil-oval" viewBox="0 0 220 90" preserveAspectRatio="none" aria-hidden="true"><path d={index?"M0 68C-13 47 14 15 61 7C111-4 185 2 211 27C242 59 191 84 132 86C89 90 53 84 34 77":"M179 10C145-2 54 1 19 25C-18 51 22 83 89 85C146 88 209 72 216 44C222 24 196 12 176 12"}/></svg>;
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

type KeywordAtlasProps={data:PublicStudy;lang:Lang;initialTerm?:string;onResearch?:()=>void};
export function KeywordAtlas(props:KeywordAtlasProps){return <KeywordAtlasContent key={props.initialTerm||""} {...props}/>;}
function KeywordAtlasContent({data,lang,initialTerm="",onResearch}:KeywordAtlasProps) {
  const [directoryOpen,setDirectoryOpen]=useState(false);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<KeywordGroup | "">("");
  const [term, setTerm] = useState(initialTerm || data.keywords[0]?.term || "");
  const detail = useRef<HTMLElement>(null);
  const indexTrack = useRef<HTMLDivElement>(null);
  const indexScroll = useRef<HTMLDivElement>(null);
  const clerk = useRef<HTMLDivElement>(null);
  const [pointerLine,setPointerLine] = useState<PointerLine|null>(null);
  const t = (z: string, e: string) => lang === "zh" ? z : e;
  const stat = (key: string) => fillStats(`{{stat:${key}|int}}`, lang);
  const selected = data.keywords.find(k => k.term === term) || data.keywords[0];
  const expansion = selected ? keywordContexts[selected.term] : undefined;
  const filtered = data.keywords.filter(k => (!group || keywordContexts[k.term]?.group === group) && [k.term, k.english, k.short[lang]].join(" ").toLowerCase().includes(query.toLowerCase().trim()));
  const allAIReviewed = selected?.examples.every((example, i) => {
    const context = expansion?.examples[i];
    return context?.sourceRoleZh === example.role.zh && context.reviewStatus === "ai_reviewed";
  });
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
  useEffect(()=>{
    const track=indexTrack.current,scroll=indexScroll.current,figure=clerk.current;
    if(!track||!scroll||!figure)return;
    let frame=0,cancelled=false;
    const measure=()=>{
      frame=0;
      const active=track.querySelector<HTMLElement>(".atlas-term.selected");
      const ring=active?.querySelector<SVGElement>(".atlas-pencil-oval");
      const rank=active?.querySelector<HTMLElement>(".atlas-rank");
      const box=track.getBoundingClientRect(),list=scroll.getBoundingClientRect();
      if(!active||!ring||!rank||!box.width||!box.height){setPointerLine(null);return;}
      const target=ring.getBoundingClientRect(),image=figure.getBoundingClientRect();
      const row=active.getBoundingClientRect(),number=rank.getBoundingClientRect();
      const mobile=window.matchMedia("(max-width: 900px)").matches;
      // Feet follow the selected row, including when the index itself scrolls.
      const clerkTop=row.bottom-box.top-image.height;
      // The reference has a short marginal gesture below the numeral, not a
      // straight pointer from the raised hand through the rank and term.
      const endX=target.left-box.left;
      const endY=target.top-box.top+target.height*68/90;
      const limit=mobile?22:34;
      let span=limit*.78;
      let startX=0,startY=0,middleX=0,middleY=0;
      const point=(t:number)=>({x:(1-t)**2*startX+2*(1-t)*t*middleX+t*t*endX,y:(1-t)**2*startY+2*(1-t)*t*middleY+t*t*endY});
      // Measure the curve, not only its chord; shorten deterministically to
      // respect the phone/desktop limits while keeping the oval endpoint fixed.
      for(let attempt=0;attempt<16;attempt++){
        startX=endX-span;
        startY=Math.max(endY+4,number.bottom-box.top+3);
        const chord=Math.hypot(endX-startX,endY-startY);
        middleX=(startX+endX)/2-chord*.35;
        middleY=Math.max(startY,endY)+chord*.35;
        let length=0,previous=point(0),clear=true;
        for(let step=1;step<=32;step++){
          const p=point(step/32);length+=Math.hypot(p.x-previous.x,p.y-previous.y);previous=p;
          if(p.x>=number.left-box.left-1&&p.x<=number.right-box.left+1&&p.y<number.bottom-box.top+2)clear=false;
        }
        if(length<=limit&&clear)break;
        span*=.88;
      }
      const visible=row.top>=list.top-1&&row.bottom<=list.bottom+1;
      const next={path:`M ${startX.toFixed(2)} ${startY.toFixed(2)} Q ${middleX.toFixed(2)} ${middleY.toFixed(2)} ${endX.toFixed(2)} ${endY.toFixed(2)}`,endX,endY,width:box.width,height:box.height,clerkTop,visible};
      setPointerLine(previous=>JSON.stringify(previous)===JSON.stringify(next)?previous:next);
    };
    const schedule=()=>{if(!cancelled&&!frame)frame=requestAnimationFrame(measure)};
    const observer=new ResizeObserver(schedule);
    observer.observe(track);observer.observe(scroll);observer.observe(figure);
    const ring=track.querySelector<SVGElement>(".atlas-term.selected .atlas-pencil-oval");if(ring)observer.observe(ring);
    scroll.addEventListener("scroll",schedule,{passive:true});
    window.addEventListener("resize",schedule,{passive:true});
    window.addEventListener("scroll",schedule,{passive:true,capture:true});
    void document.fonts.ready.then(schedule);schedule();
    return()=>{cancelled=true;if(frame)cancelAnimationFrame(frame);observer.disconnect();scroll.removeEventListener("scroll",schedule);window.removeEventListener("resize",schedule);window.removeEventListener("scroll",schedule,true);};
  },[selected?.term,selected?.rank,lang,query,group,directoryOpen]);
  if (!selected) return null;

  return <div className="study-page keyword-atlas">
    <header className="section-heading">
      <div><h1>{t("同一个词，不同的工作要求。", "One word, different work.")}</h1><p>{t("保留岗位与语境，比较熟悉的能力词如何被使用。", "Keep the role and context in view to compare familiar work terms.")}</p></div>
      {onResearch && <button className="text-button" onClick={onResearch}>{t("研究报告", "Research report")}<ArrowUpRight size={16}/></button>}
    </header>
    <div className="study-source-strip">
      <span>{stat("corpus.n")} {t("份去重广告", "unique ads")}</span>
      <span>{stat("corpus.dictionary_terms")} {t("个词条 · 按工作语境读", "terms · read in context")}</span>
    </div>
    <button className="text-button atlas-directory-toggle" aria-expanded={directoryOpen} aria-controls="keyword-directory" onClick={()=>setDirectoryOpen(!directoryOpen)}><Menu size={18}/>{t("词条目录","Term directory")} · {stat("corpus.dictionary_terms")}<WloIllustration name="hand" width={44} className="atlas-directory-hand"/></button><div className="atlas-layout">
      <aside id="keyword-directory" className={`atlas-index ${directoryOpen?"is-open":""}`} aria-label={t("关键词排名与检索", "Keyword ranking and search")}>
        <button className="icon-button atlas-directory-close" aria-label={t("关闭目录","Close directory")} onClick={()=>setDirectoryOpen(false)}><X size={18}/></button><label className="atlas-search"><Search size={17}/><span className="sr-only">{t("搜索关键词", "Search keywords")}</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={t("搜索词语", "Search terms")}/></label>
        <label className="atlas-group-filter"><span>{t("按用途查词", "Browse by group")}</span><select value={group} onChange={e => setGroup(e.target.value as KeywordGroup | "")}><option value="">{t("全部词条", "All terms")}</option>{Object.entries(keywordGroups).map(([key, label]) => <option key={key} value={key}>{label[lang]}</option>)}</select></label>
        <div className="atlas-list-label"><span>{t("词条索引", "Term index")}</span><span>{t("广告数", "Ads")}</span></div>
        <div className="atlas-index-track term-index" ref={indexTrack}><div className="atlas-list" ref={indexScroll}>{filtered.map(k => <button key={k.term} className={`atlas-term ${selected.term === k.term ? "selected" : ""}`} aria-pressed={selected.term === k.term} onClick={() => choose(k.term)}>
          <span className="atlas-rank">{String(k.rank).padStart(2, "0")}</span>
          <span className="atlas-term-name"><span className="atlas-term-label">{lang === "zh" ? k.term : k.english}{selected.term === k.term&&<PencilOval index/>}</span><small>{lang === "zh" ? k.english : k.term}</small></span>
          <span className="atlas-count">{stat(`term.${k.term}.ads`)}</span>
        </button>)}</div>
        <div ref={clerk} className={`atlas-clerk-anchor${pointerLine?.visible?" has-target":""}`} style={pointerLine?.clerkTop!=null?{top:pointerLine.clerkTop,bottom:"auto"}:undefined}><WloIllustration name="pointer-hand" width={44} className="atlas-index-pointer clerk"/></div>
        {pointerLine?.visible&&<svg className="clerk-stick" width={pointerLine.width} height={pointerLine.height} viewBox={`0 0 ${pointerLine.width} ${pointerLine.height}`} aria-hidden="true"><path d={pointerLine.path}/><circle cx={pointerLine.endX} cy={pointerLine.endY} r="1.8"/></svg>}
        </div>
        {!filtered.length && <p className="atlas-empty">{t("没有找到这个词，试试其他说法。", "No match. Try another term.")}</p>}
        <p className="atlas-index-note">{stat("corpus.candidate_terms")} {t("项候选词 · 每份广告计一次", "candidate terms · counted once per ad")}</p>
      </aside>
      <section className="atlas-detail" ref={detail} aria-labelledby="atlas-detail-title">
        <header className="atlas-detail-heading">
          <div className="atlas-title-row"><h2 id="atlas-detail-title" tabIndex={-1}><span>{lang === "zh" ? selected.term : selected.english}</span><PencilOval/></h2><p className="atlas-gloss">{lang === "zh" ? selected.english : selected.term}</p></div>
          <p className="atlas-definition atlas-term-summary">{(expansion?.short || selected.short)[lang]}<svg viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true"><path d="M2 7Q23 2 43 6T86 6T128 7T169 6T213 7T255 6T298 5"/></svg></p>
          <p className="atlas-data-line">{stat(`term.${selected.term}.ads`)} {t("份广告命中", "ads matched")} / {stat("corpus.n")} {t("份广告", "ads")}{expansion&&<span>{keywordGroups[expansion.group][lang]}</span>}</p>
          {selected.exploratory&&<p className="atlas-pending-note">{t("计划后补充 · 模型草稿 · 探索性词条，不进入原有假设及深度编码。","Added after the plan · Model draft · Exploratory entry outside the original hypotheses and deep-coding set.")}</p>}
        </header>
        <div className="atlas-contexts-heading"><h3>{t("在这些工作里，具体怎么用","What it means in these roles")}</h3></div>
        <div className="atlas-examples">{selected.examples.map((example, i) => {
          const added = expansion?.examples[i];
          const context = added?.sourceRoleZh === example.role.zh ? added : undefined;
          return <article className="atlas-example card-index" style={{"--tilt":`${[-1.2,.8,-.6][i%3]}deg`} as React.CSSProperties} key={selected.term + i}>
          <PaperTape/><PaperFold/>{i===0&&<WloIllustration name="peek" width={100} className="atlas-card-peek"/>}{i===1&&<PaperTape extra/>}{i>0&&<ContextArrow/>}
          <div className="atlas-example-top"><span className="atlas-example-number">{String(i + 1).padStart(2, "0")}</span><h3>{example.role[lang]}</h3></div>
          <span className="atlas-detail-label">{t("这里做什么", "What the work involves")}</span><p className="atlas-reading">{context?.task[lang] || example.reading[lang]}</p>
          {context&&<><p className="atlas-expert-reading">{context.expertTake[lang]}</p><p className="atlas-deliverable"><span>{t("可能的交付","Possible deliverable")}</span>{context.deliverable[lang]}</p></>}
          <div className="atlas-follow-up"><span className="atlas-detail-label">{t("可以问", "Ask the employer")}</span><p>{(context?.question || example.question)[lang]}</p></div>
        </article>})}</div>

        <div className="atlas-closing"><WloIllustration name="twocards" width={120} className="atlas-two-cards"/></div>
        <details className="atlas-archive-contexts"><summary>{t("查看归档中的职责描述", "Read the archived duty descriptions")}</summary>{selected.examples.map((example, i)=><div key={selected.term+i}><h4>{example.role[lang]}</h4><p>{example.context[lang]}</p></div>)}</details>
      </section>
    </div>
    <details className="study-method"><summary>{t("词表与统计方法", "Vocabulary and counting method")}</summary>
      <p>{t("这些案例为挑选的工作对照，不代表词义分布。", "These examples are selected contrasts, not a distribution of meanings.")}</p>
      <p className="atlas-review-note">{allAIReviewed?t("卡片使用归档广告的去识别释义，已经AI编辑复核，尚无人工审核结果；交付建议供准备时参考。", "The cards use deidentified paraphrases of archived ads and have received an AI editorial review. No human review results are available; suggested deliverables are preparation ideas."):t("卡片使用归档广告的去识别释义，任务说明与交付建议由AI起草，尚无人工审核结果。", "The cards use deidentified paraphrases of archived ads. Task explanations and suggested deliverables were drafted by AI; no human review results are available.")}</p>
      <p>{t("按广告正文匹配词表，同一广告重复出现只计一次。暂将独立站、服务器、机器学习等复合词中的命中单独标记，再保留其余命中；这些规则尚待人工抽查。", "Terms are matched in ad bodies, with each ad counted once per term. Matches inside listed compounds, such as independent online stores, servers and machine learning, are flagged separately. The remaining matches still await human checks.")}</p>
      <p>{t("人工抽查尚未完成，当前不展示匹配精确率。职业分类仍在准备，尚无经核对的职业分布、搭配词或词义比例。", "Human checks are incomplete, so matching precision is not reported. Occupation mapping is still being prepared; there are no validated occupation distributions, collocates or meaning proportions to show.")}</p>
      <p>{t("分组按词语通常指向品质、协作、工具或管理安排来帮助查找，由作者提出，不是模型测出的词义类别。目录按命中广告数排序。", "The author proposed groups around qualities, collaboration, skills and management to help readers browse. They are not measured meaning categories. The directory is ordered by matching advertisement count.")}</p>
      <p className="study-vocabulary">{data.methods.candidateVocabulary?.join(" · ")}</p>
      <a className="text-button" href="/work-language-study-aggregates.json" download>{t("下载词频与交叉表", "Download frequencies and cross-tabs")}<ArrowUpRight size={14}/></a>
    </details>
  </div>;
}
