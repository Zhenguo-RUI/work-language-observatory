#!/usr/bin/env python3
"""Publish metadata and numeric comparisons, never evaluation source sentences."""
import json,statistics,argparse
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; PRIVATE=ROOT/'private/jd-eval'
def load(p):return json.loads(p.read_text())
def main(version):
 cases=[json.loads(s) for s in (PRIVATE/'set-v1.jsonl').read_text().splitlines()]
 old={c['id']:load(PRIVATE/'baseline-v11'/f"{c['id']}.json") for c in cases}
 new={c['id']:load(PRIVATE/version/f"{c['id']}.json") for c in cases if (PRIVATE/version/f"{c['id']}.json").exists()}
 review_path=PRIVATE/f'paired-{version}'/'summary.private.json'
 review=load(review_path) if review_path.exists() else {'rows':[],'pairs':[],'completed':0,'planned':40}
 pairs={p['id']:p for p in review['pairs']}
 dims=['忠实','具体','有用','不像模板','篇幅合适']; hard=['schema','quote_exact','bilingual']
 rows=[]
 for c in cases:
  i=c['id'];n=new.get(i);o=old[i]
  if not n:continue
  row={k:c[k] for k in ['id','split','family','difficulty']}
  for name,r in [('baseline',o),('candidate',n)]:
   row[name]={k:r[k] for k in ['accepted','elapsed_ms','call_count','retries']}
   row[name]['checks']={k:v for k,v in r['checks'].items() if k!='private_errors'}
   row[name]['tokens']={k:sum((call.get('usage') or {}).get(k,0) for call in r['calls']) for k in ['prompt_tokens','completion_tokens','total_tokens']}
  row['domain']=n.get('selected_domain');row['paired']=pairs.get(i)
  rows.append(row)
 groups={}
 for split in ['dev','holdout']:
  rr=[r for r in rows if r['split']==split];pp=[p for p in pairs.values() if p['split']==split]
  oo=[old[c['id']] for c in cases if c['split']==split]
  med={'baseline':statistics.median(r['elapsed_ms'] for r in oo),'candidate':statistics.median(r['candidate']['elapsed_ms'] for r in rr) if rr else None}
  evaluated=[p for p in pp if p['orders_completed']==2]
  agreement=sum(p['consistent'] for p in evaluated)/len(evaluated) if evaluated else None
  outcomes={v:sum(p['orders_completed']==2 and p['choice']==v for p in pp) for v in ['baseline','candidate','tie']}
  by_family={}
  for family in sorted({c['family'] for c in cases}):
   fp=[p for p in pp if p['family']==family and p['orders_completed']==2]
   by_family[family]={v:sum(p['choice']==v for p in fp) for v in ['baseline','candidate','tie']}
  comparisons={k:{'baseline':sum(bool(r['checks'].get(k)) for r in oo),'candidate':sum(bool(r['candidate']['checks'].get(k)) for r in rr)} for k in hard}
  completed=len(rr)==10 and len(pp)==10 and all(p['orders_completed']==2 for p in pp)
  gates={'complete':completed,'hard_checks_not_worse':all(v['candidate']>=v['baseline'] for v in comparisons.values()) if len(rr)==10 else None,
   'order_agreement_at_least_70pct':agreement>=.7 if len(evaluated)==10 else None,'wins_at_least_losses':outcomes['candidate']>=outcomes['baseline'] if len(evaluated)==10 else None,
   'no_family_all_losses':all(not v['baseline'] or v['candidate']+v['tie']>0 for v in by_family.values()) if len(evaluated)==10 else None,
   'median_not_over_20pct_slower':med['candidate']<=1.2*med['baseline'] if len(rr)==10 else None}
  groups[split]={'n':len(rr),'baseline_n':len(oo),'paired_cases':len(evaluated),'order_agreement':agreement,
   'outcomes':outcomes,'by_family':by_family,'hard_checks':comparisons,'median_ms':med,
   'latency_change_pct':100*(med['candidate']/med['baseline']-1) if med['candidate'] else None,'gates':gates,'gates_pass':all(gates.values())}
 safe_reviews=[]
 for r in review['rows']:
  j=r.get('judgment') or {};safe_reviews.append({k:r.get(k) for k in ['id','order','elapsed_ms','error','usage']}|{k:j.get(k) for k in ['scores','choice','biggest_difference']})
 result={'version':version,'baseline':'baseline-v11','synthetic_jds':20,'real_jds':0,'generation_completed':len(rows),
  'generation_calls':sum(r['candidate']['call_count'] for r in rows),'generation_tokens':{k:sum(r['candidate']['tokens'][k] for r in rows) for k in ['prompt_tokens','completion_tokens','total_tokens']},
  'review_completed':review['completed'],'review_planned':40,'review_tokens':{k:sum((r.get('usage') or {}).get(k,0) for r in review['rows']) for k in ['prompt_tokens','completion_tokens','total_tokens']},
  'manifest':load(PRIVATE/version/'manifest.json'),'review_manifest':review.get('manifest'),'groups':groups,'rows':rows,'reviews':safe_reviews,
  'holdout_gates_pass':groups['holdout']['gates_pass'],'production_changed':False,
  'raw_position_choices':{k:sum(r.get('choice')==k for r in safe_reviews) for k in ['甲','乙','平局']},
  'limits':['All cases are synthetic; no reader-utility or population validity claim.','Same-model independent-request review; no human scoring or independent ground truth.',
   'Each AB and BA judgment is a real request. Order disagreements count as ties.','No raw JD, generated prose or judge rationale is published.',
   'Single frozen candidate; no tuning using holdout cases. AI domain routing has unit cases but no AI-domain JD in this fixed evaluation set.']}
 out=ROOT/'docs/prompts/eval';(out/f'{version}.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 lines=[f'# {version} 离线候选评测','', '候选仍为离线实验，生产提示词未修改。20份均为合成JD，开发与留出各10份、各覆盖8类职能。', '',
  '基线完整运行后才编写本候选；仅参考开发组问题，候选冻结后未再修改。对同一对输出按甲乙、乙甲分别实际请求评分；不一致计平局。评审与生成均为DeepSeek Flash，独立提示词不能消除同模型偏差。', '',
  '修改范围：保留输出结构、证据与双语规则；减少短JD的重复模块，按信息密度分配篇幅；AI评测内容拆为313字领域说明，按关键词选择0–1份。领域选择有5个检查案例，但本固定集没有AI岗位，领域内容效果尚未实测。', '',
  f'已完成生成 {len(rows)}/20，提供方生成请求 {result["generation_calls"]}；实际比较评分 {review["completed"]}/40。', '']
 for split,g in groups.items():
  agreement_text=f'{g["order_agreement"]:.0%}' if g['order_agreement'] is not None else '未评测'
  lines += [f'## {split}', '', f'双顺序一致率 {agreement_text}；已完成比较中的候选胜 {g["outcomes"]["candidate"]}、平 {g["outcomes"]["tie"]}、负 {g["outcomes"]["baseline"]}。',
   f'生成中位耗时：基线 {g["median_ms"]["baseline"]} ms，候选 {g["median_ms"]["candidate"]} ms。', '',
   '| 职能 | 候选胜 | 平 | 负 |','| --- | --- | --- | --- |']
  for f,v in g['by_family'].items():lines.append(f'| {f} | {v["candidate"]} | {v["tie"]} | {v["baseline"]} |')
  lines += ['', '| 门槛 | 通过 |','| --- | --- |']
  for k,v in g['gates'].items():lines.append(f'| {k} | {v} |')
  lines += ['']
 lines += ['## 逐条长度与检查','', '中文字符统计覆盖全部中文字段，排除专用引用字段；它不是去重正文长度。', '',
  '| ID | 基线中文字符 | 候选中文字符 | 候选应用接受 | 引文/结构/双语 |', '| --- | --- | --- | --- | --- |']
 for r in rows:
  cc=r['candidate']['checks'];lines.append(f'| {r["id"]} | {r["baseline"]["checks"].get("authored_zh_characters")} | {cc.get("authored_zh_characters")} | {r["candidate"]["accepted"]} | {all(cc.get(k,False) for k in hard)} |')
 lines += ['', '上线判断仅使用留出组全部门槛；程序检查通过不等于解释正确。本报告不证明真实用户效用，也不用于CV或研究页。候选生成、双顺序评分的token实耗见同名JSON；未查询账单，不估算美元费用。']
 (out/f'{version}.md').write_text('\n'.join(lines)+'\n');print(json.dumps({'completed':len(rows),'review_completed':review['completed'],'holdout':groups['holdout']},ensure_ascii=False))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('version',nargs='?',default='concise-v1');main(p.parse_args().version)
