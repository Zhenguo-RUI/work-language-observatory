"use client";
import type {Bi,DeepReading,QuestionTest} from "@/lib/observatory-types";
type Lang="zh"|"en";

export function QuestionsPanel({questions,tests,lang,onEvidence}:{questions:Bi[];tests?:QuestionTest[];lang:Lang;onEvidence:(quote:string)=>void}){
 const t=(zh:string,en:string)=>lang==="zh"?zh:en;
 if(!questions.length)return null;
 return <section className="question-card questions-panel">
  <h2>{t("最值得确认","Useful follow-ups")}</h2>
  {questions.map((question,questionIndex)=>{
   const questionTests=(tests||[]).filter(test=>test.questionIndex===questionIndex);
   return <article className="question-item" key={questionIndex}>
    <h3>{questionIndex+1}. {question[lang]}</h3>
    {!!questionTests.length&&<details className="question-tests">
     <summary>{t("哪些回答会改变判断","Which answers would change the reading?")}</summary>
     {questionTests.map((test,i)=><div className="question-test" key={i}>
      <dl className="question-answers">
       <div><dt>{t("可能回答 A","Possible answer A")}</dt><dd>{test.answerA[lang]}</dd></div>
       <div><dt>{t("可能回答 B","Possible answer B")}</dt><dd>{test.answerB[lang]}</dd></div>
      </dl>
      <p className="question-difference"><strong>{t("这会怎样改变判断","How this changes the reading")}</strong><br/>{test.difference[lang]}</p>
      <button className="evidence-button" onClick={()=>onEvidence(test.quote)}>{test.quote}</button>
     </div>)}
    </details>}
   </article>;
  })}
 </section>;
}

export function DeepReadingPanel({reading,lang,onEvidence}:{reading:DeepReading;lang:Lang;onEvidence:(quote:string)=>void}){
 const t=(zh:string,en:string)=>lang==="zh"?zh:en;
 return <section className="deep-reading">
  <details className="panel deep-section"><summary>{t("工作对象、工具与协作边界","Work object, tools and collaboration")}</summary><dl className="work-map">{([["object",t("工作对象","Object of work")],["tools",t("工作工具","Tools")],["partners",t("协作对象","Partners")],["authority",t("决定与批准","Decision and approval")]] as const).map(([key,label])=><div key={key}><dt>{label}</dt><dd>{reading.workMap[key][lang]}</dd></div>)}</dl><div className="deep-anchors">{reading.workMap.quotes.map((quote,i)=><button className="evidence-button" key={i} onClick={()=>onEvidence(quote)}>{quote}</button>)}</div></details>
  {!!reading.deliverables.length&&<details className="panel deep-section"><summary>{t("把要求变成可验收的交付","From requirements to inspectable outputs")}</summary><p className="small muted">{t("以下是根据原文提出的交付与验证建议，并非招聘方公布的验收清单。","These proposed outputs and checks interpret the source; they are not the employer’s published acceptance checklist.")}</p>{reading.deliverables.map((item,i)=><article className="proposed-output" key={i}><span className="micro-label">{t("建议交付","PROPOSED OUTPUT")} {String(i+1).padStart(2,"0")}</span><h3>{item.output[lang]}</h3><p>{item.task[lang]}</p><p className="output-check"><strong>{t("怎样验证","How to check")}</strong> · {item.check[lang]}</p><button className="text-button source-anchor" onClick={()=>onEvidence(item.quote)}>{t("查看依据","Inspect source")}</button></article>)}</details>}
  {reading.example&&<details className="panel deep-section"><summary>{t("展开一个虚构案例，看完整工作链","A fictional case showing the work chain")}</summary><p className="small muted">{t("仅用于解释职责，不是企业内部案例，也没有实测结果。","An illustration of the duties, not an employer case or measured result.")}</p><p>{reading.example.scenario[lang]}</p><ol className="diagnostic-steps">{reading.example.steps.map((step,i)=><li key={i}>{step[lang]}</li>)}</ol><p className="output-check">{reading.example.lesson[lang]}</p></details>}
 </section>;
}

function EditBi({label,value,onChange}:{label:string;value:Bi;onChange:(v:Bi)=>void}){return <div className="bi-field"><label>{label}</label><div className="bi-columns">{(["zh","en"] as const).map(l=><div key={l}><span>{l==="zh"?"Chinese / 中文":"English"}</span><textarea aria-label={`${label} · ${l}`} rows={3} value={value[l]} onChange={e=>onChange({...value,[l]:e.target.value})}/></div>)}</div></div>}
export function DeepReadingEditor({reading,onChange,lang,questions}:{reading:DeepReading;onChange:(v:DeepReading)=>void;lang:Lang;questions?:Bi[]}){
 const t=(zh:string,en:string)=>lang==="zh"?zh:en;
 return <details className="deep-editor"><summary>{t("工作链、交付与判断分支","Work chain, outputs and possible-answer branches")}</summary>
  {([["object",t("工作对象","Work object")],["tools",t("工具","Tools")],["partners",t("协作","Partners")],["authority",t("权限边界","Authority boundaries")]] as const).map(([key,label])=><EditBi key={key} label={label} value={reading.workMap[key]} onChange={v=>onChange({...reading,workMap:{...reading.workMap,[key]:v}})}/>)}
  {reading.workMap.quotes.map((quote,i)=><label key={i}>{t("工作关系原文锚点","Work-map source anchor")} {i+1}<textarea rows={2} value={quote} onChange={e=>{const quotes=[...reading.workMap.quotes];quotes[i]=e.target.value;onChange({...reading,workMap:{...reading.workMap,quotes}})}}/></label>)}
  {reading.deliverables.map((item,i)=><div className="edit-term" key={i}><h3>{t("建议交付","Proposed output")} {i+1}</h3>{(["task","output","check"] as const).map(key=><EditBi key={key} label={{task:t("任务解释","Task reading"),output:t("交付建议","Proposed output"),check:t("验证建议","Proposed check")}[key]} value={item[key]} onChange={v=>{const deliverables=[...reading.deliverables];deliverables[i]={...item,[key]:v};onChange({...reading,deliverables})}}/>)}<label>{t("原文锚点","Source anchor")}<textarea value={item.quote} onChange={e=>{const deliverables=[...reading.deliverables];deliverables[i]={...item,quote:e.target.value};onChange({...reading,deliverables})}}/></label></div>)}
  {reading.sociologyQuotes.map((quote,i)=><label key={i}>{t("社会学解释原文锚点","Sociological source anchor")} {i+1}<textarea rows={2} value={quote} onChange={e=>{const sociologyQuotes=[...reading.sociologyQuotes];sociologyQuotes[i]=e.target.value;onChange({...reading,sociologyQuotes})}}/></label>)}
  {(reading.questionTests||[]).map((test,i)=><section className="edit-term question-test-editor" key={i}>
   <h3>{t("关联问题","Linked question")} {test.questionIndex+1} · {t("判断分支","Possible answers")}</h3>
   {questions?.[test.questionIndex]&&<p>{questions[test.questionIndex][lang]}</p>}
   <p className="small muted">{t("以下内容是假设回答，并非招聘方已答复或实访材料。","These are hypothetical answers, not employer replies or interview evidence.")}</p>
   {(["answerA","answerB","difference"] as const).map(key=><EditBi key={key} label={{answerA:t("可能回答 A","Possible answer A"),answerB:t("可能回答 B","Possible answer B"),difference:t("这会怎样改变判断","How this changes the reading")}[key]} value={test[key]} onChange={value=>{const questionTests=[...(reading.questionTests||[])];questionTests[i]={...test,[key]:value};onChange({...reading,questionTests})}}/>)}
   <label>{t("原文依据（须逐字匹配）","Source anchor (must match verbatim)")}<textarea rows={2} value={test.quote} onChange={e=>{const questionTests=[...(reading.questionTests||[])];questionTests[i]={...test,quote:e.target.value};onChange({...reading,questionTests})}}/></label>
  </section>)}
  {reading.example&&<><EditBi label={t("虚构案例","Fictional case")} value={reading.example.scenario} onChange={v=>onChange({...reading,example:{...reading.example!,scenario:v}})}/>{reading.example.steps.map((step,i)=><EditBi key={i} label={`${t("诊断步骤","Diagnostic step")} ${i+1}`} value={step} onChange={v=>{const steps=[...reading.example!.steps];steps[i]=v;onChange({...reading,example:{...reading.example!,steps}})}}/>)}<EditBi label={t("案例启示","Case lesson")} value={reading.example.lesson} onChange={v=>onChange({...reading,example:{...reading.example!,lesson:v}})}/><button className="text-button" onClick={()=>onChange({...reading,example:null})}>{t("移除这个虚构案例","Remove fictional case")}</button></>}
 </details>;
}
