import type {Bi} from "./observatory-types";
import type {PublicStudy} from "./public-study-types";

type ObservationContext = {role:Bi; work:Bi; reading:Bi};
type ResearchObservation = {
 id:string; term:string; title:Bi; takeaway:Bi; numbers:Bi; counting:Bi;
 contexts:ObservationContext[]; counterexample:Bi; interpretation:Bi; question:Bi;
};

// Editorial readings of the existing public study and its 120-ad pilot.
// Counts retain their original units; examples are deidentified paraphrases.
export const researchObservations:ResearchObservation[] = [
 {
  id:"independence",term:"独立",
  title:{zh:"独立做，不等于独自决定",en:"Independent work, separate decision rights"},
  takeaway:{zh:"品质组长要独立检验零件，也要协助主管管理品质。能自己完成检验，与能制定检验规则，是两个问题。",en:"A quality lead must inspect parts independently while assisting a supervisor with quality management. Being able to inspect parts and being authorized to set inspection rules are separate questions."},
  numbers:{zh:"120份全文试验中，156处劳动者用法有122处是能力或经历要求（78.2%）；114份相关广告中，71份写明了协作对象与事项（62.3%）。",en:"In a 120-ad pilot, 122 of 156 worker-directed uses describe competence or experience (78.2%). Of 114 relevant ads, 71 name collaborators and joint tasks (62.3%)."},
  counting:{zh:"从618份含“独立”的广告中，按来源各取40份，共标记168处用法；去除12处独立站、设施等非劳动者用法后，按156处计。协作统计以114份相关广告为单位。两项来自模型语义编码，尚无独立人评准确率。",en:"The pilot selected 40 ads per source from 618 containing the term and coded 168 uses. Excluding 12 non-worker uses, such as standalone websites or facilities, leaves 156. Collaboration is counted across 114 relevant ads. These are model-coded results without an independent human accuracy estimate."},
  contexts:[
   {role:{zh:"五金品质组长",en:"Metal-parts quality lead"},work:{zh:"独立检验零件，同时协助主管管理品质。",en:"Inspect parts independently while assisting the supervisor with quality management."},reading:{zh:"检验写为“独立”，管理写为“协助”。同一份广告已经把两项工作的参与方式分开了。",en:"Inspection is described as independent; management as assisting. The same ad distinguishes how the person participates in these two tasks."}},
   {role:{zh:"财务实习生",en:"Finance intern"},work:{zh:"要求独立学习、工作，具体核算、审核和归档却写为“协助”。",en:"Independent learning and work are requested, while accounting, review and filing are described as assistance."},reading:{zh:"“独立”描述学习和工作能力；到了核算、审核这些具体事项，实习生的角色仍是协助。",en:"Independence describes learning and working ability. For specific accounting and review tasks, the intern is still described as assisting."}},
  ],
  counterexample:{zh:"另一些广告直接说明能决定什么：医学服务经理拥有区域经营自主权；航空安全岗在必要时可以责令停工。这些具体条款，比“独立”一词更清楚地写出了权限。",en:"Other ads specify what the person may decide: a medical-services manager has regional business discretion, and an aviation-safety role may order work stopped when necessary. These clauses state authority more clearly than the word independence."},
  interpretation:{zh:"品质组长可以独自检验，品质管理又写为协助主管。“独立”在这里选出的是能接手检验的人，管理上的位置要从另一条职责里读。Abbott关于专业分工与管辖权的研究，让这处措辞差别成为一个具体问题：会检验的人，是否也能制定检验规则？能力和权限可能同时具备，也可能分属不同岗位。",en:"The quality lead inspects independently but assists the supervisor with management. Independence identifies someone able to take on inspections; the management role is described in another duty. Abbott’s work on professional divisions of labour and jurisdiction sharpens a concrete question: can the person who conducts an inspection also set its rules? Expertise and authority may belong to the same role or to different ones."},
  question:{zh:"这项工作中，哪些成果由我独立完成？哪些标准、预算或例外处理可以由我决定，哪些需要别人批准？",en:"Which outputs would I produce independently? Which standards, budgets or exceptions could I decide, and which would require approval?"},
 },
 {
  id:"pressure",term:"抗压",
  title:{zh:"“抗压”常与“协调”同现",en:"Pressure and coordination travel together"},
  takeaway:{zh:"招聘负责人要推进寻访、面试和入职；直播助播要同时顾及观众、主播和道具。两份广告都写“抗压”，需要应对的场面却不同。",en:"A recruiter progresses sourcing, interviews and onboarding; a livestream assistant attends to viewers, the host and props at once. Both ads ask for pressure tolerance, but the situations differ."},
  numbers:{zh:"含“抗压”的广告中，284/501也写“协调”（56.7%）；不含“抗压”的广告为467/1,499（31.2%）。按来源和文本长短分成六组，方向均一致。",en:"Coordination appears in 284/501 ads with the pressure term (56.7%), versus 467/1,499 without it (31.2%). The direction is consistent in six groups split by source and text length."},
  counting:{zh:"每份广告每词只计一次；三种来源分别按文本长度中位数分成两组。分层帮助检查这个关系是否只来自长文本，但没有排除岗位构成、平台模板和采集时期的影响，也没有测量实际压力。完整交叉表见下方。",en:"Each term is counted once per ad. Each of three sources is split at its median text length. This checks whether the association is confined to longer texts; it does not remove differences in roles, templates or collection periods, or measure experienced pressure. Full cross-tabs appear below."},
  contexts:[
   {role:{zh:"技术招聘负责人",en:"Technical recruiter"},work:{zh:"承接紧急补编，推进寻访、面试、谈薪和入职。",en:"Handle urgent hiring and progress sourcing, interviews, offers and onboarding."},reading:{zh:"招聘有时限，但面试官、用人部门和候选人各有决定。应追问延期后谁调整目标，不能只问自己能否抗压。",en:"Hiring has deadlines, but interviewers, hiring teams and candidates make separate decisions. Ask who adjusts targets after delays, rather than treating coping as the only issue."}},
   {role:{zh:"直播助播",en:"Livestream assistant"},work:{zh:"控场、回应观众、协助主播，同时准备样品与道具。",en:"Manage a live session, respond to viewers, assist the host and prepare samples and props."},reading:{zh:"回应观众和准备道具可能同时需要处理。面试时可以问：顾不过来时，哪件事优先、谁来接手？",en:"Responding to viewers and preparing props may need attention at the same time. Ask what takes priority and who steps in when the tasks clash."}},
  ],
  counterexample:{zh:"带压力词的广告，也会写休息或补偿。另一组较宽压力词表筛查中，休息／时间补偿命中为45/579（7.8%），对照为108/1,421（7.6%）。两组比例接近，没有呈现“写压力就更少写休息补偿”的模式。",en:"Ads containing pressure terms can also mention rest or compensation. In a separate screen using a broader pressure vocabulary, rest/time-compensation mentions are 45/579 (7.8%), versus 108/1,421 (7.6%). The rates are close; this screen does not show fewer such mentions in the pressure group."},
  interpretation:{zh:"一轮招聘能否按时结束，要看用人部门、面试官和候选人的行动；JD把“抗压”列为招聘人员的要求。Urciuoli的技能语言研究帮助我们看见这个转换：多人合作中的难处，被表述为某个人应具备的品质。由此可以把“我够不够抗压”，问得更具体：面试推迟或候选人退出时，原定招聘目标怎样调整？",en:"Completing a hiring round on time depends on hiring teams, interviewers and candidates; the ad lists pressure tolerance as a requirement for the recruiter. Urciuoli’s work on skill language helps identify the shift from difficulties in collective work to qualities expected of an individual. It suggests a more specific question than whether one can cope: when an interview is delayed or a candidate withdraws, how is the original hiring target adjusted?"},
  question:{zh:"最常见的压力来自量、时限，还是其他人的配合？遇到延迟或突发情况时，谁接管、谁能改目标？",en:"Does pressure mainly come from volume, deadlines or dependence on others? When delays or incidents occur, who takes over and who can change the target?"},
 },
 {
  id:"loop",term:"闭环",
  title:{zh:"AI闭环里，还有人的判断",en:"AI feedback loops still need human judgment"},
  takeaway:{zh:"接管率、任务成功率不会直接告诉算法团队该改什么。AI交付运营还要把现场问题整理成具体的模型改进需求。",en:"Intervention and task-success rates do not tell an algorithm team exactly what to change. AI delivery operations must turn field problems into specific model-improvement requirements."},
  numbers:{zh:"182份广告含“闭环”；其中47份也含“模型”或“算法”，66份也含“异常”或“故障”。这是可重叠的词面同现计数。",en:"182 ads contain the loop term; 47 also mention models or algorithms, and 66 mention exceptions or faults. These are overlapping lexical co-occurrence counts."},
  counting:{zh:"统计检索的是同一份广告内的词面同现。尚未逐条判定182份广告的全部词义，不能据此说其中多少比例属于AI劳动或责任转嫁。下面两例与反例展示三种不同用法。",en:"The counts retrieve words appearing in the same ad. All 182 ads have not been semantically classified, so these figures cannot estimate shares of AI labour or risk transfer. The examples and counterexample illustrate three different uses."},
  contexts:[
   {role:{zh:"生产班组长",en:"Production team leader"},work:{zh:"安排班组人力，承接生产计划，记录异常并跟进改善。",en:"Arrange staffing, implement production plans, record exceptions and follow up improvements."},reading:{zh:"闭环指异常有后续处理。要读清谁能改工艺、调资源，以及由谁确认问题结束。",en:"The loop concerns follow-through on exceptions. Identify who can change processes, allocate resources and confirm closure."}},
   {role:{zh:"AI交付技术运营",en:"AI delivery-operations specialist"},work:{zh:"统计接管率和任务成功率，把现场问题转成模型改进需求。",en:"Track intervention and task-success rates and turn field problems into model-improvement requirements."},reading:{zh:"“现场出错了”还不是一条清楚的改进需求。需要说明是哪类问题、怎样复核，模型团队才有可以继续处理的记录。",en:"Saying that something went wrong in the field does not yet make a clear improvement request. The record needs to specify the kind of problem and how to check it, giving the model team something it can act on."}},
  ],
  counterexample:{zh:"AI视频压缩算法工程师的“数据闭环”连着自动驾驶数据回传，以及功耗、性能和面积约束。这里首先指技术系统的数据回路，不能直接读成“员工负责兜底”。",en:"For an AI video-compression engineer, a data loop concerns autonomous-driving data return and power, performance and area constraints. It primarily names a technical system, not an obligation for an employee to cover every failure."},
  interpretation:{zh:"统计一次接管，和解释这次接管给模型改进带来什么问题，是两项工作。后一项要把现场经历整理成类别、记录和可检查的改进要求。这样的整理参与决定哪些经历能进入研发讨论，也让一个常被“闭环”略过的环节显现出来：人要先把问题说清楚，模型团队才知道需要处理什么。",en:"Counting an intervention and explaining what it means for model improvement are different tasks. The latter organizes field experience into categories, records and requirements that can be checked. This work helps determine which experiences enter development discussions. The word loop can pass over an important step: people first have to formulate a problem that a model team can address."},
  question:{zh:"什么证据能让现场问题进入改进队列？谁决定分类与优先级，谁确认已经解决？",en:"What evidence gets a field issue into the improvement queue? Who decides its category and priority, and who confirms resolution?"},
 },
];

export const researchFraming = {
 lead:{zh:"从检验零件、推进招聘到改进模型，看能力要求落在哪些具体工作上。",en:"From inspecting parts to hiring staff and improving models, see what competence requirements ask people to do."},
 question:{zh:"一个能力词，究竟把什么工作交给了谁？",en:"What work does a competence word assign, and to whom?"},
 hypothesis:{zh:"能力词可能把协作责任写给个人。",en:"Competence labels may assign collaborative responsibilities to individuals."},
 hypothesisNote:{zh:"例如，一个人负责推进招聘，面试、谈薪和入职却需要多人接续。",en:"For example, one person progresses recruitment, while interviews, pay negotiations and onboarding involve several people."},
 methodStatus:{zh:"本页使用词面交叉表、来源与长度分层，以及120份全文语义试验；未做回归、匹配或因果估计。",en:"This page uses lexical cross-tabs, source-by-length groups and a 120-ad semantic pilot. No regression, matching or causal estimate was performed."},
 scope:{zh:"2,000份历史归档中的探索性比较。词面统计与120份全文语义试验分开计数；案例为去识别释义，尚无独立人评准确率。",en:"Exploratory comparisons of 2,000 historical ads. Lexical counts and a 120-ad semantic pilot use separate units. Cases are deidentified paraphrases; no independent human accuracy estimate is available."},
 thesis:{zh:"多人做的事，写成一个人的能力。",en:"Work done together, described as individual ability."},
 discussion:{zh:"品质组长被要求独立检验，招聘负责人被要求抗压，AI运营被要求跟进闭环。把相邻条款一并读进去，主管、面试官、候选人和算法团队又会出现。这些广告并非没有写协作，而是同时用两种方式描述工作：在职责里安排人与人的接续，在要求里筛选“独立”“抗压”的个人。值得细读的，正是这两种写法能否对上。例如，推进候选人入职是一项要求；候选人迟迟未确认时，能否调整招聘目标，则是另一项需要谈清的安排。",en:"The quality lead must inspect independently, the recruiter must tolerate pressure, and AI operations must follow issues through. Reading the adjacent clauses brings supervisors, interviewers, candidates and algorithm teams back into view. These ads do describe cooperation, but they also select individuals for qualities such as independence and pressure tolerance. The useful question is how the two descriptions fit together. Progressing a candidate toward joining is one requirement; whether a hiring target can change when the candidate has not confirmed is another matter to clarify."},
};

export const researchMicroTable = {
 title:{zh:"一个“闭环”，三种工作",en:"One loop label, three kinds of work"},
 takeaway:{zh:"同一个词，不等于同一种责任。",en:"One word does not imply one responsibility."},
 columns:[{zh:"岗位",en:"Role"},{zh:"对象",en:"Focus"},{zh:"文本动作",en:"Stated action"},{zh:"仍需确认",en:"To clarify"}],
 rows:[
  [{zh:"生产班组长",en:"Production lead"},{zh:"生产异常",en:"Production exceptions"},{zh:"记录、跟进",en:"Record, follow up"},{zh:"工艺变更权",en:"Process-change authority"}],
  [{zh:"AI交付运营",en:"AI delivery operations"},{zh:"现场问题",en:"Field issues"},{zh:"统计、转需求",en:"Measure, specify requirements"},{zh:"改进验收",en:"Acceptance of improvements"}],
  [{zh:"视频压缩工程师",en:"Video-compression engineer"},{zh:"数据回路",en:"Data circuit"},{zh:"优化规格",en:"Refine specifications"},{zh:"工程验收",en:"Engineering acceptance"}],
 ],
 note:{zh:"三例均为既有语料释义。“仍需确认”是给求职者的追问，不是已证实的权限缺失或实际考核。最后一例指技术数据回路，反驳了把“闭环”一律读成个人兜底的解释。",en:"These are paraphrases of existing cases. “To clarify” identifies questions, not proven absences of authority or actual appraisal criteria. The technical data circuit in the last row counters a blanket reading of loops as personal liability."},
};

export const researchAlternativeReadings = [
 {question:{zh:"会不会只是长广告写的词更多？",en:"Do longer ads simply contain more words?"},answer:{zh:"“抗压—协调”的关系，按三种来源各分长、短两组后，六组内方向仍一致。它不只出现在总体汇总中；但这次分组没有把同公司、同岗位逐一配对，不能解释差异由谁造成。",en:"The pressure–coordination association remains in the same direction in all six source-by-length groups. It is not confined to the pooled totals. These groups do not match identical roles or firms, however, and cannot identify what causes the difference."}},
 {question:{zh:"会不会只是模板，而非管理意图？",en:"Could this be a template rather than managerial intent?"},answer:{zh:"可能，这次没有辨认平台或HR模板的贡献。因此，我们把“抗压”放回寻访、面试和入职这些条款里读。即使它来自模板，求职者仍可以追问具体的招聘时限与延期处理；这些问题不需要先猜中雇主的动机。",en:"Possibly; this study has not identified the contribution of platform or HR templates. We therefore read pressure tolerance alongside sourcing, interviews and onboarding. Even if the phrase came from a template, an applicant can ask about hiring deadlines and handling delays without first inferring the employer’s motive."}},
];

export const researchMethodReferences:PublicStudy["report"]["bibliography"] = [
 {author:"Justin Grimmer & Brandon M. Stewart",title:"Text as Data: The Promise and Pitfalls of Automatic Content Analysis Methods for Political Texts (2013)",url:"https://web.stanford.edu/~jgrimmer/tad2.pdf",contribution:{zh:"自动文本测量需要针对研究问题验证；本页区分词面检索与模型语义编码，不把模型复读一致性当作独立人评准确率。",en:"Automated text measures require validation specific to the research question. Lexical retrieval and model coding are kept separate; repeated model agreement is not independent human accuracy."}},
 {author:"Johanna Drucker",title:"Humanities Approaches to Graphical Display (2011)",url:"https://dhq-static.digitalhumanities.org/pdf/000091.pdf",contribution:{zh:"分类与图形包含研究者的解释选择；因此展示分母、编码口径与反例，不把图中类别当作岗位的天然属性。",en:"Categories and graphics incorporate interpretive choices. Denominators, coding rules and counterexamples remain visible rather than presenting categories as natural attributes of jobs."}},
];

export function researchMarkdown(data:PublicStudy,lang:"zh"|"en"):string {
 const t=(zh:string,en:string)=>lang==="zh"?zh:en;
 const lines=[`# ${t("招聘如何描绘“合适的人”？","How do job ads describe the right person?")}`,"",researchFraming.lead[lang],"",researchFraming.scope[lang],"",`## ${t("问题","Question")}`,researchFraming.question[lang],"",`## ${t("假设 · 待检验","Hypothesis · To test")}`,researchFraming.hypothesis[lang],researchFraming.hypothesisNote[lang],""];
 for(const [index,o] of researchObservations.entries()){
  lines.push(`## ${index+1}. ${o.title[lang]}`,"",o.takeaway[lang],"",o.numbers[lang],"",`### ${t("两个工作语境","Two work contexts")}`);
  for(const context of o.contexts)lines.push(`**${context.role[lang]}** — ${context.work[lang]}`,context.reading[lang],"");
  lines.push(`### ${t("反例：不要一概而论","Counterexample: avoid a blanket reading")}`,o.counterexample[lang],"",`### ${t("这说明了什么","What this suggests")}`,o.interpretation[lang],"",`### ${t("可以追问","A question to ask")}`,o.question[lang],"",`### ${t("统计怎样计算","How the counts were made")}`,o.counting[lang],"");
 }
 lines.push(`## ${researchMicroTable.title[lang]}`,"",researchMicroTable.takeaway[lang],"",`| ${researchMicroTable.columns.map(c=>c[lang]).join(" | ")} |`,`| ${researchMicroTable.columns.map(()=>"---").join(" | ")} |`);
 for(const row of researchMicroTable.rows)lines.push(`| ${row.map(c=>c[lang]).join(" | ")} |`);
 lines.push("",researchMicroTable.note[lang],"",`## ${t("可能的不同读法","Alternative readings")}`,"");
 for(const reading of researchAlternativeReadings)lines.push(`### ${reading.question[lang]}`,reading.answer[lang],"");
 lines.push(`## ${t("讨论","Discussion")}`,researchFraming.thesis[lang],"",researchFraming.discussion[lang],"",`## ${t("方法与参考","Method and references")}`,researchFraming.methodStatus[lang],"",data.methods.scope[lang],"",data.methods.sampleNote[lang],"",data.methods.frequencyNote[lang],"");
 for(const observation of researchObservations){const k=data.keywords.find(k=>k.term===observation.term);if(k)lines.push(`- ${lang==="zh"?k.term:k.english}: ${k.documents}/${data.methods.corpusN} (${(100*k.documents/data.methods.corpusN).toFixed(1)}%)`)}
 lines.push("",`### ${t("交叉表","Cross-tabs")}`,"");
 for(const tab of data.report.crossTabs){
  lines.push(`### ${tab.title[lang]}`,"",`| ${t("文本组","Ad group")} | ${tab.columns.map(c=>c[lang]).join(" | ")} | ${t("命中比例","Hit rate")} |`,`| ${Array(tab.columns.length+2).fill("---").join(" | ")} |`);
  tab.cells.forEach((row,i)=>{const total=row.reduce((a,b)=>a+b,0);lines.push(`| ${tab.rowLabels[i][lang]} | ${row.join(" | ")} | ${(100*row[0]/total).toFixed(1)}% |`)});
  lines.push("",tab.note[lang],"");
 }
 for(const ref of [...data.report.bibliography,...researchMethodReferences])lines.push(`- ${ref.author}. [${ref.title}](${ref.url}) — ${ref.contribution[lang]}`);
 return lines.join("\n");
}
