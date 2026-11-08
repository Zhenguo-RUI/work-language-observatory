import type {Bi} from "./observatory-types";
import type {PublicStudy} from "./public-study-types";
import {fillStats} from "./research-stats";

export const researchPlan = {
 date:"2026-11-08",commit:"7db06ee",
 url:"https://github.com/Zhenguo-RUI/work-language-observatory/blob/7db06ee/research/preregistration.md",
};
export const researchFraming = {
 title:{zh:"能力词旁边，写着什么工作？",en:"What work surrounds a competence word?"},
 lead:{zh:"从招聘广告中的合作对象、结果要求和决定权，检查这些词究竟在要求什么。",en:"Read named collaborators, expected results and decision rights alongside the words used to select people."},
 scope:{zh:"{{stat:corpus.n|int}}份历史广告 · 探索性研究 · 当前公开词面结果",en:"{{stat:corpus.n|int}} historical ads · Exploratory research · Lexical results available"},
 question:{zh:"招聘要求个人独立、抗压、沟通时，同一项工作写出了哪些合作对象、结果要求和可以决定的事项？",en:"When an ad asks for independence, pressure tolerance or communication, which collaborators, expected results and decision rights does it name for that work?"},
 rationale:{zh:"Deming与Kahn（2018）把招聘中的技能词作为需求信号来测量。Urciuoli（2008）关注技能语言怎样把工作关系写成个人品质。本研究把词放回职责条目，检查这些要求与具体工作怎样相连。",en:"Deming and Kahn (2018) measure skill words in job postings as demand signals. Urciuoli (2008) examines how skill language describes work relations as personal qualities. This study reads the words alongside the duties to examine what work they describe."},
 hypothesisNote:{zh:"以下假设在看过既有数据后提出，已在本轮抽样和新人工编码前写定。它们尚未检验，不能称为看到数据前的预注册。",en:"These hypotheses were proposed after examining existing data and fixed before this round of sampling and new human coding. They remain untested and were not preregistered before seeing the data."},
 abstract:{zh:"本研究探索招聘广告如何把能力词与合作对象、结果要求和决定权连在一起。当前公开词面计数与同现比较；人工核对、语义编码和模型验证仍待完成。",en:"This exploratory study examines how job advertisements connect competence words with collaborators, expected outcomes and decision rights. It uses {{stat:corpus.n|int}} historical advertisements from secondary archives. The current results describe lexical co-occurrence: ads containing a pressure-tolerance term more often also mention coordination, and ads mentioning data more often also mention communication. These comparisons concern the wording of the archive. They do not identify employers’ intentions, working conditions or platform effects. An analysis plan now specifies human checks of retrieval, occupation mapping and semantic coding before model-assisted estimation. Human review remains pending, so the earlier model-coded independence pilot is excluded from the findings presented here. The report separates available counts, untested hypotheses and unfinished validation, and retains the code and aggregate evidence needed to check each stage."},
 data:{zh:"51job {{stat:corpus.sources.51job|int}}份；BOSS {{stat:corpus.sources.boss|int}}份；猎聘 {{stat:corpus.sources.liepin|int}}份。均为二手历史归档，正文已去重。51job缺雇主和城市；BOSS与猎聘缺发布日期。",en:"The archive contains {{stat:corpus.sources.51job|int}} 51job ads, {{stat:corpus.sources.boss|int}} BOSS ads and {{stat:corpus.sources.liepin|int}} Liepin ads. These are secondary historical records with deduplicated text. The 51job subset lacks employer and city fields; BOSS and Liepin lack posting dates."},
 units:{zh:"词面计数以广告为单位，每广告每词计一次。深度编码以词在分句中的一次用法为单位。跨职业分布以词条比较，尚未完成职业核对。",en:"Lexical counts use advertisements, counted once per word. Semantic coding uses a word’s occurrence within a clause. Occupational dispersion compares terms and awaits validated occupation mapping."},
 pipelineNote:{zh:"按Nelson（2020）的模式识别、细读与确认流程推进。Grimmer与Stewart（2013）要求自动文本测量经过针对性验证；当前尚无新人工验证结果。",en:"The workflow follows Nelson’s (2020) sequence of pattern detection, close reading and confirmation. Grimmer and Stewart (2013) require validation specific to the text measure; new human validation is still pending."},
 discussion:{zh:"当前最清楚的关系出现在抗压与协调之间。它让研究从一个人的承受能力，转向广告同时写出的合作要求。Urciuoli（2008）关于技能语言的研究提示我们检查这种写法，但词面相伴还没有回答合作对象是谁、承担什么任务。数据与沟通的对照则让我们继续追问，数字需要向谁解释、用来回答什么问题。下一步要由人工阅读具体条目，区分个人能力、工作内容和组织承诺，再检查结果责任与决定权是否指向同一件事。求职者现在可以沿着这些区别，询问能得到明确答复的工作安排。",en:"The clearest current association links pressure tolerance with coordination. It directs attention from an individual’s ability to cope to the cooperation requirements written alongside it. Urciuoli’s (2008) work motivates examining this wording, but co-occurrence does not identify the collaborators or their tasks. The data–communication comparison also prompts questions about who needs the numbers explained and which decisions they inform. Human reading must next distinguish personal requirements, duties and organizational promises, then check whether outcome responsibility and decision rights concern the same task. Applicants can already use those distinctions to ask specific questions about how the work is arranged."},
 reproducibility:{zh:"本页数字来自聚合统计键；词面计数、规则版本和输入哈希可复核。原文与逐条抽查表仅留本机。人工核对尚未完成，编码手册仍在开发；新模型提示词、模型版本与调用记录尚未产生。既有模型试验留作历史记录，不进入本页验证结果。",en:"Numbers are resolved from aggregate statistic keys. Lexical counts, rule versions and input hashes are available for checking. Raw text and item-level review sheets remain local. Human review is unfinished and the codebook is in development; this new coding round has no frozen model prompt, model version or call record. The earlier model pilot remains an archive, not validation evidence on this page."},
 authorship:{zh:"Rui Zhenguo提出研究问题并确认设计。Codex协助编写脚本、组织聚合数据和起草双语文字。人工标注与释义审核尚未完成；本页没有把模型或工具填写记为人的判断。",en:"Rui Zhenguo proposed the research question and approved the design. Codex assisted with scripts, aggregate data preparation and bilingual drafts. Human annotation and paraphrase review are unfinished; model or tool output is not recorded as human judgment."},
};
export const researchHypotheses:{id:string;text:Bi}[] = [
 {id:"H1",text:{zh:"抗压、沟通、责任心分别检验：劳动者要求或工作内容的出现处中，超过{{stat:design.h1.threshold|pct}}在焦点条目及相邻前后各一条点名可辨识角色或部门。",en:"For pressure tolerance, communication and responsibility separately: more than {{stat:design.h1.threshold|pct}} of worker-directed or duty-related occurrences name an identifiable role or department in the focal item or its adjacent items."}},
 {id:"H2",text:{zh:"独立、主动、闭环分别检验：在劳动者用法中，同一工作事项的结果责任表述多于明确决定权的表述。",en:"For independence, initiative and closing the loop separately: worker-directed uses state outcome responsibility more often than explicit decision rights for the same task."}},
 {id:"H3",text:{zh:"比较H2差值在个人任务组和明确人员管理组的差异，并在样本充分的相同职能大类内比较。兼有两者和无法判断单列，不强归组。",en:"Compare the H2 difference between individual-task and explicit people-management groups, including within adequately represented occupational functions. Mixed and unclear roles remain separate."}},
];
export const researchPipeline:{label:Bi;status:Bi;detail:Bi;complete:boolean}[] = [
 {label:{zh:"词表计数",en:"Lexical counts"},status:{zh:"已完成",en:"Available"},detail:{zh:"保存词面命中与排除候选，未自动判成人的要求。",en:"Literal hits and exclusion candidates are retained without assigning human-directed meanings."},complete:true},
 {label:{zh:"抽样核对",en:"Retrieval review"},status:{zh:"待人工",en:"Human review pending"},detail:{zh:"已备{{stat:review.sample_pairs|int}}份广告与词条配对抽查，人工栏未填。",en:"{{stat:review.sample_pairs|int}} advertisement–term pairs are ready; human fields are blank."},complete:false},
 {label:{zh:"独立编码",en:"Independent coding"},status:{zh:"待开展",en:"Not started"},detail:{zh:"核对职业，修订手册，再独立编码与裁定。",en:"Check occupations, develop the codebook, then code independently and adjudicate."},complete:false},
 {label:{zh:"模型对照",en:"Model validation"},status:{zh:"待验证",en:"Pending"},detail:{zh:"与人的裁定结果比较，保留主要错分。",en:"Compare against adjudicated human labels and report the main errors."},complete:false},
 {label:{zh:"DSL估计",en:"DSL estimation"},status:{zh:"待验证后进行",en:"After validation"},detail:{zh:"按Egami等（2023）的方法，用随机人工标签校正模型标签。",en:"Use random human labels to correct model-based estimates, following Egami et al. (2023)."},complete:false},
 {label:{zh:"稳健性",en:"Sensitivity checks"},status:{zh:"部分完成",en:"Partly available"},detail:{zh:"已做来源与长度粗分组；模板和职业比较未完成。",en:"Source-by-length checks are available; template and occupation checks remain unfinished."},complete:false},
];
export const researchObservations = [
 {id:"pressure-coordination",term:"抗压",title:{zh:"写抗压的广告，更常同时写协调",en:"Ads mentioning pressure tolerance more often mention coordination"},
 numbers:{zh:"{{stat:assoc.抗压_协调.pressure_coordination_n|int}} / {{stat:assoc.抗压_协调.pressure_n|int}}份，对照为{{stat:assoc.抗压_协调.other_coordination_n|int}} / {{stat:assoc.抗压_协调.other_n|int}}份。未调整比值比{{stat:assoc.抗压_协调.or|or}}。",en:"{{stat:assoc.抗压_协调.pressure_coordination_n|int}} / {{stat:assoc.抗压_协调.pressure_n|int}} ads, versus {{stat:assoc.抗压_协调.other_coordination_n|int}} / {{stat:assoc.抗压_协调.other_n|int}}. Unadjusted odds ratio: {{stat:assoc.抗压_协调.or|or}}."},
 interpretation:{zh:"这些词面结果把抗压与合作要求放到同一份文本里，提供了逐条检查合作对象的入口；尚未检验H1中的具体对象，也未调整职业构成。",en:"The co-occurrence identifies texts in which pressure tolerance accompanies cooperation language. Identifiable collaborators under H1 have not yet been coded, and occupational composition has not been adjusted."},
 rows:[{label:{zh:"含抗压",en:"Pressure term present"},rateKey:"assoc.抗压_协调.pressure_rate",countKey:"assoc.抗压_协调.pressure_coordination_n",denominatorKey:"assoc.抗压_协调.pressure_n"},{label:{zh:"不含抗压",en:"Pressure term absent"},rateKey:"assoc.抗压_协调.other_rate",countKey:"assoc.抗压_协调.other_coordination_n",denominatorKey:"assoc.抗压_协调.other_n"}],
 chartLabel:{zh:"同时含协调的广告比例",en:"Share also mentioning coordination"}},
 {id:"data-communication",term:"数据",title:{zh:"写数据的广告，也更常写沟通",en:"Ads mentioning data also mention communication more often"},
 numbers:{zh:"{{stat:assoc.数据_沟通.both_n|int}} / {{stat:assoc.数据_沟通.focus_n|int}}份，对照为{{stat:assoc.数据_沟通.other_both_n|int}} / {{stat:assoc.数据_沟通.other_n|int}}份。未调整比值比{{stat:assoc.数据_沟通.or|or}}。",en:"{{stat:assoc.数据_沟通.both_n|int}} / {{stat:assoc.数据_沟通.focus_n|int}} ads, versus {{stat:assoc.数据_沟通.other_both_n|int}} / {{stat:assoc.数据_沟通.other_n|int}}. Unadjusted odds ratio: {{stat:assoc.数据_沟通.or|or}}."},
 interpretation:{zh:"这些广告值得继续读：数据算给谁看，又要解释什么问题？同现还没有证明沟通与数据属于同一项任务。",en:"These ads invite a closer reading: who receives the numbers, and what must be explained? Co-occurrence does not establish that communication and data concern the same task."},
 rows:[{label:{zh:"含数据",en:"Data term present"},rateKey:"assoc.数据_沟通.focus_rate",countKey:"assoc.数据_沟通.both_n",denominatorKey:"assoc.数据_沟通.focus_n"},{label:{zh:"不含数据",en:"Data term absent"},rateKey:"assoc.数据_沟通.other_rate",countKey:"assoc.数据_沟通.other_both_n",denominatorKey:"assoc.数据_沟通.other_n"}],
 chartLabel:{zh:"同时含沟通的广告比例",en:"Share also mentioning communication"}},
];
export const researchAlternativeReadings = [
 {question:{zh:"文本长度",en:"Text length"},answer:{zh:"已按来源及各来源的长度中位数分组，抗压与协调的同现方向在各组一致。这是粗分层核对，未完成调整职业和角色的关联模型。",en:"Within-source median-length groups retain the same direction for pressure–coordination co-occurrence. This is a coarse stratified check; an association model adjusting for occupation and role is unfinished."}},
 {question:{zh:"复制的模板",en:"Repeated templates"},answer:{zh:"未检验模板对结果的影响。后续须标记重复条款，并在去掉候选模板后重新比较。",en:"Template influence has not been tested. Repeated clauses must be identified before comparing results with candidate templates removed."}},
 {question:{zh:"职业构成",en:"Occupational composition"},answer:{zh:"职业映射尚未经过人工核对。当前不能说同一种职业内部仍有相同差异。",en:"Occupation mapping lacks human validation. The current results do not establish the same difference within an occupation."}},
 {question:{zh:"来源与平台",en:"Archives and platforms"},answer:{zh:"来源同时包含采集时期、选样和雇主覆盖差别。现有数据不能把这些因素拆成独立的平台效应。",en:"Archive sources also differ in collection period, selection and employer coverage. These factors cannot be separated into independent platform effects here."}},
];
export const researchQuestions:Bi[] = [
 {zh:"跨部门进度耽误时，原定目标由谁调整？",en:"When another department is delayed, who adjusts the original target?"},
 {zh:"这份分析给谁看，对方会据此决定什么？",en:"Who reads this analysis, and what decision will they make from it?"},
 {zh:"我可以自己修改哪些标准，哪些修改必须报批？",en:"Which standards may I change, and which changes require approval?"},
];
export const researchLimitations:Bi[] = [
 {zh:"历史二手归档与非概率选样限制了两项词面结果的外推，不能估计当前市场份额。",en:"Historical secondary records and non-probability selection limit generalization of both lexical comparisons; they do not estimate current market shares."},
 {zh:"词面命中尚未全部经过人工核对，可能包含设施、系统等用法，影响两项关联的含义。",en:"Lexical hits have not all been reviewed by humans and may refer to facilities or systems, affecting the interpretation of both associations."},
 {zh:"职业构成与模板影响未完成检验，抗压与协调的关系仍可能受这些因素影响。",en:"Occupation and template checks are unfinished; either may affect the pressure–coordination association."},
 {zh:"H1–H3所需的人评、模型验证和DSL估计尚未完成。旧模型试验不充当人工验证结果。",en:"Human coding, model validation and DSL estimates for H1–H3 are unfinished. The earlier model pilot is not human validation."},
 {zh:"广告没有记录实际工时、压力或支持兑现情况，两项词面关联都不能判断实际待遇。",en:"Ads do not record actual hours, experienced pressure or delivery of support; lexical associations cannot establish actual conditions."},
];
export const researchMethodReferences = [
 {author:"David Deming & Lisa B. Kahn",title:"Skill Requirements across Firms and Labor Markets: Evidence from Job Postings for Professionals (2018)",url:"https://doi.org/10.1086/694106"},
 {author:"Bonnie Urciuoli",title:"Skills and Selves in the New Workplace (2008)",url:"https://doi.org/10.1111/j.1548-1425.2008.00031.x"},
 {author:"Laura K. Nelson",title:"Computational Grounded Theory: A Methodological Framework (2020)",url:"https://doi.org/10.1177/0049124117729703"},
 {author:"Justin Grimmer & Brandon M. Stewart",title:"Text as Data: The Promise and Pitfalls of Automatic Content Analysis Methods for Political Texts (2013)",url:"https://doi.org/10.1093/pan/mps028"},
 {author:"Naoki Egami, Musashi Hinck, Brandon M. Stewart & Hanying Wei",title:"Using Imperfect Surrogates for Downstream Inference: Design-based Supervised Learning for Social Science Applications of Large Language Models (2023)",url:"https://proceedings.neurips.cc/paper_files/paper/2023/hash/d862f7f5445255090de13b825b880d59-Abstract.html"},
];
export function researchMarkdown(_data:PublicStudy,lang:"zh"|"en"){
 const b=(x:Bi)=>fillStats(x[lang],lang),t=(zh:string,en:string)=>lang==="zh"?zh:en;
 const lines=[`# ${b(researchFraming.title)}`,"",b(researchFraming.lead),"",b(researchFraming.scope),""];
 if(lang==="en")lines.push(researchFraming.abstract.en,"");
 lines.push(`## ${t("问题","Question")}`,b(researchFraming.question),b(researchFraming.rationale),"",`## ${t("探索性假设 · 待检验","Exploratory hypotheses · Untested")}`,b(researchFraming.hypothesisNote),`[${researchPlan.date} · ${researchPlan.commit}](${researchPlan.url})`);
 for(const h of researchHypotheses)lines.push(`- **${h.id}** ${b(h.text)}`);
 lines.push("",`## ${t("数据","Data")}`,b(researchFraming.data),b(researchFraming.units),"",`## ${t("怎么测 · 完成到哪一步","Measurement and progress")}`,b(researchFraming.pipelineNote));
 for(const p of researchPipeline)lines.push(`- **${b(p.label)} · ${b(p.status)}** — ${b(p.detail)}`);
 lines.push("",`## ${t("初步发现 · 词面比较","Preliminary lexical findings")}`);
 for(const o of researchObservations){lines.push(`### ${b(o.title)}`,b(o.numbers),b(o.chartLabel),"",`| ${t("广告组","Ad group")} | ${t("命中 / 广告数","Hits / ads")} | ${t("比例","Share")} |`,`| --- | --- | --- |`);for(const row of o.rows)lines.push(`| ${b(row.label)} | ${fillStats(`{{stat:${row.countKey}|int}} / {{stat:${row.denominatorKey}|int}}`,lang)} | ${fillStats(`{{stat:${row.rateKey}|pct}}`,lang)} |`);lines.push("",b(o.interpretation),"");}
 lines.push(`## ${t("不同读法","Alternative readings")}`);for(const r of researchAlternativeReadings)lines.push(`### ${b(r.question)}`,b(r.answer));
 lines.push("",`## ${t("讨论","Discussion")}`,b(researchFraming.discussion));for(const q of researchQuestions)lines.push(`- ${b(q)}`);
 lines.push("",`## ${t("局限","Limitations")}`);for(const l of researchLimitations)lines.push(`- ${b(l)}`);
 lines.push("",`## ${t("复现材料","Reproducibility")}`,b(researchFraming.reproducibility),`[${t("脚本、规则与记录","Scripts, rules and logs")}](https://github.com/Zhenguo-RUI/work-language-observatory/tree/main/research) · [${t("聚合统计","Aggregate statistics")}](/research/stats.json)`,"",`## ${t("作者与分工","Authorship")}`,b(researchFraming.authorship),"",`## ${t("参考文献","References")}`);for(const r of researchMethodReferences)lines.push(`- ${r.author}. [${r.title}](${r.url})`);
 return fillStats(lines.join("\n"),lang);
}
