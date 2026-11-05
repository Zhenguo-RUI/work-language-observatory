import {displayTerm} from "./localization";
import type {Analysis} from "./observatory-types";

export type ReadingBlock={kind:"title"|"heading"|"subheading"|"body"|"quote"|"meta";text:string};

/** Shared content keeps PDF and Markdown exports faithful to the reading on screen. */
export function readingBlocks(a:Analysis,lang:"zh"|"en"):ReadingBlock[]{
 const r=a.result,t=(zh:string,en:string)=>lang==="zh"?zh:en,translation=r.sourceTranslation;
 const blocks:ReadingBlock[]=[];
 const add=(kind:ReadingBlock["kind"],text:string|undefined)=>{if(text?.trim())blocks.push({kind,text:text.trim()});};
 add("title",lang==="en"&&translation?translation.titleEn:a.title);
 if(lang==="en")add("meta",`${translation?"Original job title":"Original job title (full translation not yet generated)"}: ${a.title}`);
 add("subheading",r.headline[lang]);add("body",r.role[lang]);
 if(r.context){
  const c=r.context;
  add("heading",t("公司与行业语境","Company and industry context"));
  add("subheading",c.company.name[lang]);add("body",c.company.description[lang]);
  add("subheading",c.industry.name[lang]);add("body",c.industry.description[lang]);
  add("body",c.implication[lang]);add("meta",c.notice[lang]);
  for(const s of c.sources)add("meta",`${s.title}\n${s.url}\n${t("查阅","Retrieved")}: ${s.retrievedAt}`);
 }
 for(const x of r.terms){
  add("heading",displayTerm(x.term,lang));if(lang==="en")add("meta",`Original term: ${x.term}`);
  add("body",x.meaning[lang]);add("quote",x.quote);
  add("body",x.alternative[lang]);add("body",x.question[lang]);
 }
 add("heading",t(a.engine==="rules"?"规则辅助观察":"社会学分析",a.engine==="rules"?"Rule-assisted observations":"Sociological reading"));
 add("body",r.sociology[lang]);for(const q of r.depth?.sociologyQuotes||[])add("quote",q);
 if(r.questions.length){
  add("heading",t("最值得确认","Useful follow-ups"));
  r.questions.forEach((q,index)=>{
   add("subheading",`${index+1}. ${q[lang]}`);
   const tests=(r.depth?.questionTests||[]).filter(test=>test.questionIndex===index);
   if(tests.length)add("meta",t("以下为可能回答，用来说明判断如何变化；并非招聘方已经答复，也不是访谈记录。","The possible answers below illustrate how the reading could change. They are not employer replies or interview evidence."));
   for(const test of tests){
    add("body",`${t("可能回答 A","Possible answer A")}: ${test.answerA[lang]}`);
    add("body",`${t("可能回答 B","Possible answer B")}: ${test.answerB[lang]}`);
    add("body",`${t("这会怎样改变判断","How this changes the reading")}: ${test.difference[lang]}`);add("quote",test.quote);
   }
  });
 }
 if(r.conditions.length){add("heading",t("工作条件","Advertised conditions"));for(const c of r.conditions){add("body",c[lang]);if(lang==="en"&&c.zh!==c.en)add("quote",`Original condition: ${c.zh}`);}}
 if(r.depth){
  const d=r.depth;add("heading",t("工作关系","Work relations"));
  for(const key of ["object","tools","partners","authority"] as const){
   const label={object:t("工作对象","Work object"),tools:t("工具","Tools"),partners:t("协作对象","Participants"),authority:t("权限","Authority")}[key];
   add("body",`${label}: ${d.workMap[key][lang]}`);
  }
  if(d.deliverables.length){add("heading",t("建议交付与验证","Proposed outputs and checks"));add("meta",t("以下为分析建议，不是招聘方公布的验收清单。","These are analytical proposals, not the employer’s acceptance checklist."));
   for(const x of d.deliverables){add("subheading",x.output[lang]);add("body",x.task[lang]);add("body",`${t("怎样验证","How to check")}: ${x.check[lang]}`);add("quote",x.quote);}
  }
  if(d.example){add("heading",t("虚构案例（非实测）","Fictional example — not measured"));add("body",d.example.scenario[lang]);d.example.steps.forEach((s,i)=>add("body",`${i+1}. ${s[lang]}`));add("body",d.example.lesson[lang]);}
 }
 if(r.comparisons.length){add("heading",t("放在相近岗位旁边看","Read beside another role"));for(const c of r.comparisons){add("subheading",lang==="en"?(c.titleEn||c.title):c.title);add("body",c.reading[lang]);}}
 if(r.gaps.length){add("heading",t("解释范围","Scope"));for(const g of r.gaps)add("body",g[lang]);}
 if(translation){add("heading",t("附录：JD全文英文译文","Appendix: full English job description"));for(const p of translation.paragraphs)add("body",p.en);}
 add("heading",t("附录：JD完整原文","Appendix: complete original JD"));
 for(const p of a.raw_text.split(/\n\s*\n/u))add("body",p);
 add("meta",`${t("工作语言观察站","Work Language Observatory")} · ${a.engine} · ${r.depth?.protocol||"legacy"} · v${a.revision}\n${a.updated_at}`);
 if(a.source_url)add("meta",`${t("原始来源","Original source")}: ${a.source_url}`);
 return blocks;
}

export function readingMarkdown(a:Analysis,lang:"zh"|"en"){
 return readingBlocks(a,lang).map(b=>b.kind==="title"?`# ${b.text}`:b.kind==="heading"?`## ${b.text}`:b.kind==="subheading"?`### ${b.text}`:b.kind==="quote"?`> ${b.text.replace(/\n/g,"\n> ")}`:b.text).join("\n\n");
}
