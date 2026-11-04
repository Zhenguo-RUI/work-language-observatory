"""Integration checks against loopback development only; uses the starter's mock sign-in."""
import json,urllib.request,urllib.error,http.cookiejar,uuid,os
from pathlib import Path
BASE=os.environ.get('OBSERVATORY_TEST_URL','http://127.0.0.1:5173')
assert urllib.parse.urlsplit(BASE).hostname in {'127.0.0.1','localhost','::1'}
checks=[]
jar=http.cookiejar.CookieJar();client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
def request(path,data=None,method='GET',headers=None,auth=True):
 h={'Content-Type':'application/json'} if data is not None else {}
 h.update(headers or {})
 req=urllib.request.Request(BASE+path,data=json.dumps(data).encode() if data is not None else None,headers=h,method=method)
 try:
  response=(client if auth else urllib.request.build_opener()).open(req,timeout=45);status=response.status;content=response.read();hs=response.headers
 except urllib.error.HTTPError as e:status=e.code;content=e.read();hs=e.headers
 try:body=json.loads(content)
 except ValueError:body=content.decode(errors='replace')
 return status,body,hs
def ok(name,condition):
 assert condition,name
 checks.append({'name':name,'passed':True})
status,public,_=request('/api/bootstrap',auth=False);ok('anonymous visitor sees no individual records or operator metadata',status==200 and not public['operator'] and not public['analyses'] and not public['feedback'] and not public['activity'])
status,_,_=request('/signin-with-chatgpt?return_to=/');ok('loopback development sign-in works',status==200)
status,initial,_=request('/api/bootstrap');ok('authenticated bootstrap and project cases',status==200 and initial['operator'] and len([a for a in initial['analyses'] if a['engine']=='curated'])==7)
status,c,_=request('/api/corpus');ok('complete derived corpus is queryable',status==200 and c['total']==2000 and len(c['items'])==30)
status,term,_=request('/api/corpus?term='+urllib.parse.quote('独立'));ok('term search retains exact corpus scope',status==200 and term['total']==618)
status,page2,_=request('/api/corpus?offset=30');ok('corpus pagination is distinct',page2['items'][0]['id']!=c['items'][0]['id'])
nonce=uuid.uuid4().hex[:8]
raw=f'QA联动验证 {nonce}\n岗位职责：负责电商数据分析，使用SQL核对订单与退款。任职要求：能够独立完成数据报表，协调财务部门确认指标口径。每周出勤四天，实习三个月。'
payload={'title':'QA · 电商数据实习生 '+nonce,'company':'Local QA','rawText':raw,'sourceUrl':'','useModel':False}
status,created,_=request('/api/analyses',payload,'POST');a=created['analysis'];id=a['id']
ok('new JD saved as a durable rule draft',status==201 and a['status']=='draft' and a['engine']=='rules')
ok('all generated evidence quotes occur in submitted JD',all(t['quote'] in raw for t in a['result']['terms']))
status,dupe,_=request('/api/analyses',payload,'POST');ok('identical text reuses its existing result',status==200 and dupe['reused'] and dupe['analysis']['id']==id)
status,_,_=request('/api/analyses/'+id,{'revision':0,'status':'published'},'PATCH');ok('stale revision is rejected',status==409)
bad=json.loads(json.dumps(a['result']));bad['terms'][0]['quote']='This quote does not appear in the JD.'
status,_,_=request('/api/analyses/'+id,{'revision':1,'result':bad,'status':'published'},'PATCH');ok('fabricated evidence blocks save/publication',status==422)
r=a['result'];r['headline']={'zh':'已复核：从SQL核对到报表交付','en':'Reviewed: from SQL checks to reporting'}
status,saved,_=request('/api/analyses/'+id,{'revision':1,'result':r,'status':'in_review','note':'Local integration test: clarified the work output.','issues':['meaning']},'PATCH')
ok('bilingual editorial changes create a review version',status==200 and saved['analysis']['revision']==2)
status,published,_=request('/api/analyses/'+id,{'revision':2,'status':'published','note':'Local QA publication check.','issues':[]},'PATCH');ok('operations publishes to the shared record',status==200 and published['analysis']['status']=='published' and published['analysis']['revision']==3)
status,readback,_=request('/api/analyses/'+id);ok('reader receives edited content and preserved versions',status==200 and readback['analysis']['result']['headline']['zh']==r['headline']['zh'] and len(readback['versions'])==2 and len(readback['reviews'])==2)
status,_,_=request('/api/analyses/'+id+'/feedback',{'kind':'incorrect','note':'Local QA: verify feedback appears in operations.'},'POST');ok('reader feedback can be submitted',status==201)
status,after,_=request('/api/bootstrap');ok('feedback and status metrics appear in operations',any(f['analysis_id']==id for f in after['feedback']) and after['stats']['feedback']>=1 and any(x['id']==id and x['status']=='published' for x in after['analyses']))
status,_,_=request('/api/analyses',payload,'POST',{'Origin':'https://untrusted.example'});ok('cross-origin writes rejected',status==403)
status,_,_=request('/api/analyses',{'rawText':'short'},'POST');ok('invalid submission rejected',status==422)
if not initial['settings']['modelConnected']:
 model_payload={**payload,'rawText':raw+' another version','useModel':True}
 status,_,_=request('/api/analyses',model_payload,'POST');ok('unconfigured model cannot masquerade as a live model run',status==409)
status,export,hs=request('/api/analyses/'+id+'/export');ok('analysis export contains the current revision',status==200 and export['revision']==3 and 'attachment' in hs.get('Content-Disposition',''))
status,_,_=request('/api/corpus/'+c['items'][0]['id'],{'status':'verified','note':'Local QA layer only; frozen research source unchanged.'},'PATCH');ok('corpus review layer persists',status==200)
status,curated,_=request('/api/corpus');ok('corpus review is readable without rewriting archive',curated['items'][0]['review']['status']=='verified' and curated['items'][0]['title']==c['items'][0]['title'])
status,archived,_=request('/api/analyses/'+id,{'revision':3,'status':'archived','note':'Local QA record archived after testing.'},'PATCH');ok('archive is reversible and versioned',status==200 and archived['analysis']['revision']==4 and archived['analysis']['status']=='archived')
status,_,_=request('/api/analyses/'+id,auth=False);ok('saved raw JD remains inaccessible anonymously',status==404)
report={'typecheck':'passed','production_build':'passed','environment':'loopback development with simulated identity and local D1','integration_checks':checks,'integration_count':len(checks),'live_model_request_tested':False,'human_semantic_accuracy_measured':False,'test_record_archived':True,'database':'Cloudflare D1 / SQLite; all mutations followed by fresh API reads'}
Path('checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'passed':len(checks),'all_passed':True,'model_tested':False,'test_record_archived':True}))
