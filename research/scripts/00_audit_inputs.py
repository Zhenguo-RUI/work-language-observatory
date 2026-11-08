#!/usr/bin/env python3
"""Audit existing local inputs. No retrieval, LLM, labels or hypothesis tests.

Run from any directory: python3 research/scripts/00_audit_inputs.py
Public outputs contain inventories/counts, never record-level text or identities.
"""
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import subprocess
import unicodedata

ROOT = Path(__file__).resolve().parents[2]
INPUT = ROOT / "research/private/corpus-2000.private.json"
NOTES = ROOT / "research/private/source-notes"
PLATFORMS = ("51job", "boss", "liepin")
SEED = 20261108  # Reserved for an approved later design; step 0 is deterministic.


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()


def digest(data):
    return hashlib.sha256(data).hexdigest()


def populated(value):
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (list, dict)):
        return bool(value)
    return True


def date_range(rows, field):
    # Recorded calendar dates; not independently verified publication dates.
    values = [str(r[field])[:10] for r in rows if populated(r.get(field))]
    dates = [v for v in values if re.fullmatch(r"\d{4}-\d{2}-\d{2}", v)]
    return {"nonempty_n": len(values), "iso_date_prefix_n": len(dates),
            "min_recorded_date": min(dates) if dates else None,
            "max_recorded_date": max(dates) if dates else None}


def inventory(rows, fields):
    return {"n": len(rows), "fields": {
        f: {"present_n": sum(f in r for r in rows),
            "nonempty_n": sum(populated(r.get(f)) for r in rows),
            "types": dict(sorted(Counter(type(r.get(f)).__name__ for r in rows).items()))}
        for f in fields},
        "employer_nonempty_n": sum(populated(r.get("employer")) for r in rows),
        "distinct_employer_strings": len({r["employer"] for r in rows if populated(r.get("employer"))}),
        "dates": {f: date_range(rows, f) for f in (
            "posting_date", "published_at", "first_scraped_at", "retrieval_date",
            "source_collected_at", "source_updated_at", "archive_manifest_generated_at")}}


def main():
    ignored = subprocess.run(["git", "check-ignore", "-q", str(INPUT.relative_to(ROOT))], cwd=ROOT)
    if ignored.returncode != 0 or git("ls-files", "research/private"):
        raise SystemExit("STOP: research/private is not safely excluded from tracking.")
    raw = INPUT.read_bytes()
    source = json.loads(raw)
    rows = source["records"]
    if not rows or any(r.get("platform") not in PLATFORMS for r in rows):
        raise SystemExit("STOP: empty input or an unregistered source category.")
    if any(not isinstance(r.get("body"), str) or not r["body"].strip() for r in rows):
        raise SystemExit("STOP: a record lacks a nonempty body. No record text is printed.")
    hashes = [digest(r["body"].encode()) for r in rows]
    norm = lambda text: re.sub(r"[\W_]+", "", unicodedata.normalize("NFKC", text).lower())
    normalized = [digest(norm(r["body"]).encode()) for r in rows]
    body_mismatches = sum(h != r.get("body_sha256") for h, r in zip(hashes, rows))
    normalized_mismatches = sum(h != r.get("normalized_body_hash") for h, r in zip(normalized, rows))
    fields = sorted({k for r in rows for k in r})
    per_source = {p: inventory([r for r in rows if r["platform"] == p], fields) for p in PLATFORMS}
    hf = json.loads((NOTES / "51job-dataset-metadata.json").read_text())
    gh = json.loads((NOTES / "github-manifest.json").read_text())
    sampling = json.loads((NOTES / "github-sampling-summary.json").read_text())
    evidence = [{"local_file": str(p.relative_to(ROOT)), "sha256": digest(p.read_bytes())}
                for p in sorted(NOTES.iterdir()) if p.is_file()]
    stamp = datetime.now(timezone.utc).isoformat()
    provenance = {
        "51job": {
            "dataset": hf["id"], "dataset_url": "https://huggingface.co/datasets/" + hf["id"],
            "recorded_revision": hf["sha"], "dataset_metadata_last_modified": hf.get("lastModified"),
            "shard": "shards/source=51job/dt=2026-10-25/part-0.parquet",
            "selection": "Existing deterministic-hash subset of 1,000 eligible original-language records; no new sampling in this audit.",
            "declared_license": hf.get("cardData", {}).get("license", "unknown"),
            "third_party_jd_use_permission": "unknown", "permission_confirmation_required": True,
            "license_evidence": "The saved card says license: other; its caveat does not grant redistribution of job text.",
            "first_party_revalidation": "not performed", "employer_and_city": "not retained in this corpus",
            "date_basis": "Publisher-recorded posting_date and first_scraped_at; local retrieval_date is a different field.",
            "evidence_files": ["51job-dataset-README.md", "51job-dataset-metadata.json", "51job-precursor-sample-audit.json"],
        },
        "boss_and_liepin": {
            "dataset": "zeitvex/JobResearchHub", "dataset_url": "https://github.com/zeitvex/JobResearchHub",
            "recorded_revision": "unknown", "fetch_reference": "main (not an immutable commit)",
            "archive_manifest_generated_at": gh["generated_at"],
            "archive_manifest_total": gh["jobs"], "archive_shards": len(gh["shards"]),
            "selection": "Existing source/role quotas: 500 per platform, up to 10 per normalized employer string; not a random market sample.",
            "recorded_selection_counts": {p: {k: sampling["selection"][p][k]
                for k in ("selected_n", "employers", "max_per_employer")} for p in ("boss", "liepin")},
            "declared_code_license": "MIT (scope stated in saved DATA_NOTICE)",
            "third_party_jd_use_permission": "unknown", "permission_confirmation_required": True,
            "license_evidence": "DATA_NOTICE explicitly excludes third-party JD rights from its code/documentation licence.",
            "date_basis": "source_collected_at is collection time; source_updated_at and manifest time are not posting dates.",
            "first_party_revalidation": "not performed", "independent_fullness_check": "not performed",
            "local_download_timestamp": "unknown",
            "evidence_files": ["github-DATA_NOTICE.md", "github-manifest.json", "github-download-audit.json", "github-sampling-summary.json"],
        },
    }
    payload = {
        "schema_version": "wlo-input-audit-v1", "step": 0, "generated_at_utc": stamp,
        "status": "input_inventory_complete; permission_and_design_confirmation_pending",
        "input": {"local_file": str(INPUT.relative_to(ROOT)), "sha256": digest(raw), "bytes": len(raw),
                  "assembled_date_recorded": source["metadata"].get("date"),
                  "unit": "Archived advertisement record, not a verified unique vacancy or worker"},
        "sample": {"n": len(rows), "by_platform": dict(sorted(Counter(r["platform"] for r in rows).items())),
                   "unique_record_ids": len({r["id"] for r in rows}), "unique_exact_bodies": len(set(hashes)),
                   "unique_normalized_bodies": len(set(normalized)),
                   "normalization": "Unicode NFKC, lower(), remove [\\W_]+ with Python Unicode regex",
                   "body_hash_mismatch_n": body_mismatches, "stored_normalized_hash_mismatch_n": normalized_mismatches,
                   "fresh_primary_scrapes": 0, "semantic_gold_standard": False},
        "all_records": inventory(rows, fields), "by_source": per_source,
        "provenance": provenance, "source_evidence": evidence,
        "gaps_requiring_confirmation": [
            "The scope of permission for third-party JD analysis and derived public material is unknown for both archives.",
            "The GitHub archive commit and local download timestamp were not recorded; file hashes and manifest time remain available.",
            "51job lacks employer and city in this corpus; BOSS/Liepin lack posting dates. Dates and source mix cannot be separated as platform effects.",
            "No reliable salary field, validated occupation labels, human gold standard or reviewed-public-paraphrase sign-off is present.",
            "The saved 51job card and precursor sample audit describe other snapshot totals; the current counts are recomputed from this exact input.",
        ],
        "excluded_license_evidence": "Bingapplier/china-ai-jobs was evaluated elsewhere but contributes no records here; its CC-BY card cannot license this corpus.",
        "privacy": {"raw_records_public": False, "private_ignored": True, "private_tracked_files": 0,
                    "public_payload_contains_record_ids_or_employer_names": False},
        "next_action": "Review permissions and exploratory design. Stop before step 2; no human labels or model coding generated.",
    }
    (ROOT / "research/aggregates/inputs.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    log = {"step": 0, "generated_at_utc": stamp, "repository_head": git("rev-parse", "HEAD"),
           "script": "research/scripts/00_audit_inputs.py", "script_sha256": digest(Path(__file__).read_bytes()),
           "script_is_committed_at_head": bool(git("ls-files", "research/scripts/00_audit_inputs.py")),
           "input_sha256": digest(raw), "source_evidence": evidence, "seed_reserved_not_used": SEED,
           "model": None, "model_call_date": None, "prompt_hash": None, "temperature": None, "model_calls": 0,
           "output": "research/aggregates/inputs.json", "human_labels_generated": 0,
           "raw_text_or_record_ids_logged": False, "waiting_for": ["source permissions", "research design confirmation"]}
    (ROOT / "research/logs/00-audit.json").write_text(json.dumps(log, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"step": 0, "n": len(rows), "sources": payload["sample"]["by_platform"],
                      "hash_mismatches": body_mismatches + normalized_mismatches,
                      "permission": "unknown; confirmation required", "model_calls": 0}))
    if body_mismatches or normalized_mismatches:
        raise SystemExit("STOP: stored content hashes do not match the private input.")


if __name__ == "__main__":
    main()
