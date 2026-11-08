"""Publish numeric diagnostics from saved rule/AI comparisons, never human estimates."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[2]
a=json.loads((root/'research/aggregates/automated-coding.json').read_text())
s=json.loads((root/'research/aggregates/stats.json').read_text())
def add(k,v,unit):
 s['auto.'+k]={'value':v,'unit':unit,'method':'rule-candidate diagnostics with AI review; not human validation','source':'research/aggregates/automated-coding.json','script':'research/scripts/06_public_diagnostics.py','input_sha256':a['input_sha256']}
for k in ['all_occurrences','development_excluded_n','analysis_occurrences'] : add(k,a[k],'occurrences')
for word in ['抗压','沟通','责任心']:
 t=a['by_term'][word]
 for k in ['eligible_person_or_work_n','d3_named_role_n','d3_broad_role_n']:add(word+'.'+k,t[k],'rule-flagged occurrences')
 add(word+'.narrow_rate',t['d3_named_role_n']/t['eligible_person_or_work_n'],'share of rule-eligible occurrences')
 add(word+'.broad_rate',t['d3_broad_role_n']/t['eligible_person_or_work_n'],'share of rule-eligible occurrences')
for k in ['n','agreement_n','agreement_rate']:add('D5.'+k,a['rule_vs_ai_review']['D5'][k],'AI-reviewed occurrences' if k!='agreement_rate' else 'sample agreement')
for k in ['ai_positive_n','rule_caught_n']:add('D5.'+k,a['authority_review_diagnostic'][k],'AI-reviewed occurrences')
(root/'research/aggregates/stats.json').write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n')

for word in ['抗压','沟通','责任心']:
 for suffix in ['narrow_rate','broad_rate']:
  s['auto.'+word+'.'+suffix]['n']=a['by_term'][word]['eligible_person_or_work_n']
s['auto.D5.agreement_rate']['n']=a['rule_vs_ai_review']['D5']['n']
(root/'research/aggregates/stats.json').write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n')
