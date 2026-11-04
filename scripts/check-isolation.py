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
status,_,_=request('/signin-with-chatgpt?return_to=/');ok('ordinary user can sign in',status==200)
status,b,_=request('/api/bootstrap');ok('ordinary authenticated user is not an operator',status==200 and b['user']['authenticated'] and not b['operator'])
ok('foreign-owner rows excluded from ordinary bootstrap',not any(a['id']=='qa-foreign-owner' for a in b['analyses']))
status,_,_=request('/api/analyses/qa-foreign-owner');ok('ordinary user cannot retrieve a foreign raw JD',status==404)
status,_,_=request('/api/analyses/qa-foreign-owner/export');ok('ordinary user cannot export a foreign raw JD',status==404)
status,_,_=request('/api/bootstrap?scope=ops');ok('ordinary user cannot load operations data',status==403)
status,_,_=request('/api/settings',{'model':'unauthorized','methodNote':'unauthorized'},'PATCH');ok('ordinary user cannot modify analysis settings',status==403)
status,_,_=request('/api/analyses/fixture-owner-only');ok('ordinary user cannot read a private project case',status==404)
status,_,_=request('/api/corpus');ok('ordinary user cannot read individual corpus entries',status==403)
raw='普通用户隔离测试：使用SQL核对经营指标，独立形成报表，与财务共同核对口径，交付每周的业务建议。'+uuid.uuid4().hex[:8]
status,saved,_=request('/api/analyses',{'title':'Local regular-user QA','company':'Local QA','rawText':raw},'POST');a=saved['analysis'];ok('ordinary user can save their own JD',status==201)
status,own,_=request('/api/analyses/'+a['id']);ok('ordinary user can read their own JD',status==200 and own['analysis']['raw_text']==raw)
ok('ordinary-user result contains no private corpus comparisons or raw internal JSON',not own['analysis']['result']['comparisons'] and 'result_json' not in own['analysis'])
status,_,_=request('/api/analyses/'+a['id'],{'revision':1,'status':'published'},'PATCH');ok('ordinary user cannot self-publish or edit operator output',status==403)
status,public,_=request('/api/bootstrap',auth=False);ok('saved ordinary-user JD is invisible to anonymous visitors',all(x['id']!=a['id'] for x in public['analyses']))
status,_,_=request('/api/analyses/'+a['id'],auth=False);ok('anonymous visitor cannot guess a saved user record',status==404)
Path('isolation-checks.json').write_text(json.dumps({'checks':checks,'all_passed':True,'count':len(checks),'saved_qa_record':a['id'],'environment':'loopback mock identity; local D1'},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'isolation_checks':len(checks),'all_passed':True}))
