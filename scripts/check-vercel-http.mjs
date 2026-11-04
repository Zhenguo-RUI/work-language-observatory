// Loopback only. Uses real Auth.js encryption with a temporary test secret;
// it does not complete a live GitHub OAuth sign-in or call a paid model.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {encode} from '@auth/core/jwt';
const base=process.env.OBSERVATORY_TEST_URL||'http://127.0.0.1:5185';
assert(['localhost','127.0.0.1','::1'].includes(new URL(base).hostname));
const env={...process.env};
for(const line of readFileSync('.env.local','utf8').split(/\r?\n/)){const m=line.match(/^([A-Z_]+)=(.*)$/);if(m&&!env[m[1]])env[m[1]]=m[2];}
assert.equal(env.DATABASE_URL?.startsWith('pglite:'),true,'Use a temporary local test database.');
const cookieName='authjs.session-token';
async function cookie(id){return cookieName+'='+await encode({secret:env.AUTH_SECRET,salt:cookieName,token:{sub:'github:'+id,githubId:id,name:'Synthetic user '+id,email:'same-address@example.test'},maxAge:3600});}
const users={owner:await cookie(env.OPERATOR_GITHUB_ID),a:await cookie('2001'),b:await cookie('2002'),tampered:'authjs.session-token=invalid-token'};
const checks=[];
async function check(name,fn){await fn();checks.push({name,passed:true});}
async function call(path,{data,method,as,headers={}}={}){
 const response=await fetch(base+path,{method:method||(data?'POST':'GET'),headers:{...(data?{'Content-Type':'application/json'}:{}),...(as?{Cookie:users[as]}:{}),...headers},body:data?JSON.stringify(data):undefined,redirect:'manual'});
 const text=await response.text();let body;try{body=JSON.parse(text);}catch{body=text;}
 assert(!text.includes(env.AUTH_SECRET),'Session secret leaked into an HTTP response');
 return {status:response.status,body,headers:response.headers};
}
await check('the reader renders through standard Next.js',async()=>assert.equal((await call('/')).status,200));
await check('GitHub sign-in page is available without a session',async()=>{const r=await call('/auth/signin?return_to=/ops');assert.equal(r.status,200);assert(r.body.includes('Continue with GitHub'));});
await check('anonymous bootstrap exposes no private rows',async()=>{const r=await call('/api/bootstrap');assert.equal(r.status,200);assert.equal(r.body.user.authenticated,false);assert.deepEqual(r.body.analyses,[]);});
await check('old hosting identity headers cannot authenticate a request',async()=>{const r=await call('/api/bootstrap?scope=ops',{headers:{'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'same-address@example.test'}});assert.equal(r.status,401);});
await check('an invalid encrypted session cannot grant access',async()=>assert.equal((await call('/api/bootstrap?scope=ops',{as:'tampered'})).status,401));
await check('ordinary GitHub sessions do not grant operator rights',async()=>assert.equal((await call('/api/bootstrap?scope=ops',{as:'a'})).status,403));
await check('the configured operator identity can access operations',async()=>{const r=await call('/api/bootstrap?scope=ops',{as:'owner'});assert.equal(r.status,200);assert.equal(r.body.operator,true);assert.equal(typeof r.body.stats.total,'number');});
await check('individual corpus indexes require the operator',async()=>{assert.equal((await call('/api/corpus')).status,401);assert.equal((await call('/api/corpus',{as:'a'})).status,403);assert.equal((await call('/api/corpus',{as:'owner'})).status,200);});
await check('aggregate research remains public',async()=>assert.equal((await call('/api/research')).body.archive,2000));
const raw='岗位职责：使用SQL核对订单与退款，独立形成每周报表，与财务团队核对指标口径。任职要求：能够说明业务建议的依据。';
const payload={title:'Synthetic Vercel migration '+randomUUID(),rawText:raw,useModel:false};
let reading;
await check('an authenticated user can save a source-grounded reading',async()=>{const r=await call('/api/analyses',{as:'a',data:payload});assert.equal(r.status,201);reading=r.body.analysis;assert.equal(reading.engine,'rules');assert(reading.result.terms.every(t=>raw.includes(t.quote)));});
const id=reading.id;
await check('owner can retrieve their saved reading',async()=>assert.equal((await call('/api/analyses/'+id,{as:'a'})).status,200));
await check('other users and anonymous visitors cannot retrieve or export it',async()=>{for(const as of [undefined,'b'])for(const suffix of ['','/export'])assert.equal((await call('/api/analyses/'+id+suffix,{as})).status,404);});
await check('translation does not bypass record ownership',async()=>assert.equal((await call('/api/translate',{as:'b',data:{analysisId:id}})).status,404));
await check('a public status does not turn a private raw JD into a public record',async()=>{assert.equal((await call('/api/analyses/'+id,{as:'a',data:{revision:1,status:'published'},method:'PATCH'})).status,403);});
await check('regular users cannot modify model settings',async()=>assert.equal((await call('/api/settings',{as:'a',data:{model:'unauthorized',methodNote:'unauthorized'},method:'PATCH'})).status,403));
await check('the operator can review a submitted reading',async()=>assert.equal((await call('/api/analyses/'+id,{as:'owner'})).status,200));
await check('concurrent reviews use revision checks and produce one committed change',async()=>{const results=await Promise.all(['A','B'].map(note=>call('/api/analyses/'+id,{as:'owner',method:'PATCH',data:{revision:1,status:'in_review',note:'Synthetic review '+note}})));assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);const r=await call('/api/analyses/'+id,{as:'owner'});assert.equal(r.body.analysis.revision,2);assert.equal(r.body.versions.length,1);assert.equal(r.body.reviews.length,1);});
await check('fabricated evidence is rejected without altering the saved version',async()=>{const bad=structuredClone(reading.result);bad.terms[0].quote='Fabricated source span';assert.equal((await call('/api/analyses/'+id,{as:'owner',method:'PATCH',data:{revision:2,result:bad}})).status,422);assert.equal((await call('/api/analyses/'+id,{as:'a'})).body.analysis.revision,2);});
await check('a reviewed publication is versioned and stays owner-scoped',async()=>{assert.equal((await call('/api/analyses/'+id,{as:'owner',method:'PATCH',data:{revision:2,status:'published',note:'Synthetic publication'}})).status,200);assert.equal((await call('/api/analyses/'+id)).status,404);const r=await call('/api/analyses/'+id,{as:'a'});assert.equal(r.body.analysis.revision,3);});
await check('feedback is recorded for the corresponding user and operator',async()=>{assert.equal((await call('/api/analyses/'+id+'/feedback',{as:'a',data:{kind:'useful',note:'Synthetic migration QA'}})).status,201);const op=await call('/api/bootstrap?scope=ops',{as:'owner'});assert(op.body.feedback.some(f=>f.analysis_id===id));const regular=await call('/api/bootstrap',{as:'a'});assert.deepEqual(regular.body.feedback,[]);});
await check('a foreign user cannot submit feedback on the private reading',async()=>assert.equal((await call('/api/analyses/'+id+'/feedback',{as:'b',data:{kind:'incorrect'}})).status,404));
await check('history includes only the requesting user’s records',async()=>{assert((await call('/api/bootstrap',{as:'a'})).body.analyses.some(a=>a.id===id));assert(!(await call('/api/bootstrap',{as:'b'})).body.analyses.some(a=>a.id===id));});
await check('cross-origin writes are rejected',async()=>assert.equal((await call('/api/analyses',{as:'a',data:payload,headers:{Origin:'https://untrusted.example'}})).status,403));
await check('invalid source length and source URL are rejected',async()=>{assert.equal((await call('/api/analyses',{data:{rawText:'short'}})).status,422);assert.equal((await call('/api/analyses',{data:{...payload,sourceUrl:'javascript:invalid'}})).status,400);});
await check('model credentials are not inferred from a model name',async()=>assert.equal((await call('/api/analyses',{as:'a',data:{...payload,rawText:raw+' 新版本',useModel:true}})).status,409));
const before=(await call('/api/bootstrap?scope=ops',{as:'owner'})).body.stats.total;
await check('anonymous previews remain ephemeral and are rate-limited in the database',async()=>{let allowed=0,limited=false;for(let i=0;i<15;i++){const r=await call('/api/analyses',{data:{...payload,title:'Anonymous '+i}});if(r.status===429){limited=true;break;}assert.equal(r.status,200);assert.equal(r.body.ephemeral,true);assert.equal(r.body.analysis.engine,'rules');assert.deepEqual(r.body.analysis.result.comparisons,[]);allowed++;}assert.equal(allowed,12);assert(limited);assert.equal((await call('/api/bootstrap?scope=ops',{as:'owner'})).body.stats.total,before);});

async function credentialLogin(accessKey){
 const jar=new Map();
 const capture=response=>{for(const c of response.headers.getSetCookie()){const part=c.split(';')[0],at=part.indexOf('=');jar.set(part.slice(0,at),part.slice(at+1));}};
 const csrfResponse=await fetch(base+'/api/auth/csrf');capture(csrfResponse);const csrf=await csrfResponse.json();
 const response=await fetch(base+'/api/auth/callback/operator-key',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','X-Auth-Return-Redirect':'1',Origin:base,Cookie:[...jar].map(([k,v])=>k+'='+v).join('; ')},body:new URLSearchParams({accessKey,csrfToken:csrf.csrfToken,callbackUrl:base+'/ops'}),redirect:'manual'});
 capture(response);return {response,cookie:[...jar].map(([k,v])=>k+'='+v).join('; ')};
}
await check('invalid operator credentials cannot obtain an operations session',async()=>{const login=await credentialLogin('wrong-owner-key');assert.equal((await call('/api/bootstrap?scope=ops',{headers:{Cookie:login.cookie}})).status,401);});
let operatorCookie;
await check('real Credentials provider verifies the configured owner key',async()=>{assert(env.OPERATOR_ACCESS_KEY);const login=await credentialLogin(env.OPERATOR_ACCESS_KEY);operatorCookie=login.cookie;const r=await call('/api/bootstrap?scope=ops',{headers:{Cookie:operatorCookie}});assert.equal(r.status,200);assert.equal(r.body.operator,true);});
await check('the owner can save and review a reading through that verified session',async()=>{const headers={Cookie:operatorCookie};const r=await call('/api/analyses',{headers,data:{...payload,title:'Synthetic owner-key workflow'}});assert.equal(r.status,201);const id=r.body.analysis.id;const review=await call('/api/analyses/'+id,{headers,method:'PATCH',data:{revision:1,status:'in_review',note:'Synthetic credential workflow QA'}});assert.equal(review.status,200);assert.equal(review.body.analysis.revision,2);assert.equal((await call('/api/analyses/'+id,{as:'b'})).status,404);});
await check('a stale operator-key credential version cannot grant access',async()=>{const token=await encode({secret:env.AUTH_SECRET,salt:cookieName,token:{sub:'operator:owner',identity:'operator',operatorVersion:'outdated-key-version'},maxAge:3600});assert.equal((await call('/api/bootstrap?scope=ops',{headers:{Cookie:cookieName+'='+token}})).status,401);});

writeFileSync('vercel-http-checks.json',JSON.stringify({checks,count:checks.length,passed:true,scope:'Next.js development HTTP + encrypted Auth.js test sessions + local Postgres',live_github_oauth_tested:false,live_neon_tested:false,live_model_calls:0},null,2)+'\n');
console.log(JSON.stringify({vercel_http_checks:checks.length,passed:true,live_github_oauth_tested:false,live_neon_tested:false,live_model_calls:0}));
