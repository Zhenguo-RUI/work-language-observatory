import {displayTerm} from "./localization";
import {sociologyReference} from "./sociology-references";
import type {Analysis} from "./observatory-types";

export type ReadingBlock={kind:"title"|"heading"|"subheading"|"body"|"quote"|"meta";text:string};

/** Shared content keeps PDF and Markdown exports faithful to the reading on screen. */
export function readingBlocks(a:Analysis,lang:"zh"|"en"):ReadingBlock[]{
 const r=a.result,t=(zh:string,en:string)=>lang==="zh"?zh:en,translation=r.sourceTranslation;
 const blocks:ReadingBlock[]=[],attachedTerms=new Set<number>();
 const add=(kind:ReadingBlock["kind"],text:string|undefined)=>{if(text?.trim())blocks.push({kind,text:text.trim()});};
 add("title",lang==="en"&&translation?translation.titleEn:a.title);
 if(lang==="en")add("meta",`${translation?"Original job title":"Original job title (full translation not yet generated)"}: ${a.title}`);
 add("subheading",r.headline[lang]);add("body",r.role[lang]);
 if(r.competenceWords?.length){add("heading",t("这份 JD 里的能力词","Competence words in this JD"));for(const word of r.competenceWords){add("subheading",word.term);add("quote",word.quote);add("body",word.meaning[lang]);for(const q of word.evidenceQuotes)add("quote",q);add("body",word.question[lang]);}}
 if(a.company!==undefined&&!a.company.trim())add("body",t("未填写公司，本次只依据 JD 原文","No company was entered; this reading uses the JD only."));
 if((a.company===undefined||a.company.trim())&&r.context){
  const c=r.context;
  add("heading",t("公司与行业语境","Company and industry context"));
  add("subheading",c.company.name[lang]);add("body",c.company.description[lang]);
  add("subheading",c.industry.name[lang]);add("body",c.industry.description[lang]);
  add("body",c.implication[lang]);add("meta",c.notice[lang]);
  if(c.lookup)add("meta",`${t("公司检索词","Company search query")}: ${c.lookup.query} · ${c.lookup.provider} · ${c.lookup.status} · ${c.lookup.searchedAt}`);
  for(const s of c.sources){const kind=s.kind==="search"?t("搜索结果摘要","Search excerpt"):s.kind==="encyclopedia"?t("百科资料","Encyclopedia"):t("官网资料","Official reference");add("meta",`${kind} · ${s.title}\n${s.url}\n${t("查阅","Retrieved")}: ${s.retrievedAt}`);}
  for(const anchor of c.companyEvidence||[])add("quote",`${anchor.quote} — ${c.sources.find(s=>s.id===anchor.sourceId)?.title||anchor.sourceId}`);
 }
 if(r.depth){
  const d=r.depth;
  if(d.deliverables.length){add("heading",t("逐条拆解工作职责","The work, step by step"));
   for(const [index,x] of d.deliverables.entries()){
    add("subheading",`${index+1}. ${x.task[lang]}`);add("quote",x.quote);
    add("meta",t("以下做法、示例与交付供准备时参考。","The approaches, examples and outputs below are suggestions for preparation."));
    if(x.object)add("body",`${t("对象","Object")}: ${x.object[lang]}`);
    if(x.action)add("body",`${t("具体做什么","What you do")}: ${x.action[lang]}`);
    if(x.purpose)add("body",`${t("为什么要做","Why it matters")}: ${x.purpose[lang]}`);
    if(x.scenario)add("body",`${t("举个例子","An example")}: ${x.scenario.text[lang]}`);
    add("body",`${t("最后交什么","What you hand over")}: ${x.output[lang]}`);
    add("body",`${t("做到什么算好","What good work looks like")}: ${x.check[lang]}`);
    for(const [termIndex,term] of r.terms.entries())if(term.quote===x.quote||x.quote.includes(term.quote)||term.quote.includes(x.quote)){
     attachedTerms.add(termIndex);add("subheading",`${t("这项里的行业用语","Industry terms in this task")} · ${displayTerm(term.term,lang)}`);
     add("body",term.meaning[lang]);add("body",term.alternative[lang]);add("body",term.question[lang]);
    }
   }
  }
  if(d.preparation){
   add("heading",t("能力与准备","Skills and preparation"));
   const labels={required:t("明确要求","Required"),preferred:t("优先考虑","Preferred"),suggested:t("准备建议","Suggested"),clarify:t("待确认","Clarify")};
   for(const item of d.preparation.competencies){add("subheading",`${labels[item.level]} · ${item.skill[lang]}`);add("body",item.application[lang]);if(item.quote)add("quote",item.quote);}
   if(d.preparation.materials.length){add("subheading",t("可以准备的材料（建议）","Materials you could prepare (suggested)"));for(const item of d.preparation.materials)add("body",item[lang]);}
   if(d.preparation.practice.length){add("subheading",t("面试练习","Interview practice"));for(const item of d.preparation.practice){add("body",item.question[lang]);add("body",item.approach[lang]);}}
  }
  add("heading",t("工具、协作与决定权","Tools, collaboration and decisions"));
  for(const key of ["object","tools","partners","authority"] as const){
   const label={object:t("工作对象","Work object"),tools:t("工具","Tools"),partners:t("协作对象","Participants"),authority:t("权限","Authority")}[key];
   add("body",`${label}: ${d.workMap[key][lang]}`);
  }
  if(d.example){add("heading",t("虚构案例（非实测）","Fictional example — not measured"));add("body",d.example.scenario[lang]);d.example.steps.forEach((s,i)=>add("body",`${i+1}. ${s[lang]}`));add("body",d.example.lesson[lang]);}
 }
 for(const [index,x] of r.terms.entries()){
  if(attachedTerms.has(index))continue;
  add("heading",displayTerm(x.term,lang));if(lang==="en")add("meta",`Original term: ${x.term}`);
  add("body",x.meaning[lang]);add("quote",x.quote);
  add("body",x.alternative[lang]);add("body",x.question[lang]);
 }
 if(r.sociology[lang].trim()){
 add("heading",t(a.engine==="rules"?"规则辅助观察":"社会学分析",a.engine==="rules"?"Rule-assisted observations":"Sociological reading"));
 if(r.depth?.sociologySummary)add("subheading",r.depth.sociologySummary[lang]);
 add("body",r.sociology[lang]);for(const q of r.depth?.sociologyQuotes||[])add("quote",q);
 const concept=sociologyReference(r.depth?.sociologyConceptId);if(concept)add("meta",`${concept.concept[lang]} · ${concept.citation}\n${concept.url}`);
 }
 if(r.questions.length){
  add("heading",t("最值得确认","Useful follow-ups"));
  r.questions.forEach((q,index)=>{
   add("subheading",`${index+1}. ${q[lang]}`);
   const tests=(r.depth?.questionTests||[]).filter(test=>test.questionIndex===index);
   for(const test of tests){
    add("body",`${t("可能回答 A","Possible answer A")}: ${test.answerA[lang]}`);
    add("body",`${t("可能回答 B","Possible answer B")}: ${test.answerB[lang]}`);
    add("body",`${t("这会怎样改变判断","How this changes the reading")}: ${test.difference[lang]}`);add("quote",test.quote);
   }
  });
 }
 if(r.conditions.length){add("heading",t("工作条件","Advertised conditions"));for(const c of r.conditions){add("body",c[lang]);if(lang==="en"&&c.zh!==c.en)add("quote",`Original condition: ${c.zh}`);}}
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
