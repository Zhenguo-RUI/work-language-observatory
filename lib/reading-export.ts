import {displayTerm} from "./localization";
import type {Analysis} from "./observatory-types";
export function readingMarkdown(a:Analysis,lang:"zh"|"en"){
 const r=a.result,t=(zh:string,en:string)=>lang==="zh"?zh:en;
 const translation=r.sourceTranslation;
 const parts=[`# ${lang==="en"&&translation?translation.titleEn:a.title}`,lang==="en"&&translation?`Original job title: ${a.title}`:t("", "Original job title; full translation has not been generated."),r.headline[lang],r.role[lang],...r.terms.map(x=>`## ${displayTerm(x.term,lang)}\n\n${lang==="en"?`Original term: ${x.term}\n\n`:""}${x.meaning[lang]}\n\n> ${x.quote}\n\n${t("另一种读法","Alternative")}: ${x.alternative[lang]}\n\n${x.question[lang]}`)];
 if(translation){parts.splice(2,0,`## ${t("JD全文英文译文","Full English job description")}`,translation.paragraphs.map(p=>p.en).join("\n\n"),`## ${t("JD完整原文","Complete original JD")}`,a.raw_text,`---`);}
 parts.push(`## ${t(a.engine==="rules"?"规则辅助观察":"社会学分析",a.engine==="rules"?"Rule-assisted observations":"Sociological reading")}\n\n${r.sociology[lang]}`,...(r.depth?.sociologyQuotes||[]).map(q=>`> ${q}`));
 if(r.questions.length){
  parts.push(`## ${t("最值得确认","Useful follow-ups")}`);
  r.questions.forEach((question,questionIndex)=>{
   parts.push(`### ${questionIndex+1}. ${question[lang]}`);
   const tests=(r.depth?.questionTests||[]).filter(test=>test.questionIndex===questionIndex);
   if(tests.length)parts.push(t("以下是两种可能的回答，用来说明判断如何变化；并非招聘方已经答复，也不是访谈记录。","These are two possible answers illustrating how the reading could change. They are not employer replies or interview evidence."));
   tests.forEach(test=>parts.push(`**${t("可能回答 A","Possible answer A")}**: ${test.answerA[lang]}`,`**${t("可能回答 B","Possible answer B")}**: ${test.answerB[lang]}`,`**${t("这会怎样改变判断","How this changes the reading")}**: ${test.difference[lang]}`,`**${t("原文依据","Source anchor")}**\n\n> ${test.quote.replace(/\n/g,"\n> ")}`));
  });
 }
 if(r.conditions.length)parts.push(`## ${t("工作条件","Advertised conditions")}\n\n${r.conditions.map(x=>lang==="en"?`${x.en}\n\n> Original condition: ${x.zh}`:x.zh).join("\n\n")}`);
 if(r.depth){const d=r.depth;parts.push(`## ${t("工作关系","Work relations")}`,...Object.entries(d.workMap).filter(([key])=>key!=="quotes").map(([key,value])=>`**${({object:t("工作对象","Work object"),tools:t("工具","Tools"),partners:t("协作对象","Participants"),authority:t("权限","Authority")} as Record<string,string>)[key]}**: ${(value as {zh:string;en:string})[lang]}`),`## ${t("建议交付与验证","Proposed outputs and checks")}`,t("以下为分析建议，不是招聘方公布的验收清单。","These are analytical proposals, not the employer’s acceptance checklist."),...d.deliverables.map(x=>`### ${x.output[lang]}\n\n${x.task[lang]}\n\n${t("怎样验证","How to check")}: ${x.check[lang]}\n\n> ${x.quote}`));if(d.example)parts.push(`## ${t("虚构案例（非实测）","Fictional example — not measured")}`,d.example.scenario[lang],...d.example.steps.map((s,i)=>`${i+1}. ${s[lang]}`),d.example.lesson[lang]);}
 parts.push(`## ${t("解释范围","Scope")}\n\n${r.gaps.map(x=>x[lang]).join("\n\n")}`,`---\n${a.engine} · ${r.depth?.protocol||"legacy"} · v${a.revision} · ${a.updated_at}\n${a.source_url}`);
 return parts.join("\n\n");
}
