#!/usr/bin/env python3
"""Local lexical counts + blank human-review files. No LLM or network.

Formal run requires a previously committed coding plan:
  python3 research/scripts/02_terms.py --run --plan-commit <sha>
  python3 research/scripts/02_terms.py --run --plan-commit <sha> --verify-existing
Tests use synthetic strings only: python3 research/scripts/02_test_terms.py
"""
import argparse
from collections import Counter
import csv
from datetime import datetime, timezone
import hashlib
import html
import io
import json
from pathlib import Path
import re
import subprocess
import unicodedata

ROOT = Path(__file__).resolve().parents[2]
PLATFORMS = ("51job", "boss", "liepin")
EXPECTED = {"沟通", "分析", "数据", "协调", "熟练", "独立", "协作", "抗压", "责任心", "适应",
            "目标", "服务", "逻辑", "学习", "统筹", "主动", "英语", "严谨", "闭环", "执行力"}
DEEP = {"独立", "抗压", "沟通", "责任心", "主动", "闭环"}
HUMAN_FIELDS = ("human_label", "human_notes", "annotator", "reviewed_at")
REVIEW_IDENTITY_FIELDS = ("run_id", "review_kind", "input_sha256", "config_sha256")


def sha(value):
    return hashlib.sha256(value if isinstance(value, bytes) else value.encode()).hexdigest()


def normalize(text):
    return unicodedata.normalize("NFKC", text).casefold()


def load_config(path):
    config = json.loads(path.read_text())  # JSON is also valid YAML; no dependency needed.
    terms = config["terms"]
    core=[t for t in terms if not t.get("exploratory")]
    if len(core) != 20 or {t["term"] for t in core} != EXPECTED:
        raise ValueError("The fixed 20 terms must be preserved.")
    if {t["term"] for t in terms if t["deep_coding"]} != DEEP:
        raise ValueError("The six deep-coding terms must remain a subset.")
    for term in terms:
        if any(normalize(term["term"]) not in normalize(c) for c in term["exclude_compounds"]):
            raise ValueError("Every exclusion compound must contain its term.")
    return config


def spans(text, needle):
    start = 0
    while True:
        start = text.find(needle, start)
        if start < 0:
            return
        yield start, start + len(needle)
        start += 1


def match_term(text, spec):
    """Input is normalized. Offsets never claim to index the raw source."""
    compounds = [(c, a, b) for c in spec["exclude_compounds"] for a, b in spans(text, normalize(c))]
    candidates={(a,b) for alias in spec.get("aliases",[spec["term"]]) for a,b in spans(text,normalize(alias))}
    matches=sorted((a,b) for a,b in candidates if not any(x<=a and y>=b and (x,y)!=(a,b) for x,y in candidates))
    return [{"start": a, "end": b,
             "candidate_excluded": any(x <= a and y >= b for _, x, y in compounds),
             "exclusion_rules": sorted({c for c, x, y in compounds if x <= a and y >= b})}
            for a, b in matches]


def window(text, start, end, radius=70):
    # A preview, not the later jieba/collocation window or a semantic label.
    left, right = max(0, start-radius), min(len(text), end+radius)
    return {"left": text[left:start], "hit": text[start:end], "right": text[end:right]}


def deterministic_sample(pairs, term, n, seed):
    ordered = sorted(pairs, key=lambda p: (sha(f"{seed}|{term}|{p['record_id']}"), p["record_id"]))
    return ordered[:min(n, len(ordered))]


def build(rows, config):
    if len({r["id"] for r in rows}) != len(rows):
        raise ValueError("Duplicate input record IDs; no sample generated.")
    if any(r.get("platform") not in PLATFORMS or not isinstance(r.get("body"), str) for r in rows):
        raise ValueError("Invalid source or body field; no record text is printed.")
    source_keys = [(r["platform"], str(r.get("source_job_id") or r.get("url") or r.get("archive_record_id") or r["id"])) for r in rows]
    if len(set(source_keys)) != len(rows):
        raise ValueError("Duplicate source/ad identities; resolve the input before counting. No record identities are printed.")
    source_n = Counter(r["platform"] for r in rows)
    summaries, samples, exclusions, ledger, excluded_reviews = [], [], [], [], []
    for spec in config["terms"]:
        term, pairs, excluded_pairs = spec["term"], [], []
        counts = {p: Counter() for p in PLATFORMS}
        for r in sorted(rows, key=lambda r: r["id"]):
            text = normalize(r["body"])
            hits = match_term(text, spec)
            if not hits:
                continue
            kept = [h for h in hits if not h["candidate_excluded"]]
            rejected = [h for h in hits if h["candidate_excluded"]]
            c = counts[r["platform"]]
            c.update({"literal_ads": 1, "literal_occurrences": len(hits),
                      "candidate_kept_ads": int(bool(kept)), "candidate_kept_occurrences": len(kept),
                      "excluded_candidate_ads": int(bool(rejected)), "excluded_candidate_occurrences": len(rejected),
                      "excluded_only_ads": int(not kept), "mixed_ads": int(bool(kept) and bool(rejected))})
            pair = {"pair_id": sha(f"pair|{term}|{r['id']}"), "record_id": r["id"],
                    "term": term, "title": r.get("title", ""), "source": r["platform"],
                    "body": r["body"], "normalized_body": text,
                    "hits": [{**h, "preview": window(text, h["start"], h["end"])} for h in hits]}
            ledger.append({k: pair[k] for k in ("pair_id", "record_id", "term", "source", "hits")})
            if rejected:
                excluded_pairs.append(pair)
            for hit in rejected:
                exclusions.append({"pair_id": pair["pair_id"], "record_id": r["id"], "term": term,
                                   "title": pair["title"], "source": r["platform"], **hit,
                                   "preview": window(text, hit["start"], hit["end"]), "review_status": "pending",
                                   **{field: "" for field in HUMAN_FIELDS}})
            if kept:
                pairs.append(pair)
        selected = deterministic_sample(pairs, term, config["sampling"]["per_term"], config["seed"])
        selected_exclusions = deterministic_sample(excluded_pairs, "exclusions|"+term, config["sampling"]["exclusion_per_term"], config["seed"])
        for p in selected_exclusions:
            excluded_reviews.append({**p, "review_status": "pending", **{field: "" for field in HUMAN_FIELDS},
                                     "inclusion_probability": len(selected_exclusions)/len(excluded_pairs),
                                     "sampling_frame_n": len(excluded_pairs), "review_kind": "excluded_candidates_exploratory"})
        for p in selected:
            samples.append({**p, "review_kind": "kept_precision", "review_status": "pending", **{field: "" for field in HUMAN_FIELDS},
                            "inclusion_probability": len(selected)/len(pairs), "sampling_frame_n": len(pairs)})
        total = Counter()
        for c in counts.values():
            total.update(c)
        fields = ["literal_ads", "literal_occurrences", "candidate_kept_ads", "candidate_kept_occurrences",
                  "excluded_candidate_ads", "excluded_candidate_occurrences", "excluded_only_ads", "mixed_ads"]
        summaries.append({"term": term, "group": spec["group"], "deep_coding": spec["deep_coding"],
                          **{k: total[k] for k in fields},
                          "by_source": {p: {"corpus_ads": source_n[p], **{k: counts[p][k] for k in fields}} for p in PLATFORMS},
                          "review_sample_n": len(selected), "review_target_n": config["sampling"]["per_term"],
                          "sampling_inclusion_probability": len(selected)/len(pairs) if pairs else None,
                          "excluded_review_n": len(selected_exclusions),
                          "sample_shortfall": max(0, config["sampling"]["per_term"]-len(selected)),
                          "human_review_status": "pending", "precision": None, "precision_ci": None})
    return {"corpus_ads": len(rows), "by_source": dict(source_n), "terms": summaries}, samples, exclusions, ledger, excluded_reviews


def validate_plan_input(plan_text, input_hash):
    declared = re.findall(r"^输入 SHA-256[：:]\s*`([0-9a-f]{64})`\s*$", plan_text, re.M)
    if len(declared) != 1 or declared[0] != input_hash:
        raise ValueError("Input does not match the coding plan's declared SHA-256; freeze an updated plan before using a different corpus.")


def tag_review_rows(rows, run_id, input_sha, config_sha, review_kind):
    return [{**r, "run_id": run_id, "review_kind": review_kind,
             "input_sha256": input_sha, "config_sha256": config_sha} for r in rows]


def csv_text(rows, fields):
    out = io.StringIO(newline="")
    writer = csv.DictWriter(out, fields, extrasaction="ignore", lineterminator="\n")
    writer.writeheader()
    for row in rows:
        safe = {}
        for k in fields:
            value = row.get(k, "")
            if isinstance(value, (list, dict)):
                value = json.dumps(value, ensure_ascii=False)
            value = str(value)
            # Guard spreadsheet formula execution without changing JSON/raw text.
            safe[k] = "'"+value if value.startswith(("=", "+", "-", "@", "\t", "\r")) else value
        writer.writerow(safe)
    return "\ufeff"+out.getvalue()


def review_html(samples, run_id, excluded=False):
    # Escape script-closing text; use textContent for every original string.
    embedded = json.dumps(samples, ensure_ascii=False).replace("<", "\\u003c").replace("&", "\\u0026")
    embedded = embedded.replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    page = '''<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; img-src 'none'; form-action 'none'; base-uri 'none'">
<title>词面命中人工抽查 · 仅本机</title><style>body{max-width:900px;margin:36px auto;padding:0 20px;font:16px/1.7 system-ui;color:#242424}button,select,input,textarea{font:inherit;padding:7px}textarea{width:95%;min-height:70px}button{cursor:pointer;margin:4px}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f6f4ef;padding:16px}.muted{color:#666;font-size:13px}section{border-top:1px solid #ddd;padding-top:20px}.excluded{color:#875716}label{display:block;margin-top:12px}nav{display:flex;gap:8px;flex-wrap:wrap}</style>
<h1>词面命中抽查</h1><p>只判断这个词在这份广告里，是否至少有一处保留命中描述对人的要求或工作方式。排除候选没有被判成事实性的“非劳动者”。这是词表抽查，不是金标准。</p>
<p class="muted">原文只在这个本地文件内。只把人工填写缓存到本机浏览器，不存正文、不上传。刷新可继续；浏览器限制存储时仍可下载CSV，离开前请另存一份。已有表格不会被脚本覆盖。CSV模板人工栏为空。来源字段不显示，但正文可能透露来源或单位，不能称为盲评。排除候选完整列表见同目录excluded-candidates.csv。</p>
<nav><select id="term" aria-label="选择词条"></select><button id="prev">上一条</button><button id="next">下一条</button><button id="export">下载已填标注CSV</button></nav>
<p id="save-status" class="muted" role="status"></p><p id="progress"></p><section><h2 id="heading"></h2><div id="hits"></div><details><summary>查看完整原文</summary><pre id="body"></pre></details>
<label>人工判断 <select id="label"><option value="">待填写</option><option value="person_or_workstyle">至少一处保留命中描述人的要求/工作方式</option><option value="nonperson_only">保留命中均不属于上述用法</option><option value="unclear">无法判断，需讨论</option></select></label>
<label>判断依据或疑问<textarea id="notes"></textarea></label><label>实际编码员<input id="annotator" autocomplete="off"></label></section>
<p class="muted">不按标题猜实际职级；不把只出现词语当作人格要求。若规则误排了人的用法，在备注写明，并另行检查excluded候选。请保留无法判断，不为了得到精确率强填。</p>
<script id="samples" type="application/json">''' + embedded + '''</script><script>
const rows=JSON.parse(document.getElementById('samples').textContent),$=id=>document.getElementById(id);let list=rows,index=0;
const identity=rows[0],draftKey=identity?'wlo-review:'+identity.run_id+':'+identity.review_kind:null;
const labelValues=new Set(['','person_or_workstyle','nonperson_only','unclear']);
function restoreDraft(){try{if(!draftKey)return;const draft=JSON.parse(localStorage.getItem(draftKey)||'null');if(!draft){$('save-status').textContent='尚未填写；人工内容将保存在本机。';return}if(draft.run_id!==identity.run_id||draft.review_kind!==identity.review_kind||draft.input_sha256!==identity.input_sha256||draft.config_sha256!==identity.config_sha256||!Array.isArray(draft.answers)){$('save-status').textContent='未载入身份不匹配的旧草稿。请保留原CSV核对。';return}const current=new Map(rows.map(r=>[r.pair_id,r]));let n=0;for(const answer of draft.answers){const r=current.get(answer.pair_id);if(!r||!labelValues.has(answer.human_label)||!['human_notes','annotator','reviewed_at'].every(k=>typeof answer[k]==='string'))continue;for(const k of ['human_label','human_notes','annotator','reviewed_at'])r[k]=answer[k];r.review_status=r.human_label?'human_entered_unadjudicated':'pending';n++}$('save-status').textContent='已恢复本机草稿 '+n+' 条。';}catch(error){$('save-status').textContent='浏览器无法读取本机草稿；仍可填写并下载CSV。'}}
function saveDraft(){try{if(!draftKey)return;const answers=rows.filter(r=>r.human_label||r.human_notes||r.annotator).map(r=>({pair_id:r.pair_id,human_label:r.human_label,human_notes:r.human_notes,annotator:r.annotator,reviewed_at:r.reviewed_at}));localStorage.setItem(draftKey,JSON.stringify({run_id:identity.run_id,review_kind:identity.review_kind,input_sha256:identity.input_sha256,config_sha256:identity.config_sha256,answers}));$('save-status').textContent='人工填写已存本机；建议另下载CSV备份。';}catch(error){$('save-status').textContent='浏览器无法保存草稿；关闭前请下载CSV。'}}
restoreDraft();
const terms=[...new Set(rows.map(r=>r.term))];for(const t of terms){const o=document.createElement('option');o.value=t;o.textContent=t;$('term').append(o)}
function render(){const r=list[index];if(!r){$('heading').textContent='无可抽查命中';return}$('term').value=r.term;$('heading').textContent=r.term+' · '+r.title;$('progress').textContent=(index+1)+' / '+list.length+' · 全部已填 '+rows.filter(x=>x.human_label).length+' / '+rows.length;$('body').textContent=r.body;$('label').value=r.human_label;$('notes').value=r.human_notes;$('annotator').value=r.annotator;$('hits').replaceChildren();for(const h of r.hits){const p=document.createElement('pre');p.className=h.candidate_excluded?'excluded':'';p.textContent=(h.candidate_excluded?'排除候选（待复核）':'保留命中（尚非语义判断）')+'\\n'+h.preview.left+'【'+h.preview.hit+'】'+h.preview.right;$('hits').append(p)}}
for(const [id,key] of [['label','human_label'],['notes','human_notes'],['annotator','annotator']])$(id).addEventListener('input',()=>{const r=list[index];if(!r)return;r[key]=$(id).value;r.review_status=r.human_label?'human_entered_unadjudicated':'pending';r.reviewed_at=r.human_label?new Date().toISOString():'';saveDraft();$('progress').textContent=(index+1)+' / '+list.length+' · 全部已填 '+rows.filter(x=>x.human_label).length+' / '+rows.length});
$('prev').onclick=()=>{index=Math.max(0,index-1);render()};$('next').onclick=()=>{index=Math.min(list.length-1,index+1);render()};$('term').onchange=()=>{list=rows.filter(r=>r.term===$('term').value);index=0;render()};
$('export').onclick=()=>{const fields=['run_id','review_kind','input_sha256','config_sha256','pair_id','term','review_status','human_label','human_notes','annotator','reviewed_at'];const esc=v=>{let s=String(v??'');if(/^[=+@\\-\\t\\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'};const csv='\\uFEFF'+[fields.join(','),...rows.map(r=>fields.map(k=>esc(r[k])).join(','))].join('\\r\\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='annotations.'+(rows[0]?.review_kind||'empty')+'.'+(rows[0]?.run_id||'no-run')+'.user.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
if(rows.length){list=rows.filter(r=>r.term===terms[0]);render()}
</script></html>'''
    if excluded:
        page = page.replace("词面命中人工抽查", "排除候选探索复核").replace("<h1>词面命中抽查</h1>", "<h1>排除候选探索复核</h1>")
        page = page.replace("至少有一处保留命中", "至少有一处被排除命中")
        page = page.replace("Inspect all kept occurrences", "Inspect all excluded occurrences")
        page = page.replace("这是词表抽查，不是金标准。", "每词最多10份，仅检查规则可能漏掉的人的用法；不是金标准，也不估计召回率。")
        page = page.replace("检查所有保留命中", "检查所有排除候选")
        page = page.replace("至少一处保留命中描述人的要求/工作方式", "至少一处被排除命中描述人的要求/工作方式")
        page = page.replace("保留命中均不属于上述用法", "被排除命中均不属于上述用法")
    return page


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", action="store_true", help="Explicitly run after the parent confirms plan commit.")
    parser.add_argument("--plan-commit", required=True)
    parser.add_argument("--verify-existing", action="store_true", help="Recompute and verify immutable outputs; never overwrite annotation files.")
    args = parser.parse_args()
    if not args.run or not re.fullmatch(r"[0-9a-f]{7,40}", args.plan_commit):
        raise SystemExit("Formal run requires --run and an actual prior plan commit SHA.")
    plan = ROOT / "research/preregistration.md"
    if not plan.exists():
        raise SystemExit("STOP: coding plan not present; no corpus was read.")
    frozen = subprocess.run(["git", "show", args.plan_commit+":research/preregistration.md"],
                            cwd=ROOT, capture_output=True)
    if frozen.returncode or sha(frozen.stdout) != sha(plan.read_bytes()):
        raise SystemExit("STOP: plan is not present unchanged at the supplied prior commit; no corpus was read.")
    inp = ROOT / "research/private/corpus-2000.private.json"
    ignored = subprocess.run(["git", "check-ignore", "-q", str(inp.relative_to(ROOT))], cwd=ROOT)
    tracked = subprocess.check_output(["git", "ls-files", "research/private"], cwd=ROOT)
    if ignored.returncode or tracked.strip():
        raise SystemExit("STOP: private files are not safely excluded.")
    config_path = ROOT / "research/config/terms.yaml"
    config = load_config(config_path)
    raw = inp.read_bytes()
    input_sha, config_sha = sha(raw), sha(config_path.read_bytes())
    validate_plan_input(plan.read_text(), input_sha)
    result, samples, exclusions, ledger, excluded_reviews = build(json.loads(raw)["records"], config)
    run_id = config["version"] + "-" + input_sha[:8] + "-" + config_sha[:8] + "-" + sha(Path(__file__).read_bytes())[:8]
    samples = tag_review_rows(samples, run_id, input_sha, config_sha, "kept_precision")
    excluded_reviews = tag_review_rows(excluded_reviews, run_id, input_sha, config_sha, "excluded_candidates_exploratory")
    exclusions = tag_review_rows(exclusions, run_id, input_sha, config_sha, "excluded_candidate_ledger")
    private_dir = ROOT / "research/private/02-terms" / run_id
    result.update({"schema_version": "wlo-term-counts-v1", "run_id": run_id, "config_version": config["version"],
                   "input_sha256": input_sha, "config_sha256": config_sha, "plan_commit": args.plan_commit,
                   "unit": "advertisement-term pairs; occurrence counts separately labelled",
                   "human_review_status": "pending", "model_calls": 0,
                   "semantics": "Literal and candidate-kept counts are not person/nonperson labels or verified skill requirements.",
                   "occupation_breakdown_status": "pending step 3 validation",
                   "permissions": "unknown; authorized local exploratory work only; no raw publication or page update"})
    sample_manifest = {"run_id": run_id, "input_sha256": input_sha, "config_sha256": config_sha,
                       "seed": config["seed"], "sample_unit": config["sampling"]["unit"],
                       "samples": [{k: r[k] for k in ("pair_id", "record_id", "term", "inclusion_probability", "sampling_frame_n")} for r in samples]}
    outputs = {"sample-manifest.json": json.dumps(sample_manifest, ensure_ascii=False, indent=2)+"\n",
               "review.template.json": json.dumps(samples, ensure_ascii=False, indent=2)+"\n",
               "review.template.csv": csv_text(samples, [*REVIEW_IDENTITY_FIELDS, "pair_id", "record_id", "term", "title", "hits", "body", "review_status", *HUMAN_FIELDS, "inclusion_probability", "sampling_frame_n"]),
               "excluded-candidates.csv": csv_text(exclusions, [*REVIEW_IDENTITY_FIELDS, "pair_id", "record_id", "term", "title", "start", "end", "exclusion_rules", "preview", "review_status", *HUMAN_FIELDS]),
               "literal-ledger.json": json.dumps(ledger, ensure_ascii=False)+"\n",
               "review.html": review_html(samples, run_id),
               "excluded-review.template.json": json.dumps(excluded_reviews, ensure_ascii=False, indent=2)+"\n",
               "excluded-review.template.csv": csv_text(excluded_reviews, [*REVIEW_IDENTITY_FIELDS, "pair_id", "record_id", "term", "title", "hits", "body", "review_status", *HUMAN_FIELDS, "inclusion_probability", "sampling_frame_n"]),
               "excluded-review.html": review_html(excluded_reviews, run_id, excluded=True)}
    if args.verify_existing:
        if not private_dir.is_dir():
            raise SystemExit("No existing run to verify; no files written.")
        for name, content in outputs.items():
            if (private_dir/name).read_bytes() != content.encode("utf-8"):
                raise SystemExit("Immutable output differs: "+name+"; no file overwritten.")
        stored = json.loads((ROOT / "research/aggregates/term_counts.json").read_text())
        if stored != result:
            raise SystemExit("Aggregate output differs; no file overwritten.")
        print(json.dumps({"verified_existing": True, "terms": len(result["terms"]), "human_labels_filled_by_script": 0}))
        return
    if private_dir.exists():
        raise SystemExit("Run already exists; use --verify-existing. Human work will not be overwritten.")
    private_dir.mkdir(parents=True)
    for name, content in outputs.items():
        with (private_dir/name).open("x", encoding="utf-8", newline="") as f:
            f.write(content)
    out = ROOT / "research/aggregates/term_counts.json"
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2)+"\n")
    log = {"step": 2, "run_id": run_id, "generated_at_utc": datetime.now(timezone.utc).isoformat(),
           "plan_commit": args.plan_commit, "plan_sha256": sha(plan.read_bytes()),
           "repository_head": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
           "script_sha256": sha(Path(__file__).read_bytes()), "config_sha256": config_sha,
           "input_sha256": input_sha, "seed": config["seed"], "model": None, "model_call_date": None,
           "prompt_hash": None, "temperature": None, "model_calls": 0, "human_labels_generated": 0,
           "sample_pairs": len(samples), "candidate_exclusions": len(exclusions), "excluded_review_pairs": len(excluded_reviews),
           "outputs": {str((private_dir/name).relative_to(ROOT)): sha(content) for name, content in outputs.items()},
           "aggregate_output": str(out.relative_to(ROOT)), "aggregate_sha256": sha(out.read_bytes()),
           "waiting_for": "human precision review; no precision, confidence intervals or semantic labels computed"}
    (ROOT / "research/logs/02-terms.json").write_text(json.dumps(log, ensure_ascii=False, indent=2)+"\n")
    print(json.dumps({"terms": len(result["terms"]), "sample_pairs": len(samples), "candidate_exclusions": len(exclusions), "excluded_review_pairs": len(excluded_reviews),
                      "human_review_status": "pending", "human_labels_generated": 0, "model_calls": 0,
                      "private_review": str((private_dir/"review.html").relative_to(ROOT))}, ensure_ascii=False))


if __name__ == "__main__":
    main()
