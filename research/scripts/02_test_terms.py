#!/usr/bin/env python3
"""Small synthetic tests only. Never load the actual JD corpus or fill labels."""
import csv
import importlib.util
import io
import json
from pathlib import Path
import re
import subprocess
import unittest

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("terms_step2", HERE / "02_terms.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
CONFIG = module.load_config(HERE.parent / "config/terms.yaml")
BY_TERM = {t["term"]: t for t in CONFIG["terms"]}


def row(record_id, body, title="合成测试岗位", source="51job"):
    return {"id": record_id, "body": body, "title": title, "platform": source}


class TermRules(unittest.TestCase):
    def hits(self, text, term):
        return module.match_term(module.normalize(text), BY_TERM[term])

    def test_preserves_twenty_terms_and_six_subset(self):
        self.assertEqual(len(BY_TERM), 20)
        self.assertEqual({t["term"] for t in CONFIG["terms"] if t["deep_coding"]}, module.DEEP)

    def test_compounds_do_not_erase_valid_hits_in_same_ad(self):
        for term, text in [("服务", "维护服务器，也需服务客户。"),
                           ("学习", "熟悉机器学习，具备学习能力。"),
                           ("独立", "参与独立站运营，能独立工作。")]:
            hits = self.hits(text, term)
            self.assertEqual(len(hits), 2)
            self.assertEqual(sum(h["candidate_excluded"] for h in hits), 1)

    def test_exclusion_is_span_bound_not_whole_document(self):
        self.assertFalse(self.hits("提供客户服务", "服务")[0]["candidate_excluded"])
        self.assertFalse(self.hits("参与机器维护与学习培训", "学习")[0]["candidate_excluded"])
        self.assertTrue(self.hits("研究深度学习", "学习")[0]["candidate_excluded"])

    def test_nfkc_casefold_offsets_and_no_whitespace_joining(self):
        self.assertEqual(module.normalize("ＳＱＬ ß"), "sql ss")
        hits = self.hits("ß独立", "独立")
        self.assertEqual(hits[0]["start"], 2)  # Normalized offset, not raw offset 1.
        self.assertEqual(self.hits("学\n习", "学习"), [])

    def test_body_only_and_once_per_ad(self):
        counts, samples, excluded, ledger, exclusion_review = module.build([
            row("fixture-a", "独立工作，并能独立分析。"),
            row("fixture-b", "整理材料", title="独立研究员"),
            row("fixture-c", "独立站维护。")], CONFIG)
        term = next(t for t in counts["terms"] if t["term"] == "独立")
        self.assertEqual(term["literal_ads"], 2)
        self.assertEqual(term["literal_occurrences"], 3)
        self.assertEqual(term["candidate_kept_ads"], 1)
        self.assertEqual(term["excluded_only_ads"], 1)
        self.assertEqual(term["review_sample_n"], 1)
        self.assertEqual(term["sample_shortfall"], 19)
        self.assertIsNone(term["precision"])
        self.assertEqual(len(excluded), 1)

    def test_sampling_deterministic_unique_and_probabilities(self):
        rows = [row("fixture-"+str(i), "需要沟通。", source=module.PLATFORMS[i % 3]) for i in range(35)]
        a = module.build(rows, CONFIG)[1]
        b = module.build(list(reversed(rows)), CONFIG)[1]
        self.assertEqual(a, b)
        self.assertEqual(len(a), 20)
        self.assertEqual(len({p["record_id"] for p in a}), 20)
        self.assertTrue(all(p["inclusion_probability"] == 20/35 for p in a))
        self.assertTrue(all(p["review_status"] == "pending" for p in a))
        self.assertTrue(all(p[f] == "" for p in a for f in module.HUMAN_FIELDS))

    def test_csv_preserves_empty_human_fields_and_guards_formulas(self):
        csv_body = module.csv_text([{"title": "=1+1", "human_label": "", "body": '多行\n含,逗号与"引号"'}], ["title", "human_label", "body"])
        parsed = list(csv.DictReader(io.StringIO(csv_body.lstrip("\ufeff"))))[0]
        self.assertEqual(parsed["title"], "'=1+1")
        self.assertEqual(parsed["human_label"], "")
        self.assertEqual(parsed["body"], '多行\n含,逗号与"引号"')

    def test_local_html_escapes_untrusted_text_and_js_is_valid(self):
        samples = module.build([row("fixture-html", '沟通 </script><script>alert(1)</script>')], CONFIG)[1]
        page = module.review_html(samples, "synthetic-test")
        self.assertIn("connect-src 'none'", page)
        self.assertNotIn('</script><script>alert(1)', page)
        data = re.search(r'<script id="samples" type="application/json">(.*?)</script>', page, re.S).group(1)
        self.assertEqual(json.loads(data)[0]["human_label"], "")
        js = re.search(r'</script><script>(.*?)</script>', page, re.S).group(1)
        checked = subprocess.run(["node", "--check", "-"], input=js, text=True, capture_output=True)
        self.assertEqual(checked.returncode, 0, checked.stderr)

    def test_exclusion_review_and_zero_hit_terms(self):
        rows = [row("fixture-excluded-"+str(i), "使用服务器。") for i in range(14)]
        counts, samples, excluded, ledger, review = module.build(rows, CONFIG)
        self.assertEqual(len(samples), 0)
        self.assertEqual(len(excluded), 14)
        self.assertEqual(len(review), 10)
        self.assertTrue(all(p["human_label"] == "" for p in review))
        zero = next(t for t in counts["terms"] if t["term"] == "沟通")
        self.assertEqual(zero["review_sample_n"], 0)
        self.assertIsNone(zero["sampling_inclusion_probability"])
        page = module.review_html(review, "synthetic-exclusions", excluded=True)
        self.assertIn("不估计召回率", page)
        self.assertIn("至少一处被排除命中描述人的要求", page)

    def test_mixed_ad_exports_keep_review_identity_separate(self):
        counts, kept, excluded, ledger, excluded_review = module.build(
            [row("fixture-mixed", "维护服务器，也为客户服务。")], CONFIG)
        exports = []
        for rows, kind in [(kept, "kept_precision"), (excluded_review, "excluded_candidates_exploratory")]:
            tagged = module.tag_review_rows(rows, "synthetic-run", "input-sha", "config-sha", kind)
            page = module.review_html(tagged, "synthetic-run", excluded=kind != "kept_precision")
            script = re.search(r'</script><script>(.*?)</script>', page, re.S).group(1)
            # Exercise the generated download handler, not just its source text.
            harness = r'''
const inputRows = __ROWS__;
const elements = {};
function element(){return {value:'',textContent:'',append(){},replaceChildren(){},addEventListener(){},click(){download=this.download}}}
let download='',capturedBlob;
const document={getElementById(id){if(!elements[id])elements[id]=element();return elements[id]},createElement(){return element()}};
document.getElementById('samples').textContent=JSON.stringify(inputRows);
const URL={createObjectURL(blob){capturedBlob=blob;return 'blob:local'},revokeObjectURL(){}};
const setTimeout=()=>0;
__SCRIPT__
elements.export.onclick();capturedBlob.text().then(csv=>console.log(JSON.stringify({download,csv})));
'''.replace('__ROWS__', json.dumps(tagged)).replace('__SCRIPT__', script)
            result = subprocess.run(['node', '-'], input=harness, text=True, capture_output=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            export = json.loads(result.stdout)
            parsed = list(csv.DictReader(io.StringIO(export['csv'].lstrip('\ufeff'))))[0]
            self.assertEqual(parsed['run_id'], 'synthetic-run')
            self.assertEqual(parsed['review_kind'], kind)
            self.assertEqual(parsed['input_sha256'], 'input-sha')
            self.assertEqual(parsed['config_sha256'], 'config-sha')
            self.assertEqual(parsed['human_label'], '')
            self.assertIn(kind, export['download'])
            exports.append((export, parsed))
        self.assertEqual(exports[0][1]['pair_id'], exports[1][1]['pair_id'])
        self.assertNotEqual(exports[0][0]['download'], exports[1][0]['download'])
        self.assertNotEqual(exports[0][1]['review_kind'], exports[1][1]['review_kind'])

    def test_plan_input_hash_must_match(self):
        declared = "a" * 64
        module.validate_plan_input("输入 SHA-256：`"+declared+"`\n", declared)
        with self.assertRaises(ValueError):
            module.validate_plan_input("输入 SHA-256：`"+declared+"`\n", "b" * 64)
        with self.assertRaises(ValueError):
            module.validate_plan_input("no declared input hash", declared)

    def test_only_human_fields_survive_reload_and_storage_failure_exports(self):
        samples = module.build([row("fixture-cache", "需要沟通")], CONFIG)[1]
        tagged = module.tag_review_rows(samples, "synthetic-cache", "input-sha", "config-sha", "kept_precision")
        page = module.review_html(tagged, "synthetic-cache")
        script = re.search(r'</script><script>(.*?)</script>', page, re.S).group(1)
        harness = r'''
const vm=require('node:vm'),assert=require('node:assert/strict');
const rows=__ROWS__,script=__SCRIPT__,cache=new Map();
function boot(fail=false){const nodes={};let blob;
function el(){return {value:'',textContent:'',events:{},append(){},replaceChildren(){},addEventListener(k,fn){this.events[k]=fn},click(){}}}
const document={getElementById(k){return nodes[k]??=el()},createElement(){return el()}};
document.getElementById('samples').textContent=JSON.stringify(rows);
const localStorage={getItem(k){if(fail)throw Error('disabled');return cache.get(k)||null},setItem(k,v){if(fail)throw Error('disabled');cache.set(k,v)}};
const context={document,localStorage,Blob,Date,setTimeout:()=>0,URL:{createObjectURL(b){blob=b;return 'blob:local'},revokeObjectURL(){}}};
vm.runInNewContext(script,context);return{nodes,blob:()=>blob}}
(async()=>{const first=boot();first.nodes.label.value='person_or_workstyle';first.nodes.label.events.input();first.nodes.notes.value='synthetic explanation';first.nodes.notes.events.input();
const [key,json]=[...cache.entries()][0],saved=JSON.parse(json);assert(key.includes('synthetic-cache:kept_precision'));assert.deepEqual(Object.keys(saved.answers[0]).sort(),['annotator','human_label','human_notes','pair_id','reviewed_at']);assert(!json.includes('需要沟通'));
saved.answers.push({...saved.answers[0],pair_id:'not-in-this-sample'});cache.set(key,JSON.stringify(saved));const second=boot();assert.equal(second.nodes.label.value,'person_or_workstyle');assert.equal(second.nodes.notes.value,'synthetic explanation');assert(second.nodes['save-status'].textContent.includes('1 条'));
const unavailable=boot(true);unavailable.nodes.label.value='unclear';unavailable.nodes.label.events.input();assert(unavailable.nodes['save-status'].textContent.includes('无法保存'));unavailable.nodes.export.onclick();assert((await unavailable.blob().text()).includes('unclear'));console.log('ok')})().catch(e=>{console.error(e);process.exit(1)});
'''.replace('__ROWS__', json.dumps(tagged)).replace('__SCRIPT__', json.dumps(script))
        result = subprocess.run(['node', '-'], input=harness, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.strip(), 'ok')

    def test_duplicate_source_ad_is_rejected(self):
        a, b = row("fixture-one", "沟通"), row("fixture-two", "沟通")
        a["source_job_id"] = b["source_job_id"] = "synthetic-ad"
        with self.assertRaises(ValueError):
            module.build([a, b], CONFIG)

    def test_duplicate_ids_are_rejected(self):
        with self.assertRaises(ValueError):
            module.build([row("fixture-same", "沟通"), row("fixture-same", "学习")], CONFIG)


if __name__ == "__main__":
    unittest.main(verbosity=1)
