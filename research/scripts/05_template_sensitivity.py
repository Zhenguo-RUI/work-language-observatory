#!/usr/bin/env python3
"""Exploratory exact/near clause reuse. Raw clauses stay in research/private/."""
import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import subprocess
import unicodedata
import unittest
from lexical_statistics import contingency

ROOT=Path(__file__).resolve().parents[2]
SCRIPT="research/scripts/05_template_sensitivity.py"
OUTPUT="research/aggregates/template-sensitivity.json"
THRESHOLD=.8
MIN_ADS=3
PAIRS=(("抗压","协调"),("数据","沟通"))
CATEGORIES=("known_employers", "cross_source", "unknown_within_source")

def normalize(text): return unicodedata.normalize("NFKC",text).casefold()
def signature(text): return "".join(c for c in text if not(c.isspace() or c.isnumeric() or unicodedata.category(c).startswith("P")))
def split(text): return [p.strip() for p in re.split(r"[。.;!?\r\n]+",normalize(text)) if p.strip()]
def known_employer(row):
    name=normalize(str(row.get("employer") or "")).strip()
    return name if name not in {"", "-", "--", "unknown", "none", "nan", "未知", "保密", "保密公司", "公司保密", "未提供", "暂无", "不详"} else None

def build_clauses(rows):
    names=sorted({n for r in rows if (n:=known_employer(r))},key=lambda n:(-len(n),n))
    pattern=re.compile("|".join(re.escape(n) for n in names)) if names else None
    documents=[];index=defaultdict(set);masked=0
    for i,row in enumerate(rows):
        document=[]
        for text in split(row["body"]):
            replaced,n=pattern.subn("companytoken",text) if pattern else (text,0)
            masked+=int(n>0);key=signature(replaced)
            document.append((text,key))
            if key:index[key].add(i)
        documents.append(document)
    return documents,index,masked

def grams(text): return {text[i:i+5] for i in range(len(text)-4)}

def near_neighbors(keys):
    """Exact Jaccard with a lossless globally ordered prefix candidate filter.

    Only direct neighbors count; no connected-component/transitive expansion.
    Short clauses (<5 chars) have exact matching only.
    """
    sets={k:grams(k) for k in keys if len(k)>=5}
    freq=Counter(g for s in sets.values() for g in s)
    postings=defaultdict(list);neighbors=defaultdict(set);checked=edges=0
    for key in sorted(sets,key=lambda k:(len(sets[k]),k)):
        own=sets[key];ordered=sorted(own,key=lambda g:(freq[g],g))
        prefix=ordered[:len(own)-math.ceil(THRESHOLD*len(own))+1]
        candidates={other for gram in prefix for other in postings[gram] if len(sets[other])>=THRESHOLD*len(own)}
        for other in candidates:
            checked+=1;intersection=len(own & sets[other]);union=len(own | sets[other])
            if intersection/union>=THRESHOLD:
                neighbors[key].add(other);neighbors[other].add(key);edges+=1
        for gram in prefix:postings[gram].append(key)
    return neighbors,{"candidate_pairs_checked":checked,"near_edges":edges}

def classify_ads(ads,rows):
    if len(ads)<MIN_ADS:return set()
    result=set();employers={n for i in ads if (n:=known_employer(rows[i]))}
    if len(employers)>=2:result.add("known_employers")
    if len({rows[i]["platform"] for i in ads})>=2:result.add("cross_source")
    unknown=Counter(rows[i]["platform"] for i in ads if known_employer(rows[i]) is None)
    if any(n>=MIN_ADS for n in unknown.values()):result.add("unknown_within_source")
    return result

def hit_count(text,term):
    return sum(text.startswith(term,i) for i in range(len(text)))

def table(documents,first,second):
    cells=[[0,0],[0,0]]
    for document in documents:
        x=any(first in text for text in document);y=any(second in text for text in document)
        cells[0 if x else 1][0 if y else 1]+=1
    return contingency(cells)

def analyze(rows,terms):
    documents,index,masked=build_clauses(rows)
    neighbors,search=near_neighbors(index)
    flags={};exact_flags={}
    for key,ads in index.items():
        exact_flags[key]=classify_ads(ads,rows)
        support=set(ads)
        for other in neighbors.get(key,()):support.update(index[other])
        flags[key]=classify_ads(support,rows)
    affected={i for i,d in enumerate(documents) if any(flags.get(k) for _,k in d)}
    filtered=[[text for text,key in d if not flags.get(key)] for d in documents]
    original=[[text for text,key in d] for d in documents]
    category_counts={cat:{"signatures":sum(cat in cs for cs in flags.values()),
                         "ads":sum(any(cat in flags.get(key,set()) for _,key in d) for d in documents),
                         "clause_occurrences":sum(cat in flags.get(key,set()) for d in documents for _,key in d)} for cat in CATEGORIES}
    term_results=[]
    for term in terms:
        total=sum(hit_count(normalize(r["body"]),term) for r in rows)
        clause_total=sum(hit_count(t,term) for d in documents for t,_ in d)
        assert total==clause_total,"Splitting changed term occurrence denominator"
        inside=sum(hit_count(t,term) for d in documents for t,k in d if flags.get(k))
        ads=sum(any(term in t for t,_ in d) for d in documents)
        template_ads=sum(any(term in t and flags.get(k) for t,k in d) for d in documents)
        term_results.append({"term":term,"literal_occurrences":total,"candidate_occurrences":inside,
                             "candidate_rate":inside/total if total else None,"literal_ads":ads,"candidate_ads":template_ads,
                             "by_category":{cat:sum(hit_count(t,term) for d in documents for t,k in d if cat in flags.get(k,set())) for cat in CATEGORIES}})
    result={"n":len(rows),"method":{"status":"Exploratory, chosen after earlier results; no human or model semantic classification",
              "split":"NFKC/casefold; split 。 . ; ! ? CR LF, preserve commas; empty fragments discarded",
              "company_mask":"Exact matches to observed nonempty employer-field names replaced by companytoken before signature creation; aliases and unobserved company names are not inferred",
              "signature":"Remove Unicode punctuation, numeric characters and whitespace; no minimum clause length for exact matching",
              "near":"Set of character 5-grams; exact Jaccard >=0.8; clauses shorter than 5 characters exact-only; direct neighborhood, never transitive components",
              "threshold":"At least 3 distinct advertisements; duplicate clauses inside an ad do not increase support",
              "categories":{"known_employers":"At least 2 distinct observed employer names among supporting ads", "cross_source":"At least 2 archive sources among supporting ads", "unknown_within_source":"At least 3 ads with unavailable employer in one archive source"},
              "overlap":"Categories can overlap; union counts count each clause/ad once; provenance of copying is unconfirmed",
              "difference_from_04":"04 used exact signatures with >=12 Han characters and no company masking. This analysis adds company masking, near matches and explicit provenance categories; it includes short exact repeats.",
              "limit":"Repeated language may be substantively meaningful. Short headings and labels qualify under the exact rule: affected-ad counts do not mean that job duties were copied. Unobserved aliases and approximate paraphrases can be missed. These are archive-source comparisons, not identified platform effects."},
            "summary":{"unique_signatures":len(index),"candidate_signatures":sum(bool(v) for v in flags.values()),"exact_candidate_signatures":sum(bool(v) for v in exact_flags.values()),
                       "ads_affected":len(affected),"clauses_removed":sum(bool(flags.get(k)) for d in documents for _,k in d),
                       "empty_ads":sum(not d for d in filtered),"company_masked_clauses":masked,
                       "short_candidate_clauses":sum(bool(flags.get(k)) and len(k)<12 for d in documents for _,k in d),
                       "ads_with_long_candidates":sum(any(flags.get(k) and len(k)>=12 for _,k in d) for d in documents),**search},
            "categories":category_counts,"terms":term_results,
            "comparisons":[{"terms":[x,y],"before":table(original,x,y),"after":table(filtered,x,y)} for x,y in PAIRS],
            "source_summary":{s:{"n":sum(r["platform"]==s for r in rows),"ads_affected":sum(i in affected for i,r in enumerate(rows) if r["platform"]==s)} for s in sorted({r["platform"] for r in rows})},
            "human_annotations_read":0,"human_annotations_written":0,"model_calls":0}
    private=[{"record_id":r.get("id",str(i)),"clauses":[{"text":t,"signature":k,"candidate_categories":sorted(flags.get(k,set()))} for t,k in d]} for i,(r,d) in enumerate(zip(rows,documents))]
    return result,private

def run():
    raw=(ROOT/"research/private/corpus-2000.private.json").read_bytes();digest=hashlib.sha256(raw).hexdigest()
    counts=json.loads((ROOT/"research/aggregates/term_counts.json").read_text())
    assert digest==counts["input_sha256"]=="ae247a10263b905b59f62a0fa82559257e3998ccb7f43f775177b12a740c7ef3"
    rows=json.loads(raw);rows=rows["records"] if isinstance(rows,dict) else rows
    assert len(rows)==2000 and len({r["id"] for r in rows})==2000
    assert all(r["platform"] in {"51job","boss","liepin"} for r in rows)
    terms=[t["term"] for t in counts["terms"]]
    result,private=analyze(rows,terms);result["input_sha256"]=digest
    previous=json.loads((ROOT/"research/aggregates/lexical-cross-tabs.json").read_text())
    for item in result["comparisons"]:
        assert item["before"]["cells"]==next(x["cells"] for x in previous["tables"] if x["terms"]==item["terms"])
    def save(path,value):
        p=ROOT/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(value,ensure_ascii=False,indent=2)+"\n")
    save(OUTPUT,result);save("research/private/template-sensitivity-20261109/clauses.private.json",private)
    stats=json.loads((ROOT/"research/aggregates/stats.json").read_text())
    def add(key,value,unit,denom,method):
        stats[key]={"value":value,"unit":unit,"method":method,"source":OUTPUT,"script":SCRIPT,"input_sha256":digest,"n":denom}
    for key,value in result["summary"].items():add("template."+key,value,"count",len(rows),"Exact/near repeated-clause candidate detection; category origins unconfirmed")
    for entry in result["terms"]:
        for key in ("literal_occurrences","candidate_occurrences","candidate_rate","literal_ads","candidate_ads"):
            rate=key=="candidate_rate";denom=entry["literal_occurrences"] if rate or key.endswith("occurrences") else len(rows)
            add("template.term."+entry["term"]+"."+key,entry[key],"proportion" if rate else "occurrences" if key.endswith("occurrences") else "advertisements",denom,"Literal term occurrences in candidate repeated clauses / all literal occurrences; not semantic-use proportion")
    for item in result["comparisons"]:
        prefix="template.assoc."+"_".join(item["terms"])+"."
        for stage in ("before","after"):
            t=item[stage]
            for key in ("n","first_n","other_n","first_rate","other_rate","or"):
                denom=t["first_n"] if key=="first_rate" else t["other_n"] if key=="other_rate" else t["n"]
                add(prefix+stage+"."+key,t[key],"proportion" if key.endswith("rate") else "odds ratio" if key=="or" else "advertisements",denom,"Ad-level lexical 2x2 before/after removing union of repeated-clause candidates; all ads retained")
                if key=="or":stats[prefix+stage+"."+key].update({"ci":t["or_ci95"],"ci_method":t["ci_method"]})
    save("research/aggregates/stats.json",stats)
    save("research/logs/05-template-sensitivity.json",{"timestamp":datetime.now(timezone.utc).isoformat(),"script":SCRIPT,"script_sha256":hashlib.sha256((ROOT/SCRIPT).read_bytes()).hexdigest(),"base_commit":subprocess.check_output(["git","rev-parse","HEAD"],cwd=ROOT,text=True).strip(),"input_sha256":digest,"seed":None,"sampling":"deterministic census","model":None,"model_calls":0,"prompt_hash":None,"temperature":None,"human_annotations_written":0,"outputs":[OUTPUT,"research/aggregates/stats.json","research/private/template-sensitivity-20261109/clauses.private.json"]})
    print(json.dumps({"summary":result["summary"],"categories":result["categories"],"comparisons":result["comparisons"],"term_rates":[{"term":t["term"],"count":t["candidate_occurrences"],"denominator":t["literal_occurrences"],"rate":t["candidate_rate"]} for t in result["terms"]]},ensure_ascii=False))

class Checks(unittest.TestCase):
    def test_distinct_ads_not_within_ad_repetition(self):
        rows=[{"body":"耐心细致完成客户问题处理。"*4,"employer":"甲公司","platform":"boss"},{"body":"耐心细致完成客户问题处理","employer":"乙公司","platform":"boss"}]
        self.assertEqual(analyze(rows,["客户"])[0]["summary"]["ads_affected"],0)
    def test_three_categories_and_company_mask(self):
        rows=[{"body":name+"要求耐心细致完成客户问题处理","employer":name,"platform":s} for name,s in [("甲公司","boss"),("乙公司","liepin"),("丙公司","boss")]]
        result,_=analyze(rows,["客户"])
        self.assertEqual(result["summary"]["ads_affected"],3)
        self.assertEqual(result["categories"]["known_employers"]["ads"],3)
        self.assertEqual(result["categories"]["cross_source"]["ads"],3)
        self.assertEqual(result["categories"]["unknown_within_source"]["ads"],0)
        unknown=[{"body":"耐心细致完成客户问题处理","employer":None,"platform":"51job"}]*3
        self.assertEqual(analyze(unknown,["客户"])[0]["categories"]["unknown_within_source"]["ads"],3)
    def test_prefix_search_matches_bruteforce(self):
        keys={"工作职责要求认真细致完成客户问题处理并记录全过程结果"+suffix for suffix in ["", "甲", "乙", "甲乙", "甲丙", "甲乙丙丁", "不同结尾部分"]}|{"短句","完全无关的另一件事情"}
        near,_=near_neighbors(keys)
        expected={(a,b) for a in keys for b in keys if a<b and len(a)>=5 and len(b)>=5 and len(grams(a)&grams(b))/len(grams(a)|grams(b))>=.8}
        actual={(a,b) for a,bs in near.items() for b in bs if a<b}
        self.assertEqual(actual,expected)
    def test_no_cross_ad_join_and_no_transitive_neighbors(self):
        self.assertEqual(table([["抗压"],["协调"]],"抗压","协调")["cells"],[[0,1],[1,0]])
        keys={"abcdefghij", "abcdefghijk", "abcdefghijkl"}
        near,_=near_neighbors(keys)
        self.assertIn("abcdefghijk",near["abcdefghij"])
        self.assertIn("abcdefghijkl",near["abcdefghijk"])
        self.assertNotIn("abcdefghijkl",near.get("abcdefghij",set()))
    def test_empty_ads_preserved_and_20term_denominator(self):
        rows=[{"body":"抗压并沟通协调处理客户问题","platform":"51job","employer":None}]*3
        result,_=analyze(rows,["抗压","沟通"])
        self.assertEqual(result["summary"]["empty_ads"],3)
        self.assertEqual(result["comparisons"][0]["after"]["n"],3)
        self.assertEqual(result["terms"][0]["candidate_rate"],1)

if __name__=="__main__":
    p=argparse.ArgumentParser();g=p.add_mutually_exclusive_group(required=True);g.add_argument("--run",action="store_true");g.add_argument("--self-test",action="store_true");args=p.parse_args()
    if args.self_test:unittest.main(argv=[__file__])
    else:run()
