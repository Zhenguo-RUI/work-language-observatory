#!/usr/bin/env python3
"""Public, text-free report from locally saved synthetic live outputs."""
import json,statistics
from pathlib import Path
from collections import Counter
import argparse
ROOT=Path(__file__).resolve().parents[1]
PRIVATE=ROOT/'private/jd-eval'
def save(path,x):path.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def public_review(scores):
    """Never export model free-text reasons: they may quote the private inputs."""
    if scores is None:return None
    rows=[{k:r.get(k) for k in ['id','order','elapsed_ms','error','usage']}|{
        'scores':r.get('judgment',{}).get('scores')} for r in scores['rows']]
    valid=[r for r in rows if r.get('scores') and not r.get('error')]
    dimensions={}
    for dim in ['忠实','具体','有用','不像模板','篇幅合适']:
        values=[r['scores'][dim] for r in valid]
        dimensions[dim]={'n':len(values),'mean':statistics.mean(values) if values else None,
            'counts':{str(v):values.count(v) for v in [1,2,3]}}
    return {'manifest':scores['manifest'],'completed':scores['completed'],'planned':scores['planned'],
        'rows':rows,'dimensions':dimensions,'reasons':'Retained privately; no source sentences exported.',
        'usage_reported_calls':sum(bool(r.get('usage')) for r in rows),
        'tokens_reported':{k:sum((r.get('usage') or {}).get(k,0) for r in rows)
            for k in ['prompt_tokens','completion_tokens','total_tokens']}}
def main(version):
    folder=PRIVATE/version
    manifest=json.loads((folder/'manifest.json').read_text())
    cases=[json.loads(l) for l in (PRIVATE/'set-v1.jsonl').read_text().splitlines()]
    reports=[json.loads((folder/(c['id']+'.json')).read_text()) for c in cases if (folder/(c['id']+'.json')).exists()]
    scores_path=folder/'review.private.json'
    scores=public_review(json.loads(scores_path.read_text())) if scores_path.exists() else None
    rows=[]
    for r in reports:
        check={k:v for k,v in r['checks'].items() if k!='private_errors'}
        rows.append({k:r[k] for k in ['id','split','family','difficulty','elapsed_ms','call_count','retries','accepted','error']}|{'checks':check,
                    'usage':[c['usage'] for c in r['calls'] if c.get('usage')],
                    'diagnostics':r['diagnostics']})
    usages=[u for r in rows for u in r['usage']]
    token_totals={k:sum(u.get(k,0) for u in usages) for k in ['prompt_tokens','completion_tokens','total_tokens']}
    result={'version':version,'status':'complete_baseline' if len(rows)==20 else 'partial_baseline',
        'source':'20 independently authored synthetic JDs; no reader-consent records available locally; no research archive bodies used',
        'manifest':manifest,'planned':20,'completed':len(rows),'real_jds':0,'synthetic_jds':20,
        'accepted_n':sum(r['accepted'] for r in rows),'median_elapsed_ms':statistics.median(r['elapsed_ms'] for r in rows) if rows else None,
        'max_elapsed_ms':max((r['elapsed_ms'] for r in rows),default=None),'provider_calls':sum(r['call_count'] for r in rows),
        'retry_calls':sum(r['retries'] for r in rows),'rows':rows,'model_review':scores,
        'generation_usage_reported_calls':len(usages),'generation_tokens_reported':token_totals,
        'candidate_run':False,'pairwise_review_completed':False,'production_prompt_changed':False,
        'limitations':['Synthetic cases test specified failures, not representative real-reader utility.',
          'Programmatic contract acceptance does not establish semantic faithfulness.',
          'Scores are independent-request, same-model review, not human review or independent ground truth; no CV or research-page validity claim.',
          'Ordinal score means are descriptive; this single pass does not establish scorer reliability.',
          'Missing provider usage is null/unreported, not zero cost. No invoice cost was queried.']}
    output=ROOT/'docs/prompts/eval'/f'{version}.json'; save(output,result)
    lines=[f'# {version} 跨职能基线评测','',f'状态：{result["status"]}。合成案例20份，真实案例0份；完成{len(rows)}份。','',
      '当前仅建立生产提示词基线，未运行候选、未进行成对评审、未更改线上提示词。','',
      f'现有应用校验接受 {result["accepted_n"]}/{len(rows)}；实际提供方请求 {result["provider_calls"]} 次，其中重试/修复 {result["retry_calls"]} 次。',
      f'生成中位耗时 {result["median_elapsed_ms"]} ms；最大 {result["max_elapsed_ms"]} ms。token以同名JSON中提供方实际返回usage为准，账单金额未查询。','',
      '| ID | 分组 | 职能 | 应用接受 | 耗时ms | 调用数 | 硬项 |','| --- | --- | --- | --- | --- | --- | --- |']
    for r in rows:
        hard=all(r['checks'].get(k,False) for k in ['schema','quote_exact','bilingual'])
        lines.append(f'| {r["id"]} | {r["split"]} | {r["family"]} | {r["accepted"]} | {r["elapsed_ms"]} | {r["call_count"]} | {hard} |')
    if scores:
        lines += ['', f'已另行完成 {scores["completed"]}/{scores["planned"]} 次模型评分。评分者与生成者同为 DeepSeek Flash，使用独立请求和评审提示词，未引入独立模型或人类评分。', '',
            '| 维度（1–3分） | 均值 | 1分 | 2分 | 3分 |', '| --- | --- | --- | --- | --- |']
        for dim,d in scores['dimensions'].items():
            lines.append(f'| {dim} | {d["mean"]:.2f} | {d["counts"]["1"]} | {d["counts"]["2"]} | {d["counts"]["3"]} |')
        sparse=[r for r in rows if 'sparse' in r['difficulty']]
        lines += ['', '这些是单次、同模型评审的序数评分，均值仅作描述；不能换算成准确率或视为人评结论。', '',
            '本轮优先改进线索是短输入的内容膨胀和固定模块重复，已经跨职能出现。四份预先标记的稀疏案例，其中文字段字符数如下（不含专门的引用字段，包含标题与其他中文字段，并非精确正文篇幅）：', '',
            '| ID | 职能 | 中文字段字符数 |', '| --- | --- | --- |']
        for r in sparse:lines.append(f'| {r["id"]} | {r["family"]} | {r["checks"]["authored_zh_characters"]} |')
        lines += ['', '这只是下一轮候选修改的线索，尚未证明缩短输出会提高效用。评分理由可能复述原句，全部保留在本机，不进入公开报告。', '',
            f'生成 usage 合计：输入 {token_totals["prompt_tokens"]}、输出 {token_totals["completion_tokens"]}、总计 {token_totals["total_tokens"]} tokens；评分另计 {scores["tokens_reported"]["total_tokens"]} tokens。提供方输出计数可能包含推理消耗；本项目未保存推理正文。账单金额未查询。']
    lines += ['', '原始输入、模型完整输出和详细评审理由仅存本机private目录。合成集表现不代表真实招聘总体；不进入CV或研究页。', '',
        '版本记录：baseline-v11 使用冻结的生产 v11 代码和提示词，生成与评审各运行20次；没有候选版本，没有实际双顺序比较，没有上线变更。已有留出组本轮仅用于基线评测，未来规则调整只能使用开发组；不能再按留出组的个案理由调参。']
    (ROOT/'docs/prompts/eval'/f'{version}.md').write_text('\n'.join(lines)+'\n')
    print(json.dumps({k:result[k] for k in ['status','completed','accepted_n','provider_calls','median_elapsed_ms']},ensure_ascii=False))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('version',nargs='?',default='baseline-v11');main(p.parse_args().version)
