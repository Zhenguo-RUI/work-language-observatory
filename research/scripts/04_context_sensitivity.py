#!/usr/bin/env python3
"""Local, exploratory lexical sensitivity checks; no human labels or network.

python3 research/scripts/04_context_sensitivity.py --self-test
python3 research/scripts/04_context_sensitivity.py --run
Only aggregate counts leave memory. Repeated clauses are candidates, not an
attribution to an employer or platform and not semantic judgments.
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
import unittest

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = "research/scripts/04_context_sensitivity.py"
OUTPUT = "research/aggregates/context-sensitivity.json"
EXPECTED_HASH = "ae247a10263b905b59f62a0fa82559257e3998ccb7f43f775177b12a740c7ef3"
PAIRS = (("抗压", "协调"), ("数据", "沟通"))
SPLIT = re.compile(r"[。.;!?\r\n]+")
MIN_HAN = 12
MIN_ADS = 3


def normalize(text):
    return unicodedata.normalize("NFKC", text).casefold()


def clauses(text):
    return [part.strip() for part in SPLIT.split(normalize(text)) if part.strip()]


def signature(clause):
    # Keep letters and symbols; remove punctuation, numeric characters and space.
    return "".join(c for c in clause if not (c.isspace() or c.isnumeric() or unicodedata.category(c).startswith("P")))


def han_count(text):
    return sum("CJK UNIFIED IDEOGRAPH" in unicodedata.name(c, "") or "CJK COMPATIBILITY IDEOGRAPH" in unicodedata.name(c, "") for c in text)


def candidate_templates(documents):
    counts = Counter()
    for document in documents:
        # A repeated clause within ONE advertisement is still one supporting ad.
        counts.update({key for part in document if han_count(key := signature(part)) >= MIN_HAN})
    return {key for key, n in counts.items() if n >= MIN_ADS}


def table(documents, first, second):
    cells = [[0, 0], [0, 0]]
    for document in documents:
        # Never concatenate clauses: deletion must not invent a new word at a seam.
        x = any(first in part for part in document)
        y = any(second in part for part in document)
        cells[0 if x else 1][0 if y else 1] += 1
    (a, b), (c, d) = cells
    return {"cells": cells, "cell_order": [["both", "first_only"], ["second_only", "neither"]],
            "n": len(documents), "first_n": a + b, "other_n": c + d,
            "first_rate": a / (a + b) if a + b else None,
            "other_rate": c / (c + d) if c + d else None,
            "or": a * d / (b * c) if b * c else None}


def proximity(documents, first, second):
    a = b = c = 0
    for document in documents:
        xs = [i for i, part in enumerate(document) if first in part]
        ys = [i for i, part in enumerate(document) if second in part]
        if xs and ys:
            a += 1
            b += bool(set(xs) & set(ys))
            c += any(abs(x - y) <= 1 for x in xs for y in ys)
    assert 0 <= b <= c <= a <= len(documents)
    return {"ad_both": a, "same_clause": b, "adjacent_clause": c,
            "same_rate": b / a if a else None, "adjacent_rate": c / a if a else None,
            "rate_denominator": a, "unit": "advertisement"}


def analyze(rows):
    documents = [clauses(row["body"]) for row in rows]
    templates = candidate_templates(documents)
    filtered = [[part for part in document if signature(part) not in templates] for document in documents]
    summary = {"patterns": len(templates), "ads_affected": sum(len(x) != len(y) for x, y in zip(documents, filtered)),
               "clauses_removed": sum(len(x) - len(y) for x, y in zip(documents, filtered)),
               "empty_ads": sum(not doc for doc in filtered),
               "newly_empty_ads": sum(bool(x) and not y for x, y in zip(documents, filtered)),
               "original_empty_ads": sum(not doc for doc in documents)}
    comparisons = []
    for first, second in PAIRS:
        comparison = {"terms": [first, second], "proximity": proximity(documents, first, second),
                      "before": table(documents, first, second), "after": table(filtered, first, second), "by_source": {}}
        for source in sorted({r["platform"] for r in rows}):
            indices = [i for i, r in enumerate(rows) if r["platform"] == source]
            original = [documents[i] for i in indices]
            retained = [filtered[i] for i in indices]
            comparison["by_source"][source] = {"proximity": proximity(original, first, second),
                                               "before": table(original, first, second), "after": table(retained, first, second)}
        comparisons.append(comparison)
    return {"n": len(rows), "normalization": "Unicode NFKC then casefold",
            "status": "Exploratory sensitivity check chosen after inspecting earlier lexical results; not H1–H3 validation",
            "sentence_rule": "Split on Chinese full stop, ASCII period/semicolon/exclamation/question marks and CR/LF after NFKC; preserve commas; discard empty fragments; no numbered-item inference",
            "proximity_rule": "One count per advertisement per pair. a=both terms anywhere; b=same clause; c=clause-index distance <=1 including same clause. Report b/a and c/a. No cross-ad pairing.",
            "template_rule": {"minimum_han_characters": MIN_HAN, "minimum_distinct_ads": MIN_ADS,
                              "normalization": "Remove Unicode punctuation, numeric characters and whitespace from each normalized clause; exact remaining strings must match",
                              "provenance": "Unconfirmed repeated-clause candidates; no attribution to platform or employer; no employer threshold or approximate matching",
                              "removal": "Remove every matching whole clause. Keep every advertisement, including empty ones, in the denominator; never join retained clauses into words."},
            "interpretation_limit": "Literal proximity and repetition only; these are neither semantic judgments nor proof that repeated clauses have no meaning. Removal changes lexical presence, not actual work arrangements.",
            "templates": summary, "comparisons": comparisons,
            "human_annotations_read": 0, "human_annotations_written": 0, "model_calls": 0}


def statistics(result, input_hash):
    stats = {}
    def add(key, value, unit, method, n, denominator):
        stats[key] = {"value": value, "unit": unit, "method": method, "source": OUTPUT,
                      "script": SCRIPT, "input_sha256": input_hash, "n": n, "denominator": denominator}
    n = result["n"]
    add("context.n", n, "advertisements", "All audited advertisements retained", n, "all advertisements")
    for key, value in result["templates"].items():
        unit = "clause patterns" if key == "patterns" else "clause occurrences" if key == "clauses_removed" else "advertisements"
        add(f"context.templates.{key}", value, unit, "Exact repeated-clause candidate removal; origin unconfirmed", n, "all advertisements; count is not a proportion")
    for item in result["comparisons"]:
        prefix = "context." + "_".join(item["terms"])
        for key in ("ad_both", "same_clause", "adjacent_clause", "same_rate", "adjacent_rate"):
            rate = key.endswith("rate")
            add(prefix + "." + key, item["proximity"][key], "proportion" if rate else "advertisements",
                result["proximity_rule"], item["proximity"]["ad_both"] if rate else n,
                "advertisements containing both terms before removal" if rate else "all advertisements")
        for stage in ("before", "after"):
            t = item[stage]
            values = {"both": t["cells"][0][0], "first_only": t["cells"][0][1], "second_only": t["cells"][1][0], "neither": t["cells"][1][1],
                      **{key: t[key] for key in ("n", "first_n", "other_n", "first_rate", "other_rate", "or")}}
            for key, value in values.items():
                denom_n = t["first_n"] if key == "first_rate" else t["other_n"] if key == "other_rate" else n
                denom = "advertisements with first term" if key == "first_rate" else "advertisements without first term" if key == "other_rate" else "all advertisements; OR uses four cells"
                add(prefix + f".{stage}." + key, value, "proportion" if key.endswith("rate") else "odds ratio" if key == "or" else "advertisements",
                    f"Literal ad-level 2x2 {stage} repeated-clause candidate removal; OR=a*d/(b*c), null when denominator zero", denom_n, denom)
    return stats


def run():
    raw = (ROOT / "research/private/corpus-2000.private.json").read_bytes()
    input_hash = hashlib.sha256(raw).hexdigest()
    counts = json.loads((ROOT / "research/aggregates/term_counts.json").read_text())
    assert input_hash == EXPECTED_HASH == counts["input_sha256"], "Input changed: audit required before rerun"
    rows = json.loads(raw)
    if isinstance(rows, dict):
        rows = rows["records"]
    assert len(rows) == counts["corpus_ads"] == 2000
    assert len({r["id"] for r in rows}) == len(rows)
    assert all(r["platform"] in {"51job", "boss", "liepin"} and isinstance(r["body"], str) for r in rows)
    result = analyze(rows)
    result["input_sha256"] = input_hash
    prior = json.loads((ROOT / "research/aggregates/lexical-cross-tabs.json").read_text())
    for item in result["comparisons"]:
        original = next(t for t in prior["tables"] if t["terms"] == item["terms"])
        assert item["before"]["cells"] == original["cells"], "Splitting changed original ad-level lexical counts"
    stats_path = ROOT / "research/aggregates/stats.json"
    existing = json.loads(stats_path.read_text())
    merged = {**existing, **statistics(result, input_hash)}
    def save(path, value):
        path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")
    save(ROOT / OUTPUT, result)
    save(stats_path, merged)
    save(ROOT / "research/logs/04-context-sensitivity.json", {
        "script": SCRIPT, "script_sha256": hashlib.sha256((ROOT / SCRIPT).read_bytes()).hexdigest(),
        "base_commit": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
        "input_sha256": input_hash, "timestamp": datetime.now(timezone.utc).isoformat(),
        "seed": None, "sampling": "deterministic census", "model": None, "model_calls": 0,
        "prompt_hash": None, "temperature": None, "outputs": [OUTPUT, "research/aggregates/stats.json"],
        "human_annotations_read": 0, "human_annotations_written": 0})
    print(json.dumps({"n": result["n"], "templates": result["templates"], "comparisons": [
        {"terms": t["terms"], "proximity": t["proximity"], "before": t["before"], "after": t["after"]} for t in result["comparisons"]]}, ensure_ascii=False))


class Checks(unittest.TestCase):
    def test_cross_ad_never_paired(self):
        self.assertEqual(proximity([["抗压"], ["协调"]], "抗压", "协调")["ad_both"], 0)

    def test_same_adjacent_and_distant(self):
        result = proximity([clauses("抗压，协调"), clauses("抗压；协调"), clauses("抗压。其他内容。协调")], "抗压", "协调")
        self.assertEqual((result["ad_both"], result["same_clause"], result["adjacent_clause"]), (3, 1, 2))
        self.assertEqual((result["same_rate"], result["adjacent_rate"]), (1 / 3, 2 / 3))

    def test_split_nfkc_keep_commas(self):
        self.assertEqual(clauses("Ａ，抗压；协调！数据？沟通\n其他。末尾."), ["a,抗压", "协调", "数据", "沟通", "其他", "末尾"])

    def test_template_distinct_ads_not_occurrences(self):
        text = "具备较强责任心并能完成各项工作任务"
        self.assertFalse(candidate_templates([[text] * 5, [text]]))
        self.assertEqual(candidate_templates([[text], [text], [text]]), {signature(text)})

    def test_template_normalization_and_minimum_han(self):
        text = "具备较强责任心并能完成各项工作任务"
        self.assertEqual(len(candidate_templates([[text + "１；"], [text + " 2"], [text + "３，"]])), 1)
        self.assertFalse(candidate_templates([["抗压协调abcdefgh1234567890"]] * 3))

    def test_deletion_keeps_empty_ads_and_does_not_join(self):
        text = "能够抗压并具备良好的沟通协调能力"
        result = analyze([{"body": text, "platform": "boss"}] * 3)
        self.assertEqual(result["templates"]["empty_ads"], 3)
        self.assertEqual(result["comparisons"][0]["after"]["cells"], [[0, 0], [0, 3]])
        self.assertEqual(result["comparisons"][0]["after"]["n"], 3)
        self.assertEqual(table([["数", "据", "沟通"]], "数据", "沟通")["cells"], [[0, 0], [1, 0]])

    def test_empty_denominators_and_metadata(self):
        result = analyze([{"body": "其他内容", "platform": "boss"}])
        self.assertIsNone(result["comparisons"][0]["proximity"]["same_rate"])
        for entry in statistics(result, "synthetic").values():
            self.assertTrue({"value", "unit", "method", "source", "script", "n", "denominator"} <= entry.keys())


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--run", action="store_true")
    mode.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        unittest.main(argv=[__file__])
    else:
        run()
