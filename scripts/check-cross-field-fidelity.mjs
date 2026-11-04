import assert from 'node:assert/strict';
import {analysisFidelityErrors,bilingualBoundaryErrors} from '../lib/analysis-fidelity.ts';

// Run without compiling or writing generated files:
// node --experimental-strip-types scripts/check-cross-field-fidelity.mjs
const bi=(zh='',en='')=>({zh,en});
const make=()=>({
 headline:bi('协调客户工作。','Coordinate customer work.'),role:bi('跟进客户任务。','Follow up customer tasks.'),
 terms:[{term:'沟通',meaning:bi('沟通用于确认任务。','Communication confirms tasks.'),quote:'沟通',alternative:bi(),question:bi()}],
 sociology:bi('任务通过记录交接。','Tasks are handed over through records.'),conditions:[],questions:[],gaps:[],comparisons:[],
 depth:{protocol:'work-language-v2',basis:'model',workMap:{object:bi(),tools:bi(),partners:bi(),authority:bi(),quotes:[]},deliverables:[],example:null,sociologyQuotes:[]}
});
const checks=[];
function check(name,raw,mutate,expectedPaths=[]){
 const result=make();mutate(result);const errors=analysisFidelityErrors(result,raw);
 assert.equal(errors.length>0,expectedPaths.length>0,`${name}: ${JSON.stringify(errors)}`);
 for(const path of expectedPaths)assert.ok(errors.some(error=>error.startsWith(`${path}:`)),`${name}: missing ${path}; ${JSON.stringify(errors)}`);
 assert.ok(errors.every(error=>/^[a-zA-Z]+(?:\.[a-zA-Z]+|\[\d+\])*(?:\.[a-zA-Z]+)?: /.test(error)),`${name}: missing field path`);
 checks.push({name,flagged:errors.length>0});
}

// Preserve the 18 source-aligned boundary behaviors used by R3.
const boundaryCases=[
 ['minimum','3年以上经验','至少3年经验','At least three years of experience.',false],
 ['minimum prefix mismatch','3年以上经验','至少3年经验','Over three years of experience.',true],
 ['spelled minimum','三年以上经验','至少三年经验','More than three years of experience.',true],
 ['preferred minimum','实习五个月以上优先','实习至少五个月优先','Over five months preferred.',true],
 ['correct maximum','45岁以内','最多45岁','Age 45 or under.',false],
 ['age with years','45岁以内','45岁以内','Under 45 years old.',true],
 ['bare age','45岁以内','45岁以内','Under 45.',true],
 ['explicit age','45岁以内','45岁以内','Under age 45.',true],
 ['maximum duration','单次1个月内','单次最多1个月','Under one month per trip.',true],
 ['correct duration','单次1个月内','单次最多1个月','Within one month per trip.',false],
 ['typing','打字60字/分钟','打字60字/分钟','Typing 60 words/characters per minute.',true],
 ['correct typing','打字60字/分钟','打字60字/分钟','Typing 60 characters per minute.',false],
 ['negation','3年以上经验','至少3年经验','No more than three years of experience.',false],
 ['no source match','相关经验','至少3年经验','Over three years of experience.',false],
 ['different duration','3年以上经验','至少4年经验','Over four years of experience.',false],
 ['strict source','经验超过3年','3年以上经验','Over three years of experience.',false],
 ['split digit guard','45岁以内','45岁以内','Under age 145.',false],
 ['ambiguous gloss','45岁以内','45岁以内','Under/within age 45.',true],
];
for(const [name,raw,zh,en,expected] of boundaryCases)assert.equal(bilingualBoundaryErrors([bi(zh,en)],raw).length>0,expected,name);

for(const key of ['headline','role','sociology'])check(`inclusive minimum in ${key}`,'3年以上经验',r=>r[key]=bi('至少3年经验','Over three years of experience.'),[`${key}.en`]);
check('inclusive minimum in term meaning','3年以上经验',r=>r.terms[0].meaning=bi('至少3年经验','Over three years of experience.'),['terms[0].meaning.en']);
check('inclusive minimum in conditions','3年以上经验',r=>r.conditions=[bi('至少3年经验','Over three years of experience.')],['conditions[0].en']);
for(const key of ['object','tools','partners','authority'])check(`inclusive minimum in work map ${key}`,'3年以上经验',r=>r.depth.workMap[key]=bi('至少3年经验','Over three years of experience.'),[`depth.workMap.${key}.en`]);
check('inclusive minimum correctly translated across fields','3年以上经验',r=>{r.role=bi('至少3年经验','At least three years of experience.');r.conditions=[r.role];});

const durationSource='任职要求：5年以上电商运营经验；2年以上项目管理工作经验；一年及以上直播运营经验。';
check('T097 duration becomes count',''+durationSource,r=>r.conditions=[bi('至少5年电商、2年项目、1年直播。','At least five years commerce, two projects and one livestream year.')],['conditions[0].en']);
check('project duration in term meaning',durationSource,r=>r.terms[0].meaning=bi('至少2年项目管理工作经验。','At least two projects.'),['terms[0].meaning.en']);
check('project duration correctly translated',durationSource,r=>r.conditions=[bi('至少2年项目管理经验。','At least two years of project management experience.')]);
check('both two years and two projects are legitimate','2年以上项目管理经验，并负责过2个完整整车项目。',r=>r.conditions=[bi('至少2年项目管理，至少2个完整项目。','At least two years of project management and two completed projects.')]);
check('source also gives count so do not infer substitution','2年以上项目管理经验，并负责过2个完整整车项目。',r=>r.conditions=[bi('至少2年项目管理，至少2个项目。','At least two projects.')]);
check('matching years in English avoid substitution inference',durationSource,r=>r.conditions=[bi('至少2年项目管理。','At least two years of project management and two projects.')]);
check('duration source must match','3年以上项目管理经验。',r=>r.conditions=[bi('至少2年项目管理。','At least two projects.')]);
check('Chinese duration must match',durationSource,r=>r.conditions=[bi('至少3年项目管理。','At least three projects.')]);
check('no unsupported general translation judge',durationSource,r=>r.conditions=[bi('至少2年客户管理。','At least two projects.')]);

const historySource='岗位职责：搭建并管理运营团队，明确分工与考核。岗位要求：具备团队管理经验（3人以上团队），擅长团队激励。';
check('T062 past size becomes current role',historySource,r=>r.role=bi('制定策略并管理至少三人的团队。','Set strategy and manage a team of at least three.'),['role.zh','role.en']);
check('past size becomes English headline only',historySource,r=>r.headline=bi('制定运营策略。','Manage a three-person team.'),['headline.en']);
check('historical qualification remains historical',historySource,r=>{r.role=bi('具有管理至少三人团队的经验。','Experience managing a team of at least three.');r.conditions=[r.role];});
check('current size explicitly advertised',`${historySource}当前团队规模为3人。`,r=>r.role=bi('管理至少三人的团队。','Manage a team of at least three.'));
check('current size with muqian wording',`${historySource}目前团队规模为3人。`,r=>r.role=bi('管理至少三人的团队。','Manage a team of at least three.'));
check('different current size can support weaker lower bound',`${historySource}目前团队规模为4人。`,r=>r.role=bi('管理至少三人的团队。','Manage a team of at least three.'));
check('unqualified source size leaves scope ambiguous','负责管理3人团队。具备团队管理经验（3人以上团队）。',r=>r.role=bi('管理三人团队。','Manage a team of three.'));
check('current size omission is not a current size claim',historySource,r=>r.role=bi('当前团队规模未说明，不能认定管理三人团队。','The current size is not specified; it does not establish a team of three.'));
check('other numbers are outside this leakage rule',historySource,r=>r.role=bi('管理四人团队。','Manage a team of four.'));
check('negative current size assertion is not leakage',historySource,r=>r.role=bi('并非当前管理三人团队。','Does not manage a team of three.'));

const languageSource='精通至少一门编程语言，包括但不限于：Java、Kotlin、C++、C#。';
check('T228 closed language list',languageSource,r=>r.conditions=[bi('至少一门所列语言。','At least one listed language.')],['conditions[0].zh','conditions[0].en']);
check('non-exhaustive list preserved',languageSource,r=>r.conditions=[bi('至少一门编程语言，包括但不限于Java等。','At least one programming language, including but not limited to Java.')]);
check('listed examples allow other languages',languageSource,r=>r.conditions=[bi('至少一门所列语言或其他编程语言。','At least one listed language or another programming language.')]);
check('closed source list is not broadened by guard','精通至少一门所列编程语言：Java、Kotlin。',r=>r.conditions=[bi('至少一门所列语言。','At least one listed language.')]);
check('no language-list source alignment','熟悉编程。',r=>r.conditions=[bi('至少一门所列语言。','At least one listed language.')]);

check('duplicate terms ignore whitespace and case','SQL',r=>r.terms=[{...r.terms[0],term:' SQL '},{...r.terms[0],term:'s q l'}],['terms[1].term']);
check('duplicate Chinese terms ignore whitespace','沟通',r=>r.terms.push({...r.terms[0],term:'沟 通'}),['terms[1].term']);
check('distinct terms remain distinct','沟通与沟通协调',r=>r.terms.push({...r.terms[0],term:'沟通协调'}));

check('questions possible answers quotes examples and proposals are excluded',`${historySource}3年以上项目管理经验。${languageSource}`,r=>{
 const invented=bi('至少3年项目管理并管理三人团队。','Over three years and three projects; manage a team of three.');
 r.questions=[invented];r.terms[0].quote='3年以上项目管理经验';r.terms[0].alternative=invented;
 r.depth.workMap.quotes=['3年以上项目管理经验'];r.depth.sociologyQuotes=['3年以上项目管理经验'];
 r.depth.example={kind:'hypothetical',scenario:invented,steps:[invented,invented],lesson:invented};
 r.depth.deliverables=[{task:invented,quote:'3年以上项目管理经验',output:invented,check:invented}];
 r.depth.questionTests=[{questionIndex:0,answers:[{answer:invented,changes:invented}]}];
});
check('explicit hypothetical numbers inside fact field are excluded','3年以上项目管理经验。',r=>r.role=bi('假设要求至少3年项目管理。','Suppose it requires over three years and three projects.'));
check('conditional example with ruo is excluded',historySource,r=>r.role=bi('若管理三人团队，需核对资源。','If managing a team of three, check resources.'));
check('actual assertion before example is still checked','3年以上经验。',r=>r.role=bi('至少3年经验。假设另有五年要求。','Over three years of experience. Suppose another five-year requirement.'),['role.en']);
check('income ambiguity is not a regular-expression verdict','管理客户资金规模和产品营收。',r=>r.role=bi('提升客户营收。','Grow client revenue.'));
check('degree convention is outside this guard','本科以上学历。',r=>r.conditions=[bi('本科以上学历。',"Bachelor's degree or above.")]);
check('technical compression is outside this guard','1年及以上电装焊接或精密机械装配实操经验。',r=>r.conditions=[bi('至少1年焊接或装配。','At least one year welding or assembly.')]);
check('old v2 without depth remains accepted','沟通协调。',r=>{delete r.depth;});

console.log(JSON.stringify({passed:true,boundary_checks:boundaryCases.length,cross_field_checks:checks.length,total:boundaryCases.length+checks.length,flagged_controls:checks.filter(check=>check.flagged).length,scope:'Known source-aligned literal patterns only; ambiguous subjects, degree conventions, specialist omissions and mechanism quality are not judged. Conservative exemptions can leave unsupported or omitted facts undetected.',live_api_calls:0},null,2));
