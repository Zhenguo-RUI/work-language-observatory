import assert from 'node:assert/strict';

const bi=(zh,en)=>({zh,en});

/**
 * Complete synthetic provider payloads for transport/company regression tests.
 * This is fixture construction, not production enrichment or a quality score.
 * Existing task, quotation, output and check fields are deliberately preserved.
 */
export function withOperationalModelFields(reading,raw,domain){
 const result=structuredClone(reading),d=result.depth;
 assert(d?.deliverables.length,'The synthetic fixture must already have grounded duties.');
 assert(['evaluation','advertising'].includes(domain));
 d.basis='model';
 d.deliverables=d.deliverables.map(item=>{
  assert(raw.includes(item.quote),'A fixture duty must have an exact source quote.');
  let object,action,purpose,example;
  if(domain==='evaluation'){
   if(/消融/.test(item.quote)){
    object=bi('评估流程中的判定逻辑与待评答案。','Evaluator logic and the answers being judged.');
    action=bi('比较删去一项判定逻辑前后的结果，固定被评答案。','Compare results with and without an evaluation rule while holding the answers fixed.');
    purpose=bi('识别判定规则对评估结果的影响。','Identify how an evaluation rule affects judgments.');
    example=bi('例如，去掉引用检查后，观察同一批答案中哪些判定改变。','For example, remove the citation check and inspect changed judgments on the same answers.');
   }else if(/线上|用户行为/.test(item.quote)){
    object=bi('线上实验结果与用户行为记录。','Online experiment results and user behavior records.');
    action=bi('把评估结论与线上表现对照，检查不一致的情况。','Compare evaluation judgments with online outcomes and inspect discrepancies.');
    purpose=bi('让评估体系回应真实使用中的问题。','Make the evaluation system respond to problems in use.');
    example=bi('例如，离线高分的答案仍引发重复追问，检查问题是否出在任务理解。','For example, a highly rated answer still prompts repeated questions; examine whether the task was misunderstood.');
   }else if(/RAG/.test(item.quote)){
    object=bi('检索材料与最终答案。','Retrieved evidence and final answers.');
    action=bi('检查答案的问题是否与检索材料有关。','Check whether answer problems relate to retrieved evidence.');
    purpose=bi('区分检索环节和答案环节的质量问题。','Distinguish retrieval issues from answer issues.');
    example=bi('例如，答案引用过期材料，先检查检索证据而非直接判定生成模型失效。','For example, an answer cites outdated material; inspect the retrieved evidence before attributing the error to generation.');
   }else if(/标注|一致率|机评/.test(item.quote)){
    object=bi('机器评估与人工标注的分歧案例。','Cases where automated and human judgments disagree.');
    action=bi('分析一致率，并逐例查看分歧。','Analyse agreement and inspect individual disagreements.');
    purpose=bi('找出评估口径需要澄清的位置。','Locate parts of the evaluation criteria that need clarification.');
    example=bi('例如，同一答案被机评接受、人工拒绝，比较双方对引用是否有效的标准。','For example, a model accepts an answer that a human rejects; compare their criteria for valid citations.');
   }else{
    object=bi('可复用的评估流程及其判定步骤。','A reusable evaluation process and its judgment steps.');
    action=bi('将评估步骤整理为可运行、可复查的流程。','Organise evaluation steps into a runnable, inspectable process.');
    purpose=bi('使评估过程能够被重复使用与检查。','Make the evaluation process reusable and inspectable.');
    example=bi('例如，把同一组案例再次交给流程，检查每个判断步骤是否留下记录。','For example, rerun the process on the same cases and check that each judgment step is recorded.');
   }
  }else{
   object=bi('广告素材、点击及成交数据。','Ad creatives, clicks and transaction data.');
   action=bi('比较素材表现，用点击与成交记录说明投放调整。','Compare creative performance and explain placement adjustments using click and transaction records.');
   purpose=bi('为素材或预算调整提供可核对的依据。','Provide a checkable basis for creative or budget adjustments.');
   example=bi('例如，一组素材点击高但成交少，先比较统计口径与转化环节，再提出调整。','For example, a creative gets many clicks but few transactions; compare metric definitions and conversion stages before proposing a change.');
  }
  return {...item,object,action,purpose,scenario:{kind:'hypothetical',text:example}};
 });
 const evaluation=domain==='evaluation';
 d.sociologyConceptId='classification';
 d.sociologySummary=evaluation?bi('把内容判断写成规则，再从人机分歧中修改规则。','Turn content judgments into rules, then revise those rules through human–machine disagreement.'):bi('广告数据把素材选择变成可以核对的投放判断。','Ad data make creative choices into checkable placement judgments.');
 d.preparation={competencies:[],materials:[evaluation?
  bi('用一组自拟答案写出评分规则，并记录一个人工与机评分歧案例。','Write a rubric for a small set of invented answers and record one human–machine disagreement.'):
  bi('用一组虚构点击与成交数据写出素材对比和调整建议，并保留计算口径。','Use invented click and transaction data to compare creatives and propose an adjustment, retaining calculation definitions.')],practice:[evaluation?
  {question:bi('同一答案人工与机评不一致，先检查什么？','What would you check first when human and machine judgments disagree?'),approach:bi('固定答案，比较引用、完整性等判定标准，再定位分歧来自规则还是执行。','Hold the answer fixed, compare criteria such as citations and completeness, and locate whether the disagreement concerns rules or their application.')}:
  {question:bi('素材点击率提高，但成交没有增长，如何复盘？','How would you review a creative with more clicks but no increase in sales?'),approach:bi('先核对统计窗口与口径，再分开检查素材和转化环节，不把点击直接当作成交。','Check time windows and definitions, then inspect creative and conversion stages separately; do not treat clicks as sales.')} ]};
 d.preparation.materials.push(evaluation?
  bi('用自拟检索片段做一张答案问题定位表，注明哪些判断还缺材料。','Create an answer-diagnosis sheet using invented retrieval excerpts and mark where evidence is missing.'):
  bi('做一页素材设计练习，说明目标人群与需要验证的差别。','Prepare a one-page creative exercise identifying its audience and differences to test.'));
 d.preparation.practice.push(evaluation?
  {question:bi('答案引用了旧版说明，如何查清错误发生在哪一步？','An answer cites an old instruction sheet. How would you locate the error?'),approach:bi('比较检索片段与答案，再检查版本日期。','Compare the retrieved excerpts with the answer, then check version dates.')}:
  {question:bi('两组素材的点击不同，怎样决定下一步测试？','Two creatives receive different click rates. How would you choose the next test?'),approach:bi('核对受众与曝光差别，再定义要验证的素材差异。','Check audience and exposure differences, then define the creative difference to test.')});
 return result;
}
