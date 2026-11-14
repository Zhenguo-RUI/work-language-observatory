import metadata from "@/data/publication-metadata.json";
import type {Bi} from "./observatory-types";
export const researchPublicationMetadata=metadata;
export const researchPublicationCopy={
 unfinished:{zh:"逐条人工核对和语义比例估计尚未完成。",en:"Human checks of individual examples and estimates of meaning frequencies are unfinished."},
 license:{zh:"两套二手归档的第三方招聘文本许可范围尚无法确认。原文只保存在本机；公开的是聚合统计、脚本和去识别释义。来源项目的代码许可不能替代招聘正文的许可。",en:"The scope of permission for third-party advertisements in the secondary archives remains unconfirmed. Raw text stays on the local machine. Public materials comprise aggregate statistics, scripts and deidentified paraphrases. A source project's code licence does not license the advertisement text."},
 methodRecord:{zh:"研究问题、分析范围与产品由 Rui Zhenguo 设计；网站和分析脚本使用 AI 编程工具实现。规则编码、模型初码和案例释义分别留有记录；模型复核不计作人工审核。",en:"Rui Zhenguo designed the research questions, scope and product. AI coding tools were used to build the website and analysis scripts. Rule-based coding, model codes and paraphrased examples have separate records; model review is not counted as human review."},
 versionNote:{zh:"语料版本、词表补充版本和更新日期来自已保存的运行记录。自驱为计划后补充，不进入原有假设。",en:"Corpus and supplementary vocabulary versions and the update date come from saved run records. Self-direction is a post-plan addition and does not enter the original hypotheses."},
} satisfies Record<string,Bi>;
export function researchCitation(lang:"zh"|"en"){
 const title=lang==="zh"?"工作语言观察站：研究观察":"Work Language Observatory: Research Notes";
 return `${metadata.author}. (${metadata.updatedAt.slice(0,4)}). ${title}. ${metadata.corpusVersion}; ${metadata.vocabularyVersion}. ${metadata.updatedAt}. ${metadata.url}`;
}
