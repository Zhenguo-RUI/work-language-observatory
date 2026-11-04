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
status,public,_=request('/api/bootstrap',auth=False)
ok('public reader bootstrap needs no account',status==200 and not public['user']['authenticated'])
ok('public response contains no operator feedback or activity',not public['feedback'] and not public['activity'] and not public['operator'])
status,_,_=request('/api/bootstrap?scope=ops',auth=False);ok('anonymous operations data is protected',status==401)
status,_,_=request('/api/bootstrap?scope=ops',headers={'oai-authenticated-user-id':'fake-owner','oai-authenticated-user-email':'seedy@sites.test'},auth=False);ok('spoofed identity headers do not grant access',status==401)
status,case,_=request('/api/analyses/fixture-owner-only',auth=False);ok('real project cases are not publicly readable',status==404)
status,_,_=request('/api/analyses/fixture-owner-only',{'revision':1,'status':'archived'},'PATCH',auth=False);ok('anonymous visitor cannot edit a hidden case',status==404)
status,_,_=request('/api/corpus',auth=False);ok('individual corpus rows require operator authentication',status==401)
status,_,_=request('/api/research',auth=False);ok('public research page data is available without sign-in',status==200)
status,_,_=request('/signin-with-chatgpt?return_to=/');status,before,_=request('/api/bootstrap?scope=ops')
raw='公开匿名体验测试：岗位职责包括使用SQL核对订单与退款，独立完成经营分析报表，与财务共同核对指标口径，形成每周的改进建议。'+uuid.uuid4().hex[:8]
status,preview,_=request('/api/analyses',{'title':'匿名体验测试','rawText':raw,'useModel':False},'POST',auth=False)
ok('anonymous JD produces a temporary preview',status==200 and preview['ephemeral'] and preview['analysis']['id'].startswith('preview-'))
ok('anonymous preview evidence matches submitted source',all(t['quote'] in raw for t in preview['analysis']['result']['terms']))
ok('public preview never includes private archive comparisons',not preview['analysis']['result']['comparisons'])
ok('public bootstrap contains no case records',not public['analyses'])
status,after,_=request('/api/bootstrap?scope=ops');ok('anonymous preview is not saved into the private database',before['stats']['total']==after['stats']['total'])
status,_,_=request('/api/analyses/'+preview['analysis']['id'],auth=False);ok('temporary preview has no server-side retrieval record',status==404)
status,_,_=request('/api/analyses/fixture-owner-only/feedback',{'kind':'useful','note':'Local public-access QA; not a research response.'},'POST',auth=False);ok('anonymous visitor cannot post to a hidden case',status==404)
status,ops,_=request('/api/bootstrap?scope=ops');ok('rejected hidden-case feedback has no side effect',ops['stats']['feedback']==before['stats']['feedback'])
status,public,_=request('/api/bootstrap',auth=False);ok('other visitors cannot read feedback contents',not public['feedback'])
report={'environment':'loopback mock identity; local D1','checks':checks,'all_passed':True,'count':len(checks),'live_model_tested':False}
Path('public-checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'public_checks':len(checks),'all_passed':True}))
