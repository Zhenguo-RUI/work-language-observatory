"use client";

import {useEffect,useId,useMemo,useRef,useState} from "react";
import "./source-translation.css";

export type SourceTranslation={
 titleEn:string;
 paragraphs:{source:string;en:string}[];
 basis:"model"|"curated"|"browser"|"original";
 sourceHash:string;
};
export type SourceTranslationPanelProps={
 rawText:string;
 title:string;
 translation?:SourceTranslation;
 lang:"zh"|"en";
 selectedQuote:string;
 onQuote:(quote:string)=>void;
 onTranslate?:()=>void;
 translating?:boolean;
 canTranslate?:boolean;
 translationError?:string;
};

/** Reject a partial or stale source pairing rather than present it as a full translation. */
export function sourceTranslationMatches(rawText:string,translation?:SourceTranslation){
 return !!translation?.titleEn.trim()&&translation.paragraphs.length>0&&
  translation.paragraphs.every(p=>!!p.source.trim()&&!!p.en.trim())&&
  translation.paragraphs.map(p=>p.source).join("").replace(/\s+/g,"")===rawText.replace(/\s+/g,"");
}

function MarkedSource({text,start,selectedStart,selectedEnd}:{text:string;start:number;selectedStart:number;selectedEnd:number}){
 const from=Math.max(0,selectedStart-start),to=Math.min(text.length,selectedEnd-start);
 return selectedStart<0||to<=from?<>{text}</>:<>{text.slice(0,from)}<mark>{text.slice(from,to)}</mark>{text.slice(to)}</>;
}

export function SourceTranslationPanel(props:SourceTranslationPanelProps){return <SourceTranslationContent key={`${props.lang}\0${props.rawText}`} {...props}/>;}
function SourceTranslationContent({rawText,title,translation,lang,selectedQuote,onQuote,onTranslate,translating=false,canTranslate=false,translationError}:SourceTranslationPanelProps){
 const t=(zh:string,en:string)=>lang==="zh"?zh:en;
 const id=useId(),panel=useRef<HTMLElement>(null);
 const [viewChoice,setViewChoice]=useState<{view:"en"|"source";quote:string}>({view:lang==="en"?"en":"source",quote:selectedQuote});
 const valid=sourceTranslationMatches(rawText,translation);
 const selectedStart=selectedQuote?rawText.indexOf(selectedQuote):-1;
 const selectedEnd=selectedStart<0?-1:selectedStart+selectedQuote.length;
 const narrowView=selectedStart>=0&&viewChoice.quote!==selectedQuote?"source":viewChoice.view;
 const setNarrowView=(view:"en"|"source")=>setViewChoice({view,quote:selectedQuote});
 const rows=useMemo(()=>{
  if(!valid||!translation)return [];
  let cursor=0;
  return translation.paragraphs.map((paragraph,index)=>{
   const at=rawText.indexOf(paragraph.source,cursor);
   // Content validation permits surrounding whitespace differences. The raw source
   // still remains the canonical view; never manufacture an offset when it cannot align.
   if(at<0)return {paragraph,source:paragraph.source,start:-1};
   const end=at+paragraph.source.length,start=cursor;
   const source=rawText.slice(start,index===translation.paragraphs.length-1?rawText.length:end);
   cursor=end;
   return {paragraph,source,start};
  });
 },[rawText,translation,valid]);
 const aligned=valid&&rows.every(row=>row.start>=0);
 useEffect(()=>{
  if(!selectedQuote||selectedStart<0)return;
  const frame=requestAnimationFrame(()=>panel.current?.querySelector("mark")?.scrollIntoView({block:"nearest",behavior:"auto"}));
  return ()=>cancelAnimationFrame(frame);
 },[selectedQuote,selectedStart,rawText]);
 const englishLabel=translation?.basis==="original"?t("英文原文","English source"):t("英文全文","English translation");
 const statusLabel=translation?.basis==="curated"?t("项目整理译文","Project-prepared translation"):translation?.basis==="browser"?t("浏览器翻译","Browser translation"):translation?.basis==="original"?t("原文为英文","Originally in English"):t("自动翻译，保留原文供核对","Machine translation; original retained for checking");
 return <section className="jd-translation panel" ref={panel} aria-labelledby={`${id}-heading`}>
  <header className="jd-translation-heading">
   <div>
    <span className="micro-label">{t("岗位与招聘全文","JOB TITLE & DESCRIPTION")}</span>
    <h2 id={`${id}-heading`} lang={lang==="en"&&valid?"en":undefined}>{lang==="en"?(valid?translation!.titleEn:"Job description"):(title||"岗位描述")}</h2>
    {lang==="en"&&title&&<p className="jd-source-title"><span>Original job title</span><br/>{title}</p>}
    {lang==="zh"&&valid&&<p className="jd-source-title" lang="en">{translation!.titleEn}</p>}
   </div>
   {valid&&<span className="jd-translation-basis">{statusLabel}</span>}
  </header>
  <p className="jd-translation-help">{t("原文与译文按段落对应。点击“定位原文”或分析中的证据，可回查原句。","Paragraphs pair the translation with its source. Use “Locate source” or a quoted passage in the analysis to inspect the original wording.")}</p>
  <div className="jd-source-switch" aria-label={t("窄屏阅读语言","Reading language on narrow screens")}>
   <button type="button" aria-pressed={narrowView==="en"} onClick={()=>setNarrowView("en")}>{englishLabel}</button>
   <button type="button" aria-pressed={narrowView==="source"} onClick={()=>setNarrowView("source")}>{t("原文","Original")}</button>
  </div>
  {translationError&&<p className="jd-translation-error" role="alert">{translationError}</p>}
  {!aligned&&<div className="jd-translation-status" role="status" aria-live="polite">
   <strong>{translating?t("正在翻译岗位名称与全文…","Translating the job title and full description…"):t("全文译文尚不可用","Full translation is not available yet")}</strong>
   <p>{translation&&!valid?t("现有译文未完整对应当前JD，因此不将它显示为完整译文。","The available translation does not cover the current JD, so it is not presented as a complete translation."):t("下方保留完整原文；原文不是译文，也未被摘要替代。","The complete original is retained below. It is not presented as a translation or replaced with a summary.")}</p>
   {canTranslate&&onTranslate&&<button type="button" className="button secondary compact" onClick={onTranslate} disabled={translating}>{translating?t("正在翻译…","Translating…"):t("翻译岗位与全文","Translate title and full JD")}</button>}
  </div>}
  {aligned?<div className="jd-parallel" data-view={narrowView}>
   <div className="jd-parallel-label jd-en" lang="en">{englishLabel}</div>
   <div className="jd-parallel-label jd-original">{t("原文 · 证据定位依据","Original · evidence reference")}</div>
   {rows.map(({paragraph,source,start},i)=>{
    const selected=selectedStart>=0&&selectedStart<start+source.length&&selectedEnd>start;
    return <div className={`jd-parallel-row ${selected?"is-linked":""}`} key={`${i}-${start}`}>
     <div className="jd-paragraph jd-en" lang="en">
      <span className="jd-paragraph-number" aria-label={`Paragraph ${i+1}`}>{String(i+1).padStart(2,"0")}</span>
      <p>{paragraph.en}</p>
      <button type="button" className="text-button" onClick={()=>onQuote(paragraph.source)} aria-label={`Locate original paragraph ${i+1}`}>Locate source</button>
     </div>
     <div className="jd-paragraph jd-original">
      <span className="jd-paragraph-number" aria-label={t(`第${i+1}段`,`Original paragraph ${i+1}`)}>{String(i+1).padStart(2,"0")}</span>
      <pre><MarkedSource text={source} start={start} selectedStart={selectedStart} selectedEnd={selectedEnd}/></pre>
     </div>
    </div>;
   })}
  </div>:<div className="jd-untranslated-source">
   <h3>{t("完整原文","Complete original")}</h3>
   <pre><MarkedSource text={rawText} start={0} selectedStart={selectedStart} selectedEnd={selectedEnd}/></pre>
  </div>}
 </section>;
}
