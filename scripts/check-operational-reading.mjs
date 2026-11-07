import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';

// Offline, synthetic fixtures only. These checks enforce evidence and shape;
// the rubric below still needs human or independently reviewed model judgments.
const output=resolve('.sites-runtime/operational-reading-tests');
mkdirSync(output,{recursive:true});writeFileSync(resolve(output,'package.json'),'{"type":"commonjs"}');
const compile=spawnSync(process.execPath,[resolve('node_modules/typescript/bin/tsc'),'--target','ES2022','--module','commonjs','--moduleResolution','node','--esModuleInterop','--skipLibCheck','--strict','--outDir',output,'lib/analysis-contract.ts','lib/analysis-prompt.ts'],{encoding:'utf8'});
if(compile.status!==0){process.stderr.write(compile.stdout+compile.stderr);process.exit(1);}
const require=createRequire(import.meta.url);
const {resultSchema,modelOutputSchema,deepEvidenceErrors,operationalBreakdownErrors}=require(resolve(output,'analysis-contract.js'));
const {ANALYSIS_VERSION}=require(resolve(output,'analysis-prompt.js'));
const {sociologyReference}=require(resolve(output,'sociology-references.js'));
const bi=(zh,en)=>({zh,en});
const clauses=[
 '对投稿与消费行为进行数据分析，比较各类视频数量和观看完成率，记录变化。',
 '制定内容分类标准与正反例，处理兼具不同类别特征的样本。',
 '检查标签覆盖与一致性，根据复核结果修订分类标准。'
];
const raw=`虚构内容运营岗位\n工作职责\n${clauses.join('\n')}\n任职要求\n熟练使用Excel。SQL经验优先。本科在读。实习3个月以上。`;
const legacyFixture=()=>({
 headline:bi('把内容变化整理成可执行的分类规则。','Turn changes in content into usable classification rules.'),
 role:bi('分析投稿与观看数据，制定内容类别并检查标签。','Analyse posting and viewing data, define categories and check tags.'),
 terms:[
  {term:'数据分析',quote:clauses[0],meaning:bi('比较视频数量与观看完成率，描述投稿和消费的变化。','Compare video counts and completion rates to describe changes in posting and viewing.'),alternative:bi('范围：变化尚不等于变化原因。','Scope: a change does not establish its cause.'),question:bi('比较数据采用什么时间窗口？','What comparison window is used?')},
  {term:'分类标准',quote:clauses[1],meaning:bi('把类别边界和正反例写清楚，使别人能判断兼具不同特征的内容。','Define category boundaries and examples so others can judge mixed-content cases.'),alternative:bi('待确认的标准：是否允许多标签。','Evaluation criterion to clarify: whether multiple tags are allowed.'),question:bi('混合内容采用主类还是多标签？','Does mixed content use one main category or multiple tags?')}
 ],
 sociology:bi('分类要求把个案中的内容判断写成别人能使用的标准，再用复核结果修改。这里的判断力不只体现为个人看得准，还体现为判断能否被说明、复用和修订。','Classification turns individual content judgments into rules others can apply and revise through review. Judgment here includes making a decision explainable and reusable, not simply getting a case right.'),
 questions:[bi('混合内容采用主类还是多标签？','Does mixed content use one main category or multiple tags?')],
 conditions:[bi('实习至少3个月。','Available for at least three months.')],gaps:[],comparisons:[],
 depth:{protocol:'work-language-v2',basis:'model',workMap:{object:bi('投稿、观看数据与内容标签。','Posts, viewing data and content tags.'),tools:bi('Excel；SQL经验优先。','Excel; SQL experience is preferred.'),partners:bi('复核涉及的协作人员未写明。','The people involved in review are not specified.'),authority:bi('标准最终批准权未写明。','Final approval of the standards is not specified.'),quotes:[clauses[0],clauses[1]]},
  deliverables:[
   {task:bi('比较投稿和观看的变化。','Compare changes in posting and viewing.'),quote:clauses[0],object:bi('不同类别的视频数量和观看完成率。','Video counts and completion rates for different categories.'),action:bi('在相同口径下比较两项指标，记录变化。','Compare the two measures using consistent definitions and record changes.'),purpose:bi('为后续分类工作提供内容变化线索。','Give the category work evidence about changes in content.'),scenario:{kind:'hypothetical',text:bi('例如，宠物投稿增多但完成率不变，应分别描述两项变化。','For example, pet-video posts increase while completion rates stay flat; describe the measures separately.')},output:bi('一份附比较口径的内容变化记录。','A note on content changes with comparison definitions.'),check:bi('同事能从相同数据复算，且不把相关变化写成原因。','A colleague can reproduce the comparison without treating correlation as a cause.')},
   {task:bi('写出别人能使用的分类规则。','Write classification rules others can use.'),quote:clauses[1],object:bi('内容类别、边界与正反例。','Content categories, boundaries and examples.'),action:bi('说明哪些内容归入一类，并列出容易混淆的例子。','State what belongs in a category and describe ambiguous cases.'),purpose:bi('使分类判断能被说明和复用。','Make classification judgments explainable and reusable.'),scenario:{kind:'hypothetical',text:bi('例如，一条视频既探店又教做菜，要说明如何判断它的类别。','For example, a video both reviews a restaurant and teaches cooking; explain how to classify it.')},output:bi('一页分类说明，含正例、反例与边界案例。','A one-page rule with positive, negative and boundary cases.'),check:bi('另一人能使用该规则，分歧能对应到具体条款。','Another person can apply the rule and trace disagreements to specific clauses.')},
   {task:bi('找出标签缺口并修订标准。','Find gaps in tags and revise the standard.'),quote:clauses[2],object:bi('已有标签、内容样本与复核结果。','Existing tags, content samples and review results.'),action:bi('检查覆盖与一致性，记录需要修改的规则。','Check coverage and consistency and record needed rule changes.'),purpose:bi('让分类标准回应复核发现的问题。','Make category rules respond to problems found in review.'),scenario:{kind:'hypothetical',text:bi('例如，新饮品样本只落入过宽类别，可以检查是否需要增加子类。','For example, new drinks fall into a broad category; examine whether a subcategory is useful.')},output:bi('一份标签修订建议，附受影响的样本。','A tag revision proposal with affected examples.'),check:bi('每项修改能对应复核问题，并检查是否引入新的类别冲突。','Each revision addresses a review finding and is checked for new category conflicts.')}
  ],
  preparation:{competencies:[
   {level:'required',skill:bi('熟练使用Excel。','Proficiency in Excel.'),application:bi('用来整理和比较投稿、观看指标。','Use it to organise and compare posting and viewing measures.'),quote:'熟练使用Excel'},
   {level:'preferred',skill:bi('SQL经验优先。','SQL experience is preferred.'),application:bi('有助于理解数据提取；原文没有要求本岗独立查询。','Useful for understanding data extraction; the JD does not require independent querying.'),quote:'SQL经验优先'},
   {level:'suggested',skill:bi('准备一组边界案例。','Prepare a set of boundary cases.'),application:bi('展示如何解释分类分歧。','Show how you explain classification disagreements.'),quote:clauses[1]}
  ],materials:[bi('选一个熟悉的内容类别，写一页规则并附正反例。','Choose a familiar content category and prepare a one-page rule with positive and negative examples.')],practice:[{question:bi('探店视频同时教做菜，如何设计分类规则？','How would you classify a restaurant-review video that also teaches cooking?'),approach:bi('先明确用途，再比较主类与多标签方案，用边界样本检查规则。','Clarify the purpose, compare a main-category rule with multiple tags, and test boundary cases.')}]},
  example:null,sociologyQuotes:[clauses[1],clauses[2]],questionTests:[{questionIndex:0,quote:clauses[1],answerA:bi('假设采用单一主类。','Suppose one main category is used.'),answerB:bi('假设允许多标签。','Suppose multiple tags are allowed.'),difference:bi('前者需要明确主次规则，后者需要检查标签间是否兼容。','The first needs precedence rules; the second needs compatibility checks.')}]
 }
});
const make=()=>{
 const result=legacyFixture(),d=result.depth;
 d.sociologyConceptId='classification';
 d.sociologySummary=bi('分类能力还包括把判断写成别人能使用与修订的规则。','Classification skill includes making judgments into rules others can use and revise.');
 d.preparation.materials.push(bi('用三个自拟视频描述做一页标签检查记录，标明有争议的边界。','Make a one-page tag review from three invented video descriptions, marking disputed boundaries.'));
 d.preparation.practice.push({question:bi('两位同事给同一视频分了不同类，怎么查？','Two colleagues classify the same video differently. What would you check?'),approach:bi('先对照双方理由与规则定义，再用同类边界样本检验修改。','Compare their reasons with the category definitions, then test revisions on similar boundary cases.')});
 return result;
};
const checks=[];const check=(name,fn)=>{fn();checks.push(name);};
const errors=(value,source=raw)=>deepEvidenceErrors(resultSchema.parse(value),source,true,true,true);
check('v10 uses the compatible v2 record protocol',()=>{assert.equal(ANALYSIS_VERSION,'work-language-v10');assert.equal(make().depth.protocol,'work-language-v2');});
check('a grounded complete synthetic reading passes',()=>assert.deepEqual(errors(make()),[]));
check('strict model output requires all duty explanations and preparation',()=>{
 const d=modelOutputSchema.properties.depth;
 for(const key of ['object','action','purpose','scenario'])assert(d.properties.deliverables.items.required.includes(key));
 assert(d.required.includes('preparation'));assert(d.required.includes('sociologySummary'));assert.equal(d.properties.preparation.properties.materials.maxItems,2);assert.equal(d.properties.preparation.properties.practice.maxItems,2);assert.deepEqual(d.properties.preparation.required,['competencies','materials','practice']);
});
check('each substantive synthetic source duty is represented once',()=>assert.deepEqual(make().depth.deliverables.map(d=>d.quote),clauses));
check('new fields survive persistence parsing',()=>assert.deepEqual(resultSchema.parse(make()).depth,make().depth));
check('legacy duty records remain valid and readable without new requirements',()=>{
 const old=make();delete old.depth.preparation;delete old.depth.sociologySummary;delete old.depth.sociologyConceptId;
 for(const d of old.depth.deliverables)for(const k of ['object','action','purpose','scenario'])delete d[k];
 assert(resultSchema.safeParse(old).success);assert.deepEqual(deepEvidenceErrors(old,raw,true,true),[]);
 assert(errors(old).some(e=>e.startsWith('depth.preparation')));
});
check('missing explanations cannot pass new-generation validation',()=>{for(const key of ['object','action','purpose','scenario']){const bad=make();delete bad.depth.deliverables[0][key];assert(errors(bad).some(e=>e.includes(`deliverables[0].${key}`)));}});
check('invented source quotes are rejected',()=>{const bad=make();bad.depth.deliverables[0].quote='要求每天更新三份报表';assert(errors(bad).some(e=>e.includes('exact source span')));});
check('an example cannot be labelled as a reported workplace event',()=>{const bad=make();bad.depth.deliverables[0].scenario.kind='observed';assert(!resultSchema.safeParse(bad).success);});
check('requirements and preferences need non-empty source quotes',()=>{for(const level of ['required','preferred']){const bad=make();bad.depth.preparation.competencies[0].level=level;bad.depth.preparation.competencies[0].quote=' ';assert(!resultSchema.safeParse(bad).success);}});
check('a preference cannot be promoted to a mandatory competency',()=>{const bad=make();bad.depth.preparation.competencies[1].level='required';assert(errors(bad).some(e=>e.includes('preserve preferred status')));});
check('a false competency quote is rejected even when its shape is valid',()=>{const bad=make();bad.depth.preparation.competencies[0].quote='必须熟练掌握Python';assert(errors(bad).some(e=>e.includes('competencies[0].quote')));});
check('a suggested preparation exercise does not need an invented source clause',()=>{const good=make();good.depth.preparation.competencies[2].quote='';assert.deepEqual(errors(good),[]);});
check('a qualification-free JD can omit advertised competency rows',()=>{const good=make();good.depth.preparation.competencies=[];assert.deepEqual(errors(good),[]);});
check('blank bilingual application and practice fields are rejected',()=>{const bad=make();bad.depth.preparation.competencies[0].application.en='';bad.depth.preparation.practice[0].approach.zh='';assert(errors(bad).some(e=>e.includes('.application')));assert(errors(bad).some(e=>e.includes('.approach')));});
check('sparse evidence may leave preparation empty without adding fictitious work',()=>{const sparse=make();sparse.depth.preparation.materials=[];sparse.depth.preparation.practice=[];assert.deepEqual(errors(sparse),[]);});
check('new English fields cannot contain untranslated Chinese prose',()=>{const bad=make();bad.depth.deliverables[0].object.en='用户投稿数据';assert(errors(bad).some(e=>e.includes('untranslated Chinese')));});
check('new task facts receive existing bilingual boundary checks',()=>{const bad=make();bad.depth.deliverables[0].action=bi('具备至少3年项目管理经验。','Have over three years of project-management experience.');assert(operationalBreakdownErrors(bad,raw+'要求3年以上项目管理经验。',true).some(e=>e.startsWith('depth.deliverables[0].action.en')));});
check('advertised competency facts receive existing bilingual boundary checks',()=>{const bad=make();bad.depth.preparation.competencies[0]={level:'required',skill:bi('至少3年项目管理经验。','Over three years of project-management experience.'),application:bi('理解项目进度。','Understand project progress.'),quote:'3年以上项目管理经验'};assert(operationalBreakdownErrors(bad,raw+'3年以上项目管理经验',true).some(e=>e.startsWith('depth.preparation.competencies[0].skill.en')));});
check('hypothetical numbers and proposed exercises are not advertised facts',()=>{const good=make();const invented=bi('假设管理三人团队。','Suppose you manage a team of three.');good.depth.deliverables[0].scenario.text=invented;good.depth.preparation.practice[0].question=invented;assert.deepEqual(errors(good,raw+'过去有管理3人团队的经验。'),[]);});
check('helping cannot become an unsupported denial of final sign-off in either language',()=>{
 const source=raw+'协助团队修订标准。',bad=make();bad.sociology=bi('辅助表明其不掌握最终定稿权。','Assisting shows no final sign-off authority.');
 const found=operationalBreakdownErrors(bad,source,true);assert(found.some(e=>e.startsWith('sociology.zh:')));assert(found.some(e=>e.startsWith('sociology.en:')));
 const good=make();good.sociology=bi('辅助制定规则，最终定稿权未说明。','The intern assists with rules; final sign-off is not specified.');assert.deepEqual(operationalBreakdownErrors(good,source,true),[]);
});
check('investment judgment cannot be assigned away from an intern without relevant source support',()=>{
 const source=raw+'协助投资团队整理资料。预算由经理批准。',bad=make();bad.sociology=bi('投资判断仍由团队掌握，实习生获得文档训练而非决策权。','Investment judgment stays with the team; the intern gains documentary training, not decision rights.');
 const found=operationalBreakdownErrors(bad,source,true);assert(found.some(e=>e.startsWith('sociology.zh:')));assert(found.some(e=>e.startsWith('sociology.en:')));
 bad.role=bi('广告未赋予签署报告或拍板投资的权限。','The ad does not grant report-signing or investment-approval authority.');assert(operationalBreakdownErrors(bad,source,true).some(e=>e.startsWith('role.zh:')));
});
check('explicit approval roles and labelled hypothetical examples remain valid',()=>{
 const source=raw+'辅助起草，最终定稿由主编负责。',good=make();good.sociology=bi('辅助起草，最终定稿权不由实习生掌握。','The intern assists with drafting and has no final sign-off authority.');assert.deepEqual(operationalBreakdownErrors(good,source,true),[]);
 const hypothetical=make();hypothetical.depth.deliverables[0].scenario.text=bi('假设实习生没有最终定稿权，需与主编讨论。','Suppose the intern has no final sign-off authority and discusses the draft with an editor.');assert.deepEqual(operationalBreakdownErrors(hypothetical,raw+'协助整理资料。',true),[]);
});

check('new generation needs the compact summary while legacy records remain readable',()=>{
 const bad=make();delete bad.depth.sociologySummary;assert(resultSchema.safeParse(bad).success);assert(errors(bad).some(e=>e.startsWith('depth.sociologySummary')));
});
check('summary length and bilingual evidence guards apply to the new public card',()=>{
 const long=make();long.depth.sociologySummary.zh='字'.repeat(61);assert(errors(long).some(e=>e.includes('within 60 characters')));
 const untranslated=make();untranslated.depth.sociologySummary.en='分类 rules';assert(errors(untranslated).some(e=>e.includes('untranslated Chinese')));
 const denied=make();denied.depth.sociologySummary=bi('辅助表明其不掌握最终定稿权。','Assisting shows no final sign-off authority.');assert(operationalBreakdownErrors(denied,raw+'协助整理资料。',true).some(e=>e.startsWith('depth.sociologySummary')));
});
check('new preparation remains bounded while sparse evidence may use one sample',()=>{
 const bad=make();bad.depth.preparation.materials.push(bad.depth.preparation.materials[0]);assert(errors(bad).some(e=>e.startsWith('depth.preparation.materials')));
 const good=make();good.depth.preparation.materials.pop();good.depth.preparation.practice.pop();assert.deepEqual(errors(good),[]);
});
check('sociology may be omitted only as a consistent empty group',()=>{
 const good=make();good.sociology=bi('','');good.depth.sociologySummary=bi('','');good.depth.sociologyConceptId=null;good.depth.sociologyQuotes=[];good.questions=[];good.depth.questionTests=[];assert.deepEqual(errors(good),[]);
 good.depth.sociologySummary.zh='还有一个强行生成的结论';assert(errors(good).some(e=>e.startsWith('sociology:')));
});
check('a new sociological reading must use one known concept and source anchor',()=>{
 const missing=make();missing.depth.sociologyConceptId=null;assert(errors(missing).some(e=>e.startsWith('depth.sociologyConceptId')));
 const invented=make();invented.depth.sociologyConceptId='invented_reference';assert(!resultSchema.safeParse(invented).success);
 const unanchored=make();unanchored.depth.sociologyQuotes=[];assert(errors(unanchored).some(e=>e.includes('sociological reading needs source anchors')));
});
check('a sourced boundary-object reading persists with its checked reference and keeps existing concept IDs',()=>{
 const source=raw+'运营与算法共用分类说明书，分别据此整理内容与训练模型。',good=make();
 good.depth.sociologyConceptId='boundary_objects';good.depth.sociologyQuotes=['运营与算法共用分类说明书，分别据此整理内容与训练模型'];
 good.depth.sociologySummary=bi('同一份分类说明书服务于内容整理与模型训练。','The same classification guide serves content organization and model training.');
 good.sociology=bi('分类说明书在运营整理内容和算法训练模型之间传递同一套类别，两组人的使用目的不同。需要确认双方怎样修改这份共同材料；若仅单方使用而不参与跨组协作，边界物的解释就较弱。','The guide carries shared categories between content operations and model training, with different uses in each group. Ask how both groups revise it; if only one group uses it without cross-group cooperation, the boundary-object reading is weaker.');
 assert.deepEqual(errors(good,source),[]);assert.equal(resultSchema.parse(good).depth.sociologyConceptId,'boundary_objects');
 assert.equal(sociologyReference('boundary_objects').url,'https://doi.org/10.1177/030631289019003001');
 for(const id of ['classification','jurisdiction','emotional_labor'])assert(sociologyReference(id));
});
check('source alternatives stay alternatives in every assertion-bearing section',()=>{
 const source=raw+'能够独立或带组员。',claim=bi('岗位要求能独立完成，也能带组员推进。','The role requires working independently and leading group members.');
 const placements=[
  ['headline',reading=>reading.headline=claim],['role',reading=>reading.role=claim],
  ['terms[0].meaning',reading=>reading.terms[0].meaning=claim],['conditions[0]',reading=>reading.conditions[0]=claim],
  ['depth.workMap.authority',reading=>reading.depth.workMap.authority=claim],
  ['depth.deliverables[0].action',reading=>reading.depth.deliverables[0].action=claim],
  ['depth.preparation.competencies[0].application',reading=>reading.depth.preparation.competencies[0].application=claim]
 ];
 for(const [path,place] of placements){const bad=make();place(bad);assert(operationalBreakdownErrors(bad,source,true).some(e=>e.startsWith(`${path}.zh:`)&&e.includes('OR')));}
});
check('an English translation cannot turn a preserved Chinese alternative into AND',()=>{
 const source=raw+'能够独立或带组员。',bad=make();bad.role=bi('独立完成或带组员推进。','Complete work independently and lead group members.');
 assert(operationalBreakdownErrors(bad,source,true).some(e=>e.startsWith('role.en:')&&e.includes('OR')));
 const good=make();good.role=bi('独立完成或带组员推进。','Complete work independently or lead group members.');assert.deepEqual(operationalBreakdownErrors(good,source,true),[]);
 good.role=bi('独立和带组员是两种可选模式。','There is a choice between independent work and group leadership.');assert.deepEqual(operationalBreakdownErrors(good,source,true),[]);
});
check('possible modes are not misread as two mandatory capacities',()=>{
 const source=raw+'能够独立或带组员。',good=make();good.role=bi('可独立做，也可能带组员。','Work may be independent or involve leading team members.');assert.deepEqual(operationalBreakdownErrors(good,source,true),[]);
 good.role=bi('可以独立推进，也可以带组员推进。','Work independently or lead team members.');assert.deepEqual(operationalBreakdownErrors(good,source,true),[]);
 const bad=make();bad.role=bi('可独立做，也必须带组员。','Work independently and also lead team members.');assert(operationalBreakdownErrors(bad,source,true).some(e=>e.startsWith('role.zh:')));
});
check('English source alternatives and other industries receive the same narrow check',()=>{
 const source=raw+'Can research or write reports.',bad=make();bad.role=bi('需要调研及撰写报告。','Research and write reports.');assert(operationalBreakdownErrors(bad,source,true).some(e=>e.startsWith('role.en:')&&e.includes('OR')));
 const factory=make();factory.role=bi('需掌握焊接和装配。','Both soldering and assembly are required.');assert(operationalBreakdownErrors(factory,raw+'熟悉焊接或装配。',true).some(e=>e.startsWith('role.zh:')&&e.includes('OR')));
 factory.role=bi('具备焊接与装配能力。','Have soldering and assembly skills.');assert.deepEqual(operationalBreakdownErrors(factory,raw+'熟悉焊接与装配。',true),[]);
});
check('a proposed exercise may combine alternative skills without making both mandatory',()=>{
 const good=make();good.depth.deliverables[0].scenario.text=bi('假设先独立起稿，也带组员复核。','Suppose you draft independently and lead group members in review.');
 good.depth.preparation.materials[0]=bi('建议练习独立和带组员两种方式。','As practice, try both independent work and group leadership.');
 assert.deepEqual(operationalBreakdownErrors(good,raw+'能够独立或带组员。',true),[]);
});
check('an unfinished coordinated qualification cannot make its earlier item a hard gate',()=>{
 const source=raw+'会调PE，有相关策略实习经验、AI大模型实习经[原文截断]',bad=make();
 bad.depth.preparation.competencies=[{level:'required',skill:bi('相关策略实习经验。','Relevant strategy internship experience.'),application:bi('理解策略工作。','Understand strategy work.'),quote:'有相关策略实习经验'}];
 assert(operationalBreakdownErrors(bad,source,true).some(e=>e.includes('unfinished qualification group')));
 bad.depth.preparation.competencies[0].level='preferred';assert(operationalBreakdownErrors(bad,source,true).some(e=>e.includes('unfinished qualification group')));
 bad.depth.preparation.competencies[0]={level:'clarify',skill:bi('策略及大模型实习经历的完整要求。','The full experience requirement for strategy and model internships.'),application:bi('确认是否为优先条件。','Confirm whether this is a preference.'),quote:'有相关策略实习经验、AI大模型实习经[原文截断]'};
 assert.deepEqual(operationalBreakdownErrors(bad,source,true),[]);
});
check('a separate complete qualification survives a nearby truncated list',()=>{
 const source=raw+'会调PE，有相关策略实习经验、AI大模型实习经[原文截断]',good=make();
 good.depth.preparation.competencies.push({level:'required',skill:bi('会调PE。','Prompt design and tuning.'),application:bi('辅助模型效果改进。','Support model improvement.'),quote:'会调PE'});
 assert.deepEqual(operationalBreakdownErrors(good,source,true),[]);
});
check('a surviving explicit modifier or independent complete source resolves force',()=>{
 const good=make();good.depth.preparation.competencies=[{level:'required',skill:bi('策略实习经验。','Strategy internship experience.'),application:bi('理解策略工作。','Understand strategy work.'),quote:'策略实习经验'}];
 assert.deepEqual(operationalBreakdownErrors(good,raw+'必须具备策略实习经验、相关项目经[原文截断]',true),[]);
 assert.deepEqual(operationalBreakdownErrors(good,raw+'要求策略实习经验。策略实习经验、相关项目经[原文截断]',true),[]);
});
check('drafting cannot become a denial of independent judgment or conclusion ownership',()=>{
 const source=raw+'撰写投资研究初稿。',bad=make();
 bad.role=bi('负责研究材料初稿。','It is not independent ownership of investment judgment.');
 bad.terms[0].meaning=bi('这是基础工作，不是独立给出投资结论。','This is basic work, not independent investment conclusions.');
 const found=operationalBreakdownErrors(bad,source,true);assert(found.some(e=>e.startsWith('role.en:')));assert(found.some(e=>e.startsWith('terms[0].meaning.zh:')));assert(found.some(e=>e.startsWith('terms[0].meaning.en:')));
 const good=make();good.role=bi('起草研究材料，判断权限未说明。','Draft research materials; independent judgment authority is not specified.');assert.deepEqual(operationalBreakdownErrors(good,source,true),[]);
 good.role=bi('参与初稿不等于已获独立决策权。','Drafting does not establish independent decision rights.');assert.deepEqual(operationalBreakdownErrors(good,source,true),[]);
});
check('a relevant express exclusion supports only the stated authority boundary',()=>{
 const source=raw+'辅助整理投资资料，不独立给出投资结论。',good=make();good.role=bi('辅助整理资料，不是独立给出投资结论。','This is not independent ownership of investment judgment.');assert.deepEqual(operationalBreakdownErrors(good,source,true),[]);
 const excludedDecision=raw+'辅助整理投资资料，不参与投资决策。';assert(operationalBreakdownErrors(good,excludedDecision,true).some(e=>e.startsWith('role.zh:')));
});

const reviewRubric=[
 {criterion:'Understand the work',range:'0–4',fullCredit:'A reader unfamiliar with the role can identify the object, action and result of each major duty; the concrete example clarifies a real task distinction.',failure:'Only paraphrases jargon, misses a major duty, or repeats the same generic deliverable.'},
 {criterion:'Specific without invention',range:'0–4',fullCredit:'Original clauses, interpretations, suggestions and hypothetical examples remain distinct; skill level and modality survive both languages.',failure:'Invents a required skill, employer practice, decision right or causal explanation. Any such material false claim fails the reading regardless of total score.'},
 {criterion:'Prepare, ask and understand',range:'0–4',fullCredit:'Offers a usable work sample and check, a task-specific practice problem, a consequential employer question, and a source-grounded explanation of how the work is organized.',failure:'Generic portfolio advice, stock questions, or sociological prose that could fit an unrelated job unchanged.'}
];
console.log(JSON.stringify({passed:true,checks:checks.length,liveApiCalls:0,interpretiveQualityMeasured:false,scope:'Synthetic evidence, compatibility, bilingual and output-contract regressions. Rubric quality still needs independent review.',acceptance:'At least 10/12 after review, with no material factual failure.',reviewRubric},null,2));
