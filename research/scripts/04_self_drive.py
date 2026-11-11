#!/usr/bin/env python3
"""Exploratory vocabulary extension; original hypotheses and counts stay fixed."""
import hashlib,json,unicodedata
from pathlib import Path
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[2]
def read(p): return json.loads((ROOT/p).read_text())
def save(p,x): (ROOT/p).write_text(json.dumps(x,ensure_ascii=False,indent=2)+"\n")
def sha(b): return hashlib.sha256(b).hexdigest()
rules_path=ROOT/"research/config/self-drive-v1.json"
assert sha(rules_path.read_bytes())=="c68e5f4978edf379e7c24038784b5545d1835e60b73d4b5f918e19fdceae015b", "Frozen rule changed"
rules=read("research/config/self-drive-v1.json")
raw=(ROOT/"research/private/corpus-2000.private.json").read_bytes(); rows=json.loads(raw)["records"]
counts=read("research/aggregates/term_counts.json"); assert sha(raw)==counts["input_sha256"] and len(rows)==counts["corpus_ads"]
def occurrences(text):
 text=unicodedata.normalize("NFKC",text).casefold(); spans=set()
 for alias in sorted(rules["aliases"],key=len,reverse=True):
  start=0
  while (start:=text.find(alias,start))>=0:
   end=start+len(alias)
   if not any(a<=start and b>=end for a,b in spans): spans.add((start,end))
   start+=1
 return len(spans)
def summary(group):
 n=[occurrences(x["body"]) for x in group]; ads=sum(x>0 for x in n); occ=sum(n)
 return {"corpus_ads":len(group),"literal_ads":ads,"literal_occurrences":occ,"candidate_kept_ads":ads,"candidate_kept_occurrences":occ,"excluded_candidate_ads":0,"excluded_candidate_occurrences":0,"excluded_only_ads":0,"mixed_ads":0}
entry={"term":"自驱","group":"品质与工作方式","deep_coding":False,**summary(rows),"by_source":{s:summary([x for x in rows if x["platform"]==s]) for s in counts["by_source"]},"review_sample_n":0,"exploratory":True,"aliases":rules["aliases"]}
entry.pop("corpus_ads")
counts["terms"]=[x for x in counts["terms"] if x["term"]!="自驱"]+[entry];save("research/aggregates/term_counts.json",counts)
config=read("research/config/terms.yaml")
if not any(x["term"]=="自驱" for x in config["terms"]): config["terms"].append({"term":"自驱","group":"品质与工作方式","deep_coding":False,"exclude_compounds":[],"aliases":rules["aliases"],"exploratory":True,"rule_file":"research/config/self-drive-v1.json"})
config["scope"]="Original vocabulary plus one post-plan exploratory self-drive entry; the original six deep-coding terms and H1–H3 remain unchanged.";save("research/config/terms.yaml",config)
stats=read("research/aggregates/stats.json")
for key in ["corpus.dictionary_terms","corpus.candidate_terms"]: stats[key]={**stats[key],"value":len(config["terms"]),"method":"Original vocabulary plus frozen post-plan self-drive extension","script":"research/scripts/04_self_drive.py"}
for field,value in [("ads",entry["literal_ads"]),("n_checked",None),("k_correct",None),("precision",None)]: stats["term.自驱."+field]={"value":value,"unit":"advertisements" if field=="ads" else "unavailable","method":"NFKC/casefold; any frozen alias, once per ad" if field=="ads" else "Human review pending","source":"research/aggregates/term_counts.json","script":"research/scripts/04_self_drive.py","input_sha256":sha(raw),"n":len(rows)}
save("research/aggregates/stats.json",stats)
save("research/logs/self-drive-extension.json",{"generated":datetime.now(timezone.utc).isoformat(),"input_sha256":sha(raw),"rule_sha256":sha(rules_path.read_bytes()),"rule_commit":"unconfirmed; local git command timed out","model":"no API used; corpus counts by deterministic rules, prose drafted by coding agent","paid_calls":0,"exploratory":True,"hypotheses_changed":False,"human_labels_written":False})
print(json.dumps({"ads":entry["literal_ads"],"terms":len(config["terms"]),"private_text_printed":False}))
