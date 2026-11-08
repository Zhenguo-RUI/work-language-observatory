// Scope tests for an offline prompt candidate; no provider calls.
import assert from 'node:assert/strict';
import {selectDomain,DOMAIN_AI} from '../docs/prompts/candidates/concise-v1.mjs';
const cases = [
 ['AI Agent','工具调用','ai-evaluation'],
 ['评测','大模型答案一致率','ai-evaluation'],
 ['来料检验','产品质量评估',null],
 ['产品经理','采购审批工具',null],
 ['数据工程','SQL与数据质量测试',null],
];
for(const [title,raw,expected] of cases) assert.equal(selectDomain(title,raw),expected);
assert([...DOMAIN_AI].length>=200 && [...DOMAIN_AI].length<=400);
console.log(`Passed ${cases.length} domain-selection cases and the 200–400 character limit.`);
