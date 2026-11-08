#!/usr/bin/env python3
"""Publish literal counts only; does not advance human-gated semantic coding.

Run from the repository root: python3 research/scripts/03_public_lexical.py
No model, network or human-label writes. Output contains no individual records.
"""
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import statistics
import subprocess

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = "research/scripts/03_public_lexical.py"
def read(p): return json.loads((ROOT/p).read_text())
def save(p, value):
    dest=ROOT/p
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(value,ensure_ascii=False,indent=2)+"\n")

spec=importlib.util.spec_from_file_location("terms",ROOT/"research/scripts/02_terms.py")
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
corpus=ROOT/"research/private/corpus-2000.private.json"
raw=corpus.read_bytes()
input_hash=hashlib.sha256(raw).hexdigest()
rows=json.loads(raw)
if isinstance(rows,dict): rows=rows["records"]
counts=read("research/aggregates/term_counts.json")
config=read("research/config/terms.yaml")
assert input_hash==counts["input_sha256"], "Re-run input audit and counts for changed corpus"
assert len(rows)==counts["corpus_ads"]
texts=[module.normalize(r["body"]) for r in rows]
n=len(rows)
stats={}
def stat(key,value,unit="advertisements",method="NFKC/casefold body substring; each ad counted once",denominator=None):
    stats[key]={"value":value,"unit":unit,"method":method,"source":"research/aggregates/term_counts.json", "script":SCRIPT,"input_sha256":input_hash}
    if denominator is not None: stats[key]["n"]=denominator

stat("corpus.n",n,method="Audited archive records")
stat("corpus.dictionary_terms",len(config["terms"]),"terms",method="Fixed approved term list")
stat("corpus.candidate_terms",len(config["terms"]),"terms",method="Fixed approved term list, not a new ranking search")
for source,number in counts["by_source"].items(): stat("corpus.sources."+source,number)
for entry in counts["terms"]:
    term=entry["term"]
    assert sum(term in t for t in texts)==entry["literal_ads"]
    stat(f"term.{term}.ads",entry["literal_ads"],denominator=n)
    for field in ("n_checked","k_correct","precision"):
        stat(f"term.{term}.{field}",None,"unavailable",method="Human review pending; blank fields are not zero judgments")
stat("review.sample_pairs",sum(e["review_sample_n"] for e in counts["terms"]),"ad–term pairs",method="Previously generated fixed-seed review packet; not completed annotations")
stat("design.h1.threshold",0.5,"planned proportion",method="Approved exploratory design threshold; not an estimate")

def table(group,first,second):
    a=sum(first in t and second in t for t in group)
    b=sum(first in t and second not in t for t in group)
    c=sum(first not in t and second in t for t in group)
    d=len(group)-a-b-c
    ratio=(a*d)/(b*c) if b*c else None
    ci=None if not ratio or min(a,b,c,d)==0 else [math.exp(math.log(ratio)+s*1.96*math.sqrt(sum(1/x for x in (a,b,c,d)))) for s in (-1,1)]
    return {"cells":[[a,b],[c,d]],"n":len(group),"or":ratio,"or_ci95":ci}

tables=[]
for first,second in (("抗压","协调"),("数据","沟通")):
    result=table(texts,first,second)
    (a,b),(c,d)=result["cells"]
    prefix=f"assoc.{first}_{second}."
    names=("pressure_n","pressure_coordination_n","other_n","other_coordination_n","pressure_rate","other_rate") if first=="抗压" else ("focus_n","both_n","other_n","other_both_n","focus_rate","other_rate")
    values=(a+b,a,c+d,c,a/(a+b),c/(c+d))
    for key,value in zip(names,values):
        stat(prefix+key,value,"proportion" if key.endswith("rate") else "advertisements",denominator=(a+b if key==names[4] else c+d) if key.endswith("rate") else n)
        stats[prefix+key]["source"]="research/aggregates/lexical-cross-tabs.json"
    stat(prefix+"or",result["or"],"odds ratio",method="Unadjusted ad-level cross-product ratio a*d/(b*c)")
    stats[prefix+"or"]["source"]="research/aggregates/lexical-cross-tabs.json"
    result.update({"terms":[first,second],"unit":"advertisement","meaning":"literal co-occurrence; no semantic or causal claim"})
    strata=[]
    for source in sorted(counts["by_source"]):
        subset=[t for r,t in zip(rows,texts) if r["platform"]==source]
        median=statistics.median(map(len,subset))
        for label,part in (("at_or_below_median",[t for t in subset if len(t)<=median]),("above_median",[t for t in subset if len(t)>median])):
            strata.append({"source":source,"length_group":label,"median_characters":median,**table(part,first,second)})
    result["source_length_strata"]=strata
    tables.append(result)
assert all(x["or"] and x["or"]>1 for x in tables[0]["source_length_strata"]), "Revise page claim: direction differs by source/length"
save("research/aggregates/lexical-cross-tabs.json",{"input_sha256":input_hash,"normalization":config["normalization"],"comparison_status":"Exploratory pairs revisited after seeing earlier data; unadjusted","tables":tables})
save("research/aggregates/stats.json",stats)
save("research/logs/public-lexical-run.json",{"script":SCRIPT,"script_sha256":hashlib.sha256((ROOT/SCRIPT).read_bytes()).hexdigest(),"base_commit":subprocess.check_output(["git","rev-parse","HEAD"],cwd=ROOT,text=True).strip(),"input_sha256":input_hash,"seed":config["seed"],"model":None,"model_calls":0,"prompt_hash":None,"temperature":None,"outputs":["research/aggregates/stats.json","research/aggregates/lexical-cross-tabs.json"],"human_annotations_written":0})
print(json.dumps({"ads":n,"terms":len(config["terms"]),"comparisons":[{"terms":t["terms"],"cells":t["cells"]} for t in tables],"human_labels_written":0},ensure_ascii=False))
