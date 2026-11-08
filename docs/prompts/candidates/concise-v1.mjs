// Offline candidate only. Production still uses work-language-v11.
// Reuses its evidence contract and checked references; changes prose allocation.
export const DOMAIN_AI = `AI 与评测领域说明：只在原文明确涉及大模型、生成式AI或模型评测时使用。把问题、实际检索材料、答案中的主张和评分规则分开检查；没有运行记录不能推断模型看过什么。错误可能来自来源、检索、答案、标注或评审规则，也可能暂时无法定位。一致率只表示判断相同，不证明正确。消融只移除或关闭已有组件，同时固定其他条件；替换组件要另称比较。随机输出的比较需固定版本并重复运行，观察波动。类别层级与单选多选不是同一件事。原文同时要求修复产品和校准评测时，两者都保留，不能只改评分标准。工具调用不等于工具开发，实习生参与优化不表示其能独立发布。PE只在大模型内容语境中暂按提示词设计理解，保留缩写未展开的边界。以上是可选方法，不能增加雇主要求。`;
export function selectDomain(title, raw) {
  return /大模型|生成式\s*AI|LLM|\bRAG\b|模型评测|模型评估|\bAI\s+(?:agent|evaluation)\b/i.test(`${title}\n${raw}`) ? 'ai-evaluation' : null;
}
export function createBase(baseline) {
  let text = baseline;
  const replace = (from, to) => { if (!text.includes(from)) throw Error('Candidate baseline anchor missing'); text = text.replace(from, to); };
  replace('One brief wording example:', 'One brief wording example:');
  text = text.replace(/One brief wording example:[^\n]+/, 'Two wording examples from different occupations: “按已公布的轮班表接班，发现缺岗后确认当班安排” / “Follow the published rota and confirm coverage when a shift is short.” “对照订单与来料标签，标出型号不符的批次” / “Compare the order with incoming labels and flag a mismatched batch.” These illustrate plain verbs, not duties to insert into another job.');
  text = text.replace('For agreement analysis, “the same answer beside its machine score and human score” explains more than “machine evaluation and annotation”. ', '');
  const start=text.indexOf('A category hierarchy differs');
  const end=text.indexOf('Use depth.example=null',start);
  if(start<0||end<0)throw Error('AI domain block not found');
  text=text.slice(0,start)+text.slice(end);
  text=text.replace(/ For 调PE[^\n]+/, '');
  text=text.replace(/ In evaluation disagreements,[^\n]+?Do not invent experience\./, ' Do not invent experience.');
  text=text.replace('Use 3–4 concise competency rows where adequate.', 'Use only distinct advertised competency rows; one or two may be enough.');
  text=text.replace('In depth.preparation.materials give TWO complementary small work samples for a detailed JD:', 'In depth.preparation.materials give one useful small work sample; add a second only for a genuinely separate, well-supported skill:');
  text=text.replace('depth.preparation.practice contains TWO concrete business questions.', 'depth.preparation.practice normally contains ONE concrete business question; a second needs a distinct supported challenge.');
  text=text.replace('terms: normally TWO useful expressions, fewer for sparse text;', 'terms: one useful expression is sufficient; use two only when they explain different requirements;');
  const budgetStart=text.indexOf('Aim for 1,400–1,900');
  const budgetEnd=text.indexOf('Before returning,',budgetStart);
  if(budgetStart<0||budgetEnd<0)throw Error('Length block not found');
  text=text.slice(0,budgetStart)+`Choose space from the source's informational content, never from the number of schema fields. A sparse JD gives only broad duties without concrete inputs, procedures or outputs. Aim for 550–850 authored Chinese characters for it; a detailed JD usually needs 1,000–1,400. These are editing targets, not permission to omit advertised duties, conditions, alternatives or qualifications. English must preserve exactly the same content.
For sparse text use one or two duty groups, one term, one consequential question, at most one preparation material and one practice question. Empty materials/practice arrays are valid when they would only invent work. All required objects and bilingual strings remain present; empty optional sections use their existing allowed values. Never invent employer paperwork to make a physical service task look concrete. The proposed result may simply be a completed physical task. Each action, scene, purpose, output and check is one short sentence or phrase; do not turn it into a second workflow. Conditions preserve every important source condition even if that increases length.
Across all jobs, one practical scene per duty is enough; depth.example=null. Do not explain the same uncertainty in terms, duties, skills and questions. Use questions for uncertainty that affects a real decision, preparation for one achievable practice, and role for the job's scope. A sociological paragraph is optional and must add a supported mechanism, not merely a theory label. Omit it if that condition fails. Keep all existing source and bilingual checks.
`+text.slice(budgetEnd);
  return text;
}
export function instructionsFor(base, title, raw) {
  const domain=selectDomain(title,raw);
  return {instructions:base+(domain?'\n# Selected domain\n'+DOMAIN_AI:''),domain};
}
