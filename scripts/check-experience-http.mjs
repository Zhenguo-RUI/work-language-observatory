import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {encode} from '@auth/core/jwt';
const base=process.env.OBSERVATORY_TEST_URL||'http://127.0.0.1:5191';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const env={};for(const line of readFileSync('.env.local','utf8').split(/\r?\n/)){const m=line.match(/^([A-Z_]+)=(.*)$/);if(m)env[m[1]]=m[2];}
assert(env.DATABASE_URL?.startsWith('pglite:'));
const token=await encode({secret:env.AUTH_SECRET,salt:'authjs.session-token',token:{sub:'github:'+env.OPERATOR_GITHUB_ID,githubId:env.OPERATOR_GITHUB_ID,name:'Synthetic QA owner'},maxAge:3600});
const owner={Cookie:'authjs.session-token='+token};
const checks=[];async function check(name,fn){await fn();checks.push({name,passed:true});}
async function call(path,data,headers={}){const r=await fetch(base+path,{method:data?'POST':'GET',headers:{...(data?{'Content-Type':'application/json',Origin:base}:{}),...headers},body:data?JSON.stringify(data):undefined});return {status:r.status,data:await r.json()};}
await check('anonymous reader and local-history route render',async()=>{for(const p of ['/','/?page=history','/?lang=en'])assert.equal((await fetch(base+p)).status,200);});
await check('operations usage is owner-only',async()=>{assert.equal((await call('/api/usage/summary')).status,401);assert.equal((await call('/api/usage/summary',undefined,owner)).status,200);});
const before=(await call('/api/usage/summary',undefined,owner)).data;
const event={eventId:randomUUID(),name:'export_download',view:'read',format:'pdf'};
await check('same-origin events accept retries without duplicate counting',async()=>{assert.equal((await call('/api/usage/events',event)).status,202);assert.equal((await call('/api/usage/events',event)).status,202);const after=(await call('/api/usage/summary',undefined,owner)).data;assert.equal(after.events,before.events+1);});
await check('telemetry rejects raw JD, employer and offsite writes',async()=>{assert.equal((await call('/api/usage/events',{...event,eventId:randomUUID(),rawText:'private text'})).status,422);assert.equal((await call('/api/usage/events',{...event,eventId:randomUUID(),company:'private company'})).status,422);assert.equal((await call('/api/usage/events',event,{Origin:'https://foreign.example'})).status,403);});
const readingId='preview-'+randomUUID(),feedbackId=randomUUID();
await check('anonymous rating and comment update one feedback row',async()=>{const feedback={readingId,feedbackId,vote:'up',category:'clarity'};assert.equal((await call('/api/usage/feedback',feedback)).status,201);assert.equal((await call('/api/usage/feedback',{...feedback,vote:'down',note:'Synthetic HTTP QA only'})).status,201);const after=(await call('/api/usage/summary',undefined,owner)).data;assert.equal(after.ratings.total,before.ratings.total+1);const saved=after.recentFeedback.find(f=>f.id===feedbackId);assert.equal(saved.vote,'down');assert.equal(saved.note,'Synthetic HTTP QA only');});
const raw='虚构验收岗位：使用SQL核对订单与退款，独立形成每周报表，与财务团队核对口径。要求逻辑清晰，能说明数据来源并提出业务改进建议。';
let analysis;
await check('SSE emits actual stages and returns a usable anonymous result',async()=>{const r=await fetch(base+'/api/analyses',{method:'POST',headers:{'Content-Type':'application/json',Accept:'text/event-stream',Origin:base},body:JSON.stringify({title:'Synthetic experience QA '+randomUUID(),rawText:raw,useModel:false})});assert(r.headers.get('content-type').includes('text/event-stream'));const text=await r.text();for(const stage of ['accepted','context','analysis','validating','saving'])assert(text.includes('"stage":"'+stage+'"'));const frame=text.split('\n\n').find(s=>s.startsWith('event: result'));analysis=JSON.parse(frame.split('\ndata: ')[1]).analysis;assert(analysis.id.startsWith('preview-'));assert(analysis.result.context);});
await check('anonymous source remains absent from public cloud history',async()=>{const boot=await call('/api/bootstrap');assert.deepEqual(boot.data.analyses,[]);assert.equal((await call('/api/analyses/'+analysis.id)).status,404);});
const share={readingId:analysis.id,analysis:{title:analysis.title,company:'',rawText:analysis.raw_text,sourceUrl:'',engine:analysis.engine,result:analysis.result}};
await check('private review sharing requires explicit consent and deduplicates',async()=>{assert.equal((await call('/api/usage/share',share)).status,422);const r=await call('/api/usage/share',{...share,consent:true});assert.equal(r.status,201);const again=await call('/api/usage/share',{...share,consent:true});assert.equal(again.data.analysisId,r.data.analysisId);assert.equal((await call('/api/analyses/'+r.data.analysisId)).status,404);assert.equal((await call('/api/analyses/'+r.data.analysisId,undefined,owner)).status,200);});
await check('completed runs include server duration and outcome',async()=>{const after=(await call('/api/usage/summary',undefined,owner)).data;const row=after.recentRuns.find(r=>r.reading_id===analysis.id);assert(row);assert.equal(row.status,'succeeded');assert.equal(row.engine,'rules');assert(row.duration_ms>=0);});
writeFileSync('experience-http-checks.json',JSON.stringify({passed:true,count:checks.length,checks,live_model_calls:0,scope:'Loopback Next.js + real local database + synthetic encrypted owner session'},null,2));console.log(JSON.stringify({experience_http_checks:checks.length,passed:true,live_model_calls:0}));
