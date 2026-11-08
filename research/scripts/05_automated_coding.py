#!/usr/bin/env python3
"""Local rules + separately recorded AI review. No API calls or human labels.

prepare -> inspect development -> freeze codebook -> run -> record AI review -> summarize.
Public outputs contain aggregates only. All occurrence text/IDs remain private.
"""
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import subprocess
import unicodedata

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / 'research/private/automated-coding-v1'
TERMS = ['独立','抗压','沟通','责任心','主动','闭环']
SEED = 20261109
INPUT = ROOT / 'research/private/corpus-2000.private.json'
EXPECTED = 'ae247a10263b905b59f62a0fa82559257e3998ccb7f43f775177b12a740c7ef3'
SPLIT = re.compile(r'[。;；!?！？\r\n]+|(?<![A-Za-z0-9])(?:[0-9]{1,2}|[一二三四五六七八九十]{1,3})[、．.](?!\d)')

def sha(x): return hashlib.sha256(x if isinstance(x, bytes) else x.encode()).hexdigest()
def dump(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2)+'\n')
def norm(t): return unicodedata.normalize('NFKC', t).casefold()
def clauses(body): return [x.strip(' \t,，:：') for x in SPLIT.split(norm(body)) if x.strip(' \t,，:：')]
def occurrences(rows):
    result=[]
    for row in rows:
        ss=clauses(row['body'])
        for i, s in enumerate(ss):
            for term in TERMS:
                if term in s:
                    result.append({'occurrence_id':sha(f"05|{row['id']}|{i}|{term}"), 'record_id':row['id'],
                      'term':term,'source':row['platform'],'title':row.get('title',''), 'clause_index':i,
                      'focal':s,'before':ss[i-1] if i else '', 'after':ss[i+1] if i+1<len(ss) else '',
                      'body':row['body'],'window':'；'.join(ss[max(0,i-1):i+2])})
    return result
def sample(records, purpose, n):
    return sorted(records,key=lambda r:sha(f"{SEED}|{purpose}|{r['occurrence_id']}"))[:n]
def prepare():
    raw=INPUT.read_bytes()
    assert sha(raw)==EXPECTED
    rows=json.loads(raw)['records']; assert len(rows)==2000
    records=occurrences(rows)
    dev=[]; review=[]; sampling=[]
    for term in TERMS:
        frame=[r for r in records if r['term']==term]
        dd=sample(frame,'development',10); excluded={r['occurrence_id'] for r in dd}
        rr=[r for r in frame if r['occurrence_id'] not in excluded]
        selected=sample(rr,'review',20)
        for k,r in enumerate(dd): r['development_key']=term+str(k+1).zfill(2)
        for k,r in enumerate(selected): r['review_key']=term+str(k+1).zfill(2)
        dev+=dd; review+=selected
        sampling.append({'term':term,'all_occurrences':len(frame),'development_n':len(dd),
                         'remaining_frame_n':len(rr),'review_n':len(selected),
                         'review_inclusion_probability':len(selected)/len(rr) if rr else None})
    for name,data in [('occurrences.json',records),('development.json',dev),('review-input.json',review),('sampling.json',sampling)]:
        path=PRIVATE/name
        if path.exists(): assert json.loads(path.read_text())==data, 'Frozen sample changed'
        else: dump(path,data)
    print(json.dumps(sampling,ensure_ascii=False))

# Frozen after reading the 60 development contexts, before review labels.
NONPERSON = r'独立站|独立法人|独立品牌|独立公司|独立账户|独立核算|主动安全|主动降噪|主动悬架|主动雷达|闭环控制|闭环电流|闭环系统|闭环算法|闭环体验|闭环生态'
ABILITY = r'能力|具备|具有|熟悉|熟练|善于|擅长|经验|意识|思维|素质|精神|性格|责任心|抗压|积极主动|主动积极|能够|可以独立|能独立|沟通力|沟通技巧'
PARTNERS = r'客户|顾客|用户|供应商|经销商|代理商|渠道商|合作伙伴|合作方|甲方|乙方|业主|候选人|面试官|司机|学生|患者|审计机构|税务顾问|上级|主管|下属|学员|采集员|操作者|研发团队|算法团队|测试团队|财务部门|采购部门|质量部门|销售团队|运营团队|设计团队|客服团队|技术团队|产品团队|研发部门|生产部门|人事部门|行政部门|法务部门'
BROAD = r'团队|跨部门|各部门|各方|相关人员|跨团队|同事'
RESULT = r'对[^。；;]{0,35}(?:结果|质量|指标|业绩|收入|利润|成本|交付|转化|roi|达成)[^。；;]{0,10}负责|确保[^。；;]{2,45}|保证[^。；;]{2,45}|(?:达成|完成|实现)[^。；;]{0,22}(?:目标|指标)|(?:按时|按期|准时|保质|保量)[^。；;]{0,16}(?:交付|完成)|(?:推动|推进|跟踪|跟进|落实|完成|实现)[^。；;]{0,24}闭环|闭环(?:处理|整改)|(?:跟进|跟踪)[^。；;]{0,22}(?:关闭|解决完毕)|(?:负责|承担)[^。；;]{0,24}(?:最终结果|交付结果|达成率)'
AUTHORITY = r'(?:决定|决策|审批|批准|裁定)[^。；;]{0,20}(?:预算|标准|人员|优先级|例外|方案|费用|采购|资源)|(?:制定|确定|调整)[^。；;]{0,16}(?:预算|标准|优先级|人员分工|排班)|有权[^。；;]{2,25}|自主决定[^。；;]{2,25}'
LIMIT = r'(?:需|须|必须|经过|经)[^。；;]{0,15}(?:审批|批准)|不得自行|无权决定|材料报批|报请[^。；;]{0,12}(?:批准|审批)'
PEOPLE = r'(?:管理|带领|带教|培训|考核|监督|激励)[^。；;]{0,12}(?:下属|员工|成员)|(?:下属|员工|成员)[^。；;]{0,12}(?:分工|绩效考核|排班|工作安排)|(?:团队|人员)[^。；;]{0,8}(?:搭建|建设|管理|分工|排班)|(?:带领|管理)[^。；;]{0,8}团队'
DUTY = r'负责|承担|编写|制作|开发|设计|维护|执行|完成|处理|组织|开展|跟进|分析|实施|制定|推进'
FUNCTIONS = {
 'technical_rd':r'软件|算法|硬件|研发|测试|开发工程|嵌入式|运维|芯片|电路|机器人|机械设计|电气',
 'product':r'产品经理|产品专员|产品策划|产品助理|产品总监|prd|原型设计|需求文档',
 'operations':r'运营|编导|内容创作|直播|新媒体|短视频|文案|策划',
 'sales_customer':r'销售|客户经理|客服|售后|商务拓展|招商|导购|外贸|渠道',
 'organizational_support':r'财务|会计|出纳|人力|人事|招聘|行政|法务|采购|秘书|审计',
 'production_manufacturing':r'生产|制造|车间|产线|加工|装配|质检|品控|工艺|操作工',
 'everyday_services':r'餐饮|厨师|保洁|家政|酒店前台|服务员|奶茶|咖啡',
 'other':r'教师|医生|护士|施工|建筑|物流|运输|司机|咨询顾问'}

def functional_candidate(row):
    hits=[k for k,v in FUNCTIONS.items() if re.search(v,norm(row['title']))]
    if len(hits)==1: return {'primary':hits[0], 'basis':'title_keyword_candidate','alternatives':hits}
    if len(hits)>1: return {'primary':None,'basis':'multiple_title_candidates','alternatives':hits}
    bodyhits=[k for k,v in FUNCTIONS.items() if re.search(v,norm(row['body']))]
    return {'primary':bodyhits[0] if len(bodyhits)==1 else None,
            'basis':'single_body_candidate' if len(bodyhits)==1 else 'ambiguous_or_unmatched','alternatives':bodyhits}

def role_candidate(row):
    ss=clauses(row['body']); people=[]; individual=[]
    for s in ss:
        if re.search(PEOPLE,s) and not re.search(r'经验|能力|优先|具备|具有',s): people.append(s)
        elif re.search(DUTY,s) and not re.search(r'经验|能力|优先|具备|具有',s): individual.append(s)
    return {'role':'mixed' if people and individual else 'explicit_people_management' if people else 'individual_tasks' if individual else 'unclear',
            'management_evidence':people,'individual_evidence':individual}

def code(row):
    f,w=row['focal'],row['window']
    d1='C' if re.search(NONPERSON,f) else 'D' if ('薪资' in f or '工资' in f) and '独立上岗' in f else 'A' if re.search(ABILITY,f) else 'B'
    result={'D1':d1,'D3':None,'D3_broad':None,'D4':None,'D5':None,'evidence':{}}
    if d1 in ('A','B'):
        ps=list(re.finditer(PARTNERS,w))
        # In coordination syntax, enumerated functions denote counterpart roles.
        ps+=list(re.finditer(r'(?:与|协同|对接|联合|协作)[^。；;]{0,18}(?:研发|算法|测试|质量|生产|产品)[^。；;]{0,8}(?:部门|团队)',w))
        result['D3']=bool(ps); result['D3_broad']=bool(ps or re.search(BROAD,w))
        # Experience/knowledge of a result process is not current accountability.
        relevant=[s for s in [row['before'],f,row['after']] if not re.search(r'熟悉|经验|了解|意识|具备|具有|能力',s)]
        rr=[m.group() for s in relevant for m in re.finditer(RESULT,s)]
        result['D4']=bool(rr)
        # With a task-bearing focal clause, same-clause authority is a candidate
        # for same matter. Adjacent clauses require an exact shared noun cue.
        auth=[]; limited=[]
        taskwords=set(re.findall(r'预算|标准|人员|优先级|方案|费用|采购|资源|排班|设计|材料|项目|订单|产品|质量',f))
        for s in [row['before'],f,row['after']]:
            same=s==f or bool(taskwords & set(re.findall(r'预算|标准|人员|优先级|方案|费用|采购|资源|排班|设计|材料|项目|订单|产品|质量',s)))
            if not same: continue
            auth += [m.group() for m in re.finditer(AUTHORITY,s)]
            limited += [m.group() for m in re.finditer(LIMIT,s)]
        result['D5']='both' if auth and limited else 'yes' if auth else 'limited' if limited else 'not_stated'
        result['evidence']={'D3':[m.group() for m in ps],'D4':rr,'D5_yes':auth,'D5_limited':limited}
    return result

def run():
    assert sha(INPUT.read_bytes())==EXPECTED
    records=json.loads((PRIVATE/'occurrences.json').read_text())
    dev={r['occurrence_id'] for r in json.loads((PRIVATE/'development.json').read_text())}
    rows=json.loads(INPUT.read_text())['records']; ad={r['id']:r for r in rows}
    occupations={k:functional_candidate(v) for k,v in ad.items()}
    roles={k:role_candidate(v) for k,v in ad.items()}
    coded=[{**r,'development_excluded':r['occurrence_id'] in dev,'rule':code(r),
            'occupation_candidate':occupations[r['record_id']], 'role_candidate':roles[r['record_id']]} for r in records]
    dump(PRIVATE/'rule-coded.json',coded)
    print('Rule-coded occurrences:',len(coded),'development excluded:',len(dev))

def metric(pairs, values):
    matrix={a:{b:0 for b in values} for a in values}
    for rule,ai in pairs: matrix[ai][rule]+=1
    n=len(pairs); match=sum(a==b for a,b in pairs)
    f1=[]; per_class={}
    for c in values:
        tp=matrix[c][c]; fp=sum(matrix[a][c] for a in values if a!=c); fn=sum(matrix[c][a] for a in values if a!=c)
        if tp+fp+fn: f1.append(2*tp/(2*tp+fp+fn))
        per_class[str(c)]={'precision_against_ai':tp/(tp+fp) if tp+fp else None,
                          'recall_against_ai':tp/(tp+fn) if tp+fn else None,'support':tp+fn}
    return {'n':n,'agreement_n':match,'agreement_rate':match/n if n else None,
            'macro_f1_against_ai_observed_classes':sum(f1)/len(f1) if f1 else None,
            'matrix_rows_ai_columns_rules':matrix,'per_class':per_class}

def distribution(rows):
    eligible=[r for r in rows if r['rule']['D1'] in ['A','B']]; n=len(eligible)
    d3=sum(r['rule']['D3'] for r in eligible); d4=sum(r['rule']['D4'] for r in eligible)
    d5=sum(r['rule']['D5'] in ['yes','both'] for r in eligible)
    return {'n_occurrences':len(rows),'d1':dict(Counter(r['rule']['D1'] for r in rows)),
      'eligible_person_or_work_n':n,'d3_named_role_n':d3,'d3_broad_role_n':sum(r['rule']['D3_broad'] for r in eligible),
      'd4_result_n':d4,'d5_authority_n':d5,'d5_limited_n':sum(r['rule']['D5'] in ['limited','both'] for r in eligible),
      'd3_rate':d3/n if n>=30 else None,'d4_rate':d4/n if n>=30 else None,'d5_rate':d5/n if n>=30 else None,
      'd4_minus_d5':(d4-d5)/n if n>=30 else None,'small_group_suppressed':n<30}

def summarize():
    assert sha(INPUT.read_bytes())==EXPECTED
    records=json.loads((PRIVATE/'rule-coded.json').read_text())
    rr=[r for r in records if not r['development_excluded']]
    labels=json.loads((PRIVATE/'ai-review.json').read_text())
    review=json.loads((PRIVATE/'review-input.json').read_text())
    expected={r['review_key']:r for r in review}; actual={x['review_key']:x for x in labels['labels']}
    assert len(labels['labels'])==len(actual)==len(expected)==120
    assert set(expected)==set(actual)
    ruleby={r['occurrence_id']:r['rule'] for r in records}
    comparisons={}; failures=Counter(); reasons=[]
    discrepancies=[]
    # These are post-review diagnostic categories, not a tuned replacement rule.
    categories=json.loads((PRIVATE/'failure-categories.json').read_text())
    category_counts=Counter()
    for dimension,values in [('D1',['A','B','C','D']),('D3',[False,True]),('D4',[False,True]),('D5',['yes','limited','both','not_stated'])]:
        pairs=[]
        for key,x in actual.items():
            ai=x[dimension]; rule=ruleby[expected[key]['occurrence_id']][dimension]
            assert isinstance(x.get('reason'),str) and x['reason']
            if ai is None or rule is None: continue
            assert ai in values and rule in values
            pairs.append((rule,ai))
            if ai!=rule:
                failures[dimension]+=1
                category=categories[key][dimension]
                category_counts[category]+=1
                discrepancies.append({'review_key':key,'dimension':dimension,'rule':rule,'ai':ai,'category':category,'reason':x['reason']})
        comparisons[dimension]=metric(pairs,values)
    authority_pairs=[(ruleby[expected[key]['occurrence_id']]['D5'],x['D5']) for key,x in actual.items()
                     if x['D5'] is not None and ruleby[expected[key]['occurrence_id']]['D5'] is not None]
    authority_positive_n=sum(ai in ['yes','both'] for rule,ai in authority_pairs)
    authority_positive_caught_n=sum(ai in ['yes','both'] and rule in ['yes','both'] for rule,ai in authority_pairs)
    by_term={term:distribution([r for r in rr if r['term']==term]) for term in TERMS}
    h1={t:{'rule_distribution':by_term[t], 'status':'descriptive_rule_flags_not_hypothesis_test'} for t in ['抗压','沟通','责任心']}
    h2={t:{'rule_distribution':by_term[t], 'status':'descriptive_rule_flags_not_hypothesis_test'} for t in ['独立','主动','闭环']}
    h3={}
    for t in ['独立','主动','闭环']:
        selected=[r for r in rr if r['term']==t]
        groupcounts=Counter(r['role_candidate']['role'] for r in selected)
        common={}
        for fun in FUNCTIONS:
            groups={role:distribution([r for r in selected if r['occupation_candidate']['primary']==fun and r['role_candidate']['role']==role]) for role in ['individual_tasks','explicit_people_management']}
            if all(g['eligible_person_or_work_n']>=30 for g in groups.values()): common[fun]=groups
        h3[t]={'role_candidate_counts':dict(groupcounts),'eligible_common_function_strata':common,
               'status':'not_estimated_unvalidated_role_mapping_and_insufficient_common_support' if not common else 'not_estimated_unvalidated_role_mapping',
               'mixed_not_merged':True}
    result={'schema_version':'wlo-automated-coding-v1','date':'2026-11-09','input_sha256':EXPECTED,
      'corpus_ads':2000,'all_occurrences':len(records),'development_excluded_n':len(records)-len(rr),'analysis_occurrences':len(rr),
      'method':'Deterministic regex candidate coding of six terms; actual independent-label AI reading of 120 held-out occurrences in the existing conversation; not a 2,000-document LLM coding run.',
      'human_gold_standard_n':0,'human_evaluation':False,'dsl_estimation':False,
      'sampling':json.loads((PRIVATE/'sampling.json').read_text()),'by_term':by_term,
      'H1':h1,'H2':h2,'H3':h3,'rule_vs_ai_review':comparisons,'disagreement_counts':dict(failures),
      'failure_types':dict(category_counts),
      'authority_review_diagnostic':{'ai_positive_n':authority_positive_n,'rule_caught_n':authority_positive_caught_n,
          'recall_against_ai':authority_positive_caught_n/authority_positive_n if authority_positive_n else None,
          'rule_rejected_for_H2':True},
      'release_decision':{'D1':'candidate_only','D3':'descriptive_rule_flags_with_sensitivity','D4':'candidate_only',
          'D5':'not_fit_for_semantic_prevalence_or_H2_due_to_missed_positive_AI_cases','H1':'not_validated','H2':'not_validated','H3':'not_estimated'},
      'limits':['AI reader is not a human expert or gold standard; shared model/rule-author background may correlate errors.',
      'All rates describe automatic text flags in this fixed archive, not validated semantic prevalence or the job market.',
      'Review has equal allocation by term, unequal selection probabilities; pooled agreement is a sample diagnostic, not population accuracy.',
      'D3 and D4 use the focal clause plus immediate neighbors; D5 lexical same-matter linkage is approximate.',
      'Not stated describes text, never actual lack of authority. No inferential confidence intervals or final hypothesis verdicts.']}
    dump(PRIVATE/'disagreements.json',discrepancies)
    dump(ROOT/'research/aggregates/automated-coding.json',result)
    files=['research/scripts/05_automated_coding.py','research/codebook/automated-v1.md','research/config/prompts/automated-review-v1.md']
    dump(ROOT/'research/logs/05-automated-coding.json',{'date':'2026-11-09','git_head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
      'input_sha256':EXPECTED,'file_sha256':{p:sha((ROOT/p).read_bytes()) for p in files},
      'review_input_sha256':sha((PRIVATE/'review-input.json').read_bytes()),'review_labels_sha256':sha((PRIVATE/'ai-review.json').read_bytes()),
      'failure_categories_sha256':sha((PRIVATE/'failure-categories.json').read_bytes()),
      'model':labels['model'],'temperature':None,'temperature_note':'Existing conversational session; not controlled or recorded by agent',
      'api_calls_by_script':0,'reviewed_occurrences':120,'human_records_written':0,
      'stage_order':['60 development contexts read','rules and review instructions frozen','all occurrence rules run','120 independent AI labels read and saved without per-item rule output','comparison computed'],
      'public_outputs':['research/aggregates/automated-coding.json'],'private_outputs':['rule-coded.json','ai-review.json','development.json','review-input.json']})
    print(json.dumps({'by_term':by_term,'agreement':{k:{a:v[a] for a in ['n','agreement_n','agreement_rate']} for k,v in comparisons.items()},'H3':h3},ensure_ascii=False))

if __name__=='__main__':
    p=argparse.ArgumentParser(); p.add_argument('--prepare',action='store_true'); p.add_argument('--run',action='store_true'); p.add_argument('--summarize',action='store_true'); args=p.parse_args()
    if args.prepare: prepare()
    if args.run: run()
    if args.summarize: summarize()
