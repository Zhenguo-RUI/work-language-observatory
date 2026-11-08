import {createHmac} from "node:crypto";
import {sameRequestOrigin} from "./request-origin";
import {getDatabase,databaseConfigured,ensureDatabase} from "./database";
import type {PreparedStatement} from "./database-core";
import {authenticationConfigured,githubAuthenticationConfigured,isOperatorIdentity} from "./identity-policy";
const env=process.env;
import {z} from "zod";
import {getUser} from "./identity";
import {seeds,seedTranslations} from "./seed-data";
import corpusData from "@/data/corpus.json";
import research from "@/data/research.json";
import publicStudy from "@/data/public-study.json";
import {originalEnglish,sourceFingerprint,translateWithModel,translationErrors} from "./jd-translation";
import {PUBLIC_DEMO} from "./public-demo";
import {evidenceErrors,matchesFor,ruleDraft,textHash} from "./analysis-engine";
import {resultSchema} from "./analysis-contract";
import {ANALYSIS_VERSION} from "./analysis-prompt";
import {canReuseAnalysis} from "./analysis-cache";
// Client submissions cannot claim a server analysis version.
const submittedResultSchema=resultSchema.omit({analysisVersion:true});
import {runModelReading} from "./model-reading";
import {modelRuntime} from "./model-client";
import {operatorAccessConfigured} from "./operator-access";
import {enrichCompanyContext} from "./company-context";
import type {CompanyContext} from "./observatory-types";
import {usageEventSchema,usageFeedbackSchema,opaqueReadingId} from "./usage-contract";
import {recordUsageEvent,recordUsageFeedback,reserveUsageWrite,usageFingerprint,getUsageSummary,startUsageRun,finishUsageRun,pruneUsage,UsageRateLimitError} from "./usage-store";
import {safeModelFailure} from "./usage-diagnostics";
import {reserveModelCall,ModelBudgetError} from "./model-quota";
import type {Analysis,AnalysisResult,CorpusEntry} from "./observatory-types";
const corpus=corpusData as CorpusEntry[];
const now=()=>new Date().toISOString();
const uid=()=>crypto.randomUUID();
const statuses=["draft","in_review","published","archived"] as const;
class HttpError extends Error{constructor(public status:number,message:string){super(message)}}
function database(){if(!databaseConfigured())throw new HttpError(503,"保存服务正在配置 / Storage is being configured");return getDatabase();}
async function rows<T=Record<string,unknown>>(sql:string,...args:unknown[]){return (await database().prepare(sql).bind(...args).all<T>()).results;}
async function first<T=Record<string,unknown>>(sql:string,...args:unknown[]){return database().prepare(sql).bind(...args).first<T>();}
const parseRow=(r:Record<string,unknown>):Analysis=>{const {owner_id,change_id,result_json,...fields}=r;return {...fields,result:JSON.parse(result_json as string)} as unknown as Analysis;};
const readerView=(a:Analysis,op:boolean):Analysis=>{
 const prepared=a.engine==="curated"?seedTranslations.find(t=>t.id===a.id&&t.sourceTitle===a.title&&t.sourceRaw===a.raw_text):undefined;
 if(prepared&&!a.result.sourceTranslation){const {titleEn,paragraphs,sourceHash}=prepared;a={...a,result:{...a.result,sourceTranslation:{titleEn,paragraphs,sourceHash,basis:"curated"}}};}
 if(prepared){const names=prepared.comparisonTitles as Record<string,string>;a={...a,result:{...a.result,comparisons:a.result.comparisons.map(c=>names[c.id]?{...c,titleEn:names[c.id]}:c)}};}
 return op?a:{...a,result:{...a.result,comparisons:[]}};
};
async function readyTranslation(title:string,raw:string){
 if(raw===PUBLIC_DEMO.rawZh&&[PUBLIC_DEMO.titleZh,PUBLIC_DEMO.titleEn].includes(title))return {titleEn:PUBLIC_DEMO.titleEn,paragraphs:[{source:raw,en:PUBLIC_DEMO.rawEn}],basis:"curated" as const,sourceHash:await sourceFingerprint(title,raw)};
 return originalEnglish(title,raw);
}
async function setting(key:string,fallback=""){return (await first<{value:string}>("SELECT value FROM settings WHERE key=?",key))?.value??fallback;}
async function event(actor:string,action:string,detail:string,id:string|null=null){await database().prepare("INSERT INTO activities (id,actor_id,analysis_id,action,detail,created_at) VALUES (?,?,?,?,?,?)").bind(uid(),actor,id,action,detail,now()).run();}
async function actor(){const user=await getUser();if(!user)throw new HttpError(401,"请先登录 / Please sign in");return user;}
function isOperator(user:Awaited<ReturnType<typeof getUser>>){return isOperatorIdentity(user,env.OPERATOR_GITHUB_ID,operatorAccessConfigured());}
async function operator(userId:string){const user=await actor();if(user.userId!==userId||!isOperator(user))throw new HttpError(403,"仅项目运营者可以执行此操作 / Operator access required");}
async function publicQuota(req:Request){
 const hour=new Date().toISOString().slice(0,13),ip=env.VERCEL==="1"?(req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"shared"):"local",fingerprint=createHmac("sha256",env.AUTH_SECRET||modelRuntime(env).apiKey||"rule-preview-only").update(hour+":"+ip).digest("hex").slice(0,32);
 for(const [scope,limit] of [["all",100],[fingerprint,12]] as const){
  const row=await database().prepare("INSERT INTO settings (key,value,updated_at) VALUES (?, '1', ?) ON CONFLICT(key) DO UPDATE SET value=CAST(CAST(settings.value AS INTEGER)+1 AS TEXT),updated_at=excluded.updated_at RETURNING value").bind(`rate:${hour}:${scope}`,now()).first<{value:string}>();
  if(Number(row?.value)>limit)throw new HttpError(429,"本小时公开体验次数已达上限，请稍后再试 / Public preview limit reached; please try later");
 }
 await database().prepare("DELETE FROM settings WHERE key LIKE 'rate:%' AND updated_at<?").bind(new Date(Date.now()-48*3600000).toISOString()).run();
}
async function companyLookupQuota(req:Request){
 const hour=new Date().toISOString().slice(0,13),fingerprint=usageFingerprint(req,env.AUTH_SECRET||"company-lookup");
 for(const [scope,limit] of [["all",500],[fingerprint,40]] as const){
  const reserved=await database().prepare("INSERT INTO settings(key,value,updated_at) VALUES (?,'1',?) ON CONFLICT(key) DO UPDATE SET value=CAST(CAST(settings.value AS INTEGER)+1 AS TEXT),updated_at=excluded.updated_at WHERE CAST(settings.value AS INTEGER) < ? RETURNING value").bind(`company-search-rate:${hour}:${scope}`,now(),limit).first();
  if(!reserved)throw new HttpError(429,"公司检索过于频繁，请稍后再试 / Company lookup limit reached; please try later");
 }
 await database().prepare("DELETE FROM settings WHERE key LIKE 'company-search-rate:%' AND updated_at<?").bind(new Date(Date.now()-48*3600000).toISOString()).run();
}
async function initialize(){
 await ensureDatabase();
 const db=database();
 if(await setting("initialized")==="public-v1")return;
 const stmts:PreparedStatement[]=[];
 for(const s of seeds){const stamp=now();stmts.push(db.prepare("INSERT INTO analyses (id,owner_id,title,company,raw_text,source_url,text_hash,status,engine,result_json,revision,change_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,'published','curated',?,1,?,?,?) ON CONFLICT(id) DO NOTHING").bind(s.id,"__observatory__",s.title,s.company,s.raw_text,s.source_url,await textHash(s.raw_text),JSON.stringify(s.result),`seed-${s.id}`,stamp,stamp));stmts.push(db.prepare("UPDATE analyses SET owner_id='__observatory__' WHERE id=? AND engine='curated'").bind(s.id));}
 stmts.push(db.prepare("INSERT INTO settings (key,value,updated_at) VALUES ('initialized','public-v1',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind(now()));
 stmts.push(db.prepare("INSERT INTO settings (key,value,updated_at) VALUES ('method_note',?,?) ON CONFLICT(key) DO NOTHING").bind("以原文动作和对象解释能力词；区分资格、职责、协作与授权；保留来源、反例和解释边界。",now()));
 stmts.push(db.prepare("INSERT INTO activities (id,actor_id,action,detail,created_at) VALUES ('initial-cases',?,'initialized',?,?) ON CONFLICT(id) DO NOTHING").bind("system",`Initialized with ${seeds.length} case records; not an independent evaluation.`,now()));
 await db.batch(stmts);
}
async function getAnalysis(id:string,userId:string){const op=isOperator(await getUser());const r=await first("SELECT * FROM analyses WHERE id=? AND (owner_id=? OR ?)",id,userId,op);if(!r)throw new HttpError(404,"记录不存在 / Record not found");return readerView(parseRow(r),op);}
async function body(req:Request){if(!req.headers.get("content-type")?.includes("application/json"))throw new HttpError(415,"请使用JSON提交 / JSON required");const raw=await req.text();if(raw.length>120000)throw new HttpError(413,"提交内容过长 / Request too large");try{return JSON.parse(raw)}catch{throw new HttpError(400,"内容格式无效 / Invalid JSON")}}
async function config(){
 const runtime=modelRuntime(env),values=databaseConfigured()?Object.fromEntries((await rows<{key:string;value:string}>("SELECT key,value FROM settings WHERE key IN ('model','method_note')")).map(row=>[row.key,row.value])):{};
 const model=values.model??runtime.model;
 return {provider:runtime.provider,model,modelConnected:databaseConfigured()&&!!runtime.apiKey&&!!model,authConfigured:githubAuthenticationConfigured(),storageConfigured:databaseConfigured(),methodNote:values.method_note??"",version:ANALYSIS_VERSION};
}
async function guestSettings(){
 const runtime=modelRuntime(env),storageConfigured=databaseConfigured();let model=runtime.model;
 // Public startup needs one setting, never private history, counts or seed writes.
 if(storageConfigured&&runtime.apiKey){
  try{model=await setting("model",runtime.model)}catch(error){
   // A brand-new database still needs its schema; a network failure is not a migration.
   if((error as {code?:string})?.code!=="42P01")throw error;
   await initialize();model=await setting("model",runtime.model);
  }
 }
 return {model:"",modelConnected:storageConfigured&&!!runtime.apiKey&&!!model,authConfigured:githubAuthenticationConfigured(),storageConfigured,methodNote:"",version:ANALYSIS_VERSION};
}
function json(value:unknown,status=200){return Response.json(value,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Vary":"Cookie"}});}
async function modelAnalysis(raw:string,title:string,cs:CorpusEntry[],methodNote:string,model:string,context:CompanyContext,company:string,onProgress?:(stage:string)=>void):Promise<AnalysisResult>{
 const runtime=modelRuntime(env);if(!runtime.apiKey)throw new Error("model_not_connected");
 const {result}=await runModelReading({provider:runtime.provider,apiKey:runtime.apiKey,model,raw,title,comparators:cs,methodNote,request:meteredModelRequest,context,company,onProgress});
 return {...result,analysisVersion:ANALYSIS_VERSION};
}
const meteredModelRequest:typeof fetch=async(input,init)=>{try{await reserveModelCall(database(),env.MODEL_DAILY_CALL_LIMIT);}catch(error){if(error instanceof ModelBudgetError)throw error;throw new Error("model_quota_storage_unavailable");}return fetch(input,init);};
async function updateAnalysis(current:Analysis,userId:string,input:{result?:AnalysisResult;status?:Analysis["status"];revision:number;note?:string;issues?:string[]}){
 if(input.revision!==current.revision)throw new HttpError(409,"该记录已更新，请刷新后再保存 / This record changed; refresh before saving");
 const result=input.result?{...input.result,analysisVersion:current.result.analysisVersion}:current.result;const status=input.status??current.status;
 const errors=evidenceErrors(result,current.raw_text);
 if(result.sourceTranslation){errors.push(...translationErrors(result.sourceTranslation,current.title,current.raw_text));if(result.sourceTranslation.sourceHash!==await sourceFingerprint(current.title,current.raw_text))errors.push("Translation does not match the current title and JD.");}if(errors.length)throw new HttpError(422,errors.join("；"));
 const db=database(),change=uid(),stamp=now(),next=current.revision+1;
 const commands=[db.prepare("UPDATE analyses SET result_json=?,status=?,revision=?,change_id=?,updated_at=? WHERE id=? AND revision=?").bind(JSON.stringify(result),status,next,change,stamp,current.id,current.revision),
 db.prepare("INSERT INTO versions (id,analysis_id,revision,result_json,status,author_id,created_at) SELECT ?,id,revision,result_json,status,?,? FROM analyses WHERE id=? AND change_id=?").bind(uid(),userId,stamp,current.id,change),
 db.prepare("INSERT INTO activities (id,actor_id,analysis_id,action,detail,created_at) SELECT ?,?,id,?,?,? FROM analyses WHERE id=? AND change_id=?").bind(uid(),userId,status==="published"?"published":"updated",current.title,stamp,current.id,change)];
 if(input.note!==undefined)commands.push(db.prepare("INSERT INTO reviews (id,analysis_id,reviewer_id,decision,note,issues_json,revision,created_at) SELECT ?,id,?,?,?, ?,revision,? FROM analyses WHERE id=? AND change_id=?").bind(uid(),userId,status==="published"?"publish":"revise",input.note,JSON.stringify(input.issues||[]),stamp,current.id,change));
 const res=await db.batch(commands);if(!res[0].meta.changes)throw new HttpError(409,"该记录已更新，请刷新后再保存 / Stale revision");
 return getAnalysis(current.id,userId);
}
export async function handleApi(req:Request,path:string[],onProgress?:(stage:string)=>void){
 let runId:string|null=null;const started=Date.now();
 const progress=(stage:string)=>{try{onProgress?.(stage)}catch{}};
 const finish=async(outcome:"succeeded"|"fallback"|"failed"|"reused",readingId?:string,engine?:string,errorCode?:string)=>{if(runId)try{await finishUsageRun(database(),runId,outcome,{readingId,engine,durationMs:Date.now()-started,errorCode})}catch{console.error("Usage run could not be updated");}};
 try{
  if(path.join("/")==="health")return json({ok:true,databaseConfigured:databaseConfigured(),authenticationConfigured:authenticationConfigured(),version:ANALYSIS_VERSION});
  if(req.method!=="GET"&&!sameRequestOrigin(req,env.VERCEL==="1"))throw new HttpError(403,"跨站提交已拒绝 / Cross-origin write rejected");
  // These are published aggregates, identical for every visitor and independent of sessions.
  if(path[0]==="research"&&req.method==="GET")return Response.json({...research,study:publicStudy},{headers:{"Cache-Control":"public, max-age=300, s-maxage=300","X-Content-Type-Options":"nosniff"}});
  const identity=await getUser(),op=isOperator(identity),user=identity||{userId:"",displayName:"访客 / Guest",email:"",fullName:null};const root=path[0];
  if(root==="bootstrap"&&new URL(req.url).searchParams.get("scope")==="ops"){if(!identity)throw new HttpError(401,"请先登录 / Please sign in");await operator(user.userId);}
  if(root==="bootstrap"&&req.method==="GET"&&!identity)return json({user:{displayName:user.displayName,email:"",authenticated:false},operator:false,analyses:[],stats:{total:0,draft:0,in_review:0,published:0,archived:0,feedback:0,reviews:0},feedback:[],activity:[],settings:await guestSettings()});
  if(!databaseConfigured()){
   if(root==="bootstrap"&&req.method==="GET")return json({user:{displayName:user.displayName,email:user.email,authenticated:!!identity},operator:op,analyses:[],stats:{total:0,draft:0,in_review:0,published:0,archived:0,feedback:0,reviews:0},feedback:[],activity:[],settings:{model:"",modelConnected:false,authConfigured:githubAuthenticationConfigured(),storageConfigured:false,methodNote:"",version:ANALYSIS_VERSION}});
   if(root==="analyses"&&path.length===1&&req.method==="POST"){
    const d=z.object({title:z.string().max(160).default(""),company:z.string().max(160).default(""),rawText:z.string().min(40).max(24000),sourceUrl:z.string().max(1500).default(""),useModel:z.boolean().default(false)}).parse(await body(req));
    if(d.useModel)throw new HttpError(503,"模型分析服务正在配置 / Model analysis is being configured");
    if(d.sourceUrl&&!/^https?:\/\//.test(d.sourceUrl))throw new HttpError(400,"来源链接须为HTTP或HTTPS / Invalid source URL");
    const title=d.title||d.rawText.split("\n")[0].slice(0,80);progress("accepted");
    const context=await enrichCompanyContext({raw:d.rawText,title,company:d.company,onProgress:progress});progress("analysis");
    const result=ruleDraft(d.rawText,title,[]),stamp=now();result.context=context;progress("validating");
    const translation=await readyTranslation(title,d.rawText);if(translation)result.sourceTranslation=translation;
    return json({analysis:{id:`preview-${uid()}`,title,company:d.company,raw_text:d.rawText,source_url:d.sourceUrl,text_hash:await textHash(d.rawText),status:"draft",engine:"rules",result,revision:1,created_at:stamp,updated_at:stamp},ephemeral:true,modelError:false});
   }
   throw new HttpError(503,"保存和复核服务正在配置 / Storage and review are being configured");
  }
  await initialize();
  if(root==="company-context"&&path.length===1&&req.method==="POST"){
   const d=z.object({company:z.string().trim().min(2).max(160).refine(value=>!/[<>\u0000-\u001f]|https?:\/\/|\bsk-[a-z\d]{20}/i.test(value),"请输入公司名称 / Enter a company name"),title:z.string().max(160).default(""),rawText:z.string().max(24000).default("")}).strict().parse(await body(req));
   await companyLookupQuota(req);
   const context=await enrichCompanyContext({company:d.company,title:d.title,raw:d.rawText});
   return json({context});
  }
  if(root==="usage"){
   if(path[1]==="summary"&&req.method==="GET"){await operator(user.userId);await pruneUsage(database());return json(await getUsageSummary(database()));}
   if(req.method==="POST"){
    const fingerprint=usageFingerprint(req,env.AUTH_SECRET||modelRuntime(env).apiKey||"usage-development-only");
    if(path[1]==="events"){
     const d=usageEventSchema.parse(await body(req));await reserveUsageWrite(database(),"event",fingerprint);await recordUsageEvent(database(),d);return json({ok:true},202);
    }
    if(path[1]==="feedback"){
     const d=usageFeedbackSchema.parse(await body(req));await reserveUsageWrite(database(),"feedback",fingerprint);
     const row=await recordUsageFeedback(database(),d);if(!row)throw new HttpError(409,"反馈编号与记录不符 / Feedback reference does not match this reading");return json({ok:true},201);
    }
    if(path[1]==="share"){
     const d=z.object({consent:z.literal(true),readingId:opaqueReadingId,analysis:z.object({title:z.string().max(160),company:z.string().max(160).default(""),rawText:z.string().min(40).max(24000),sourceUrl:z.string().max(1500).default(""),engine:z.enum(["model","rules","curated"]),result:submittedResultSchema}).strict()}).strict().parse(await body(req));
     await reserveUsageWrite(database(),"share",fingerprint);
     const a=d.analysis;if(a.sourceUrl&&!/^https?:\/\//.test(a.sourceUrl))throw new HttpError(400,"来源链接须为HTTP或HTTPS / Invalid source URL");
     if(evidenceErrors(a.result,a.rawText).length)throw new HttpError(422,"分析证据与JD不符，未提交 / The analysis evidence does not match the JD");
     if(a.result.sourceTranslation&&(translationErrors(a.result.sourceTranslation,a.title,a.rawText).length||a.result.sourceTranslation.sourceHash!==await sourceFingerprint(a.title,a.rawText)))throw new HttpError(422,"译文与JD不符，未提交 / The translation does not match this JD");
     const existing=await first<{id:string}>("SELECT id FROM analyses WHERE owner_id=? AND change_id=?","__feedback_shared__",`shared:${d.readingId}`);if(existing)return json({ok:true,analysisId:existing.id,reused:true});
     const id=uid(),stamp=now();
     const inserted=await database().prepare("INSERT INTO analyses (id,owner_id,title,company,raw_text,source_url,text_hash,status,engine,result_json,revision,change_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,'draft',?,?,1,?,?,?) ON CONFLICT DO NOTHING RETURNING id").bind(id,"__feedback_shared__",a.title,a.company,a.rawText,a.sourceUrl,await textHash(a.rawText),a.engine==="curated"?"rules":a.engine,JSON.stringify(a.result),`shared:${d.readingId}`,stamp,stamp).first<{id:string}>();
     const saved=inserted||await first<{id:string}>("SELECT id FROM analyses WHERE owner_id=? AND change_id=?","__feedback_shared__",`shared:${d.readingId}`);
     if(!saved)throw new HttpError(500,"提交未保存，请重试 / The shared reading was not saved");
     if(inserted)await event("anonymous","feedback_shared","User explicitly shared a reading for private review; user-submitted result awaits review",saved.id);return json({ok:true,analysisId:saved.id},inserted?201:200);
    }
   }
   throw new HttpError(404,"接口不存在 / Endpoint not found");
  }
  if(root==="bootstrap"&&req.method==="GET"){
   if(new URL(req.url).searchParams.get("scope")==="ops"){if(!identity)throw new HttpError(401,"请先登录 / Please sign in");await operator(user.userId);}
   const where=op?"1=1":"owner_id=?",args=op?[]:[user.userId];
   const [listRows,feedback,grouped,feedbackCount,reviewCount,activity,settings,usage]=await Promise.all([
    rows(`SELECT * FROM analyses WHERE ${where} ORDER BY updated_at DESC LIMIT 250`,...args),
    op?rows("SELECT f.*,a.title FROM feedback f JOIN analyses a ON a.id=f.analysis_id ORDER BY f.created_at DESC LIMIT 100"):Promise.resolve([]),
    rows<{status:string;n:number}>(`SELECT status,count(*)::integer n FROM analyses WHERE ${where} GROUP BY status`,...args),
    op?first<{n:number}>("SELECT count(*)::integer n FROM feedback"):Promise.resolve(null),
    op?first<{n:number}>("SELECT count(*)::integer n FROM reviews"):Promise.resolve(null),
    op?rows("SELECT id,action,detail,created_at FROM activities ORDER BY created_at DESC LIMIT 15"):Promise.resolve([]),
    config(),op?getUsageSummary(database()):Promise.resolve(undefined),
   ]);
   const list=listRows.map(r=>readerView(parseRow(r),op));
   const counts=Object.fromEntries(statuses.map(status=>[status,grouped.find(r=>r.status===status)?.n||0]));
   return json({user:{displayName:user.displayName,email:user.email,authenticated:!!identity},operator:op,analyses:list,...(op?{usage}:{}),stats:{total:grouped.reduce((n,r)=>n+r.n,0),...counts,feedback:feedbackCount?.n||0,reviews:reviewCount?.n||0},feedback,activity,settings:op?settings:{model:"",modelConnected:settings.modelConnected,authConfigured:githubAuthenticationConfigured(),storageConfigured:true,methodNote:"",version:ANALYSIS_VERSION}});
  }
  if(root==="corpus"&&req.method==="GET"){
   await operator(user.userId);
   const u=new URL(req.url);const q=(u.searchParams.get("q")||"").toLowerCase(),platform=u.searchParams.get("platform"),term=u.searchParams.get("term"),offset=Math.max(0,Number(u.searchParams.get("offset"))||0);
   const filtered=corpus.filter(c=>(!q||[c.title,c.employer||"",c.id,...c.terms].join(" ").toLowerCase().includes(q))&&(!platform||c.platform===platform)&&(!term||c.terms.includes(term)));
   const reviewRows=op?await rows("SELECT * FROM corpus_reviews"):[];const map=Object.fromEntries(reviewRows.map(r=>[r.id,r]));
   return json({total:filtered.length,offset,items:filtered.slice(offset,offset+30).map(c=>({...c,review:map[c.id]||null}))});
  }
  if(root==="corpus"&&path[1]&&req.method==="PATCH"){
   await operator(user.userId);if(!corpus.some(c=>c.id===path[1]))throw new HttpError(404,"档案不存在 / Archive record not found");
   const d=z.object({status:z.enum(["unreviewed","verified","rejected"]),note:z.string().max(2000)}).parse(await body(req));
   await database().prepare("INSERT INTO corpus_reviews (id,status,note,reviewer_id,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,note=excluded.note,reviewer_id=excluded.reviewer_id,updated_at=excluded.updated_at").bind(path[1],d.status,d.note,user.userId,now()).run();await event(user.userId,"corpus_reviewed",path[1]);return json({ok:true});
  }
  if(root==="settings"&&req.method==="PATCH"){
   await operator(user.userId);const d=z.object({model:z.string().max(100),methodNote:z.string().max(3000)}).parse(await body(req));
   await database().batch([database().prepare("INSERT INTO settings (key,value,updated_at) VALUES ('model',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind(d.model,now()),database().prepare("INSERT INTO settings (key,value,updated_at) VALUES ('method_note',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind(d.methodNote,now())]);await event(user.userId,"settings_updated","分析方法设置已更新");return json(await config());
  }
  if(root==="translate"&&req.method==="POST"){
   const d=z.object({analysisId:z.string().max(100).optional(),title:z.string().max(160).default(""),rawText:z.string().min(1).max(24000).optional()}).parse(await body(req));
   const current=d.analysisId?await getAnalysis(d.analysisId,user.userId):null;
   const title=current?.title??d.title,raw=current?.raw_text??d.rawText;
   if(!raw)throw new HttpError(422,"缺少JD原文 / The source JD is required");
   const existing=current?.result.sourceTranslation||await readyTranslation(title,raw);
   if(existing)return json({translation:existing,cached:true});
   const cfg=await config();if(!cfg.modelConnected)throw new HttpError(503,"全文翻译服务尚未连接，可使用兼容浏览器的本地翻译 / Full translation is not connected; a compatible browser can translate locally");
   await publicQuota(req);
   const runtime=modelRuntime(env);
   let translation;try{translation=await translateWithModel({title,raw,provider:runtime.provider,apiKey:runtime.apiKey!,model:cfg.model,request:meteredModelRequest});}catch(error){if(error instanceof ModelBudgetError)throw error;throw new HttpError(502,"翻译未完整通过检查，请重试 / Translation did not pass completeness checks; please retry");}
   if(current&&identity){const saved=await updateAnalysis(current,user.userId,{result:{...current.result,sourceTranslation:translation},revision:current.revision});return json({translation,analysis:saved});}
   return json({translation,ephemeral:true});
  }
  if(root==="analyses"&&path.length===1&&req.method==="POST"){
   const d=z.object({title:z.string().max(160).default(""),company:z.string().max(160).default(""),rawText:z.string().min(40).max(24000),sourceUrl:z.string().max(1500).default(""),useModel:z.boolean().default(false)}).parse(await body(req));
   if(d.sourceUrl&&!/^https?:\/\//.test(d.sourceUrl))throw new HttpError(400,"来源链接须为HTTP或HTTPS / Invalid source URL");
   try{runId=await startUsageRun(database(),d.useModel)}catch{console.error("Usage run could not be recorded");}
   const n=await first<{n:number}>("SELECT count(*)::integer n FROM analyses WHERE owner_id=? AND engine!='curated' AND created_at>?",user.userId,new Date(Date.now()-3600000).toISOString());if((n?.n||0)>=30)throw new HttpError(429,"本小时提交已达30份，请稍后再试 / Hourly limit reached");
   if(!identity)await publicQuota(req);
   const hash=await textHash(d.rawText),effectiveTitle=d.title||d.rawText.split("\n")[0].slice(0,80);
   const existing=identity?await first("SELECT * FROM analyses WHERE owner_id=? AND text_hash=? AND company=? AND title=? AND source_url=? AND status!='archived' ORDER BY updated_at DESC LIMIT 1",user.userId,hash,d.company,effectiveTitle,d.sourceUrl):null;
   if(existing){const a=readerView(parseRow(existing),op);if(canReuseAnalysis(a,d.useModel,d.company)){await finish("reused",a.id,a.engine);return json({analysis:a,reused:true});}}
   progress("accepted");
   const context=await enrichCompanyContext({raw:d.rawText,title:d.title,company:d.company,onProgress:progress});
   const cs=op?matchesFor(`${d.title} ${d.rawText}`,corpus):[];const cfg=await config();let result=ruleDraft(d.rawText,d.title||d.rawText.split("\n")[0].slice(0,60),cs);let engine="rules",modelError=false,modelFailure:string|undefined;result.context=context;
   progress("analysis");
   if(d.useModel){if(!cfg.modelConnected)throw new HttpError(409,"请先在运营端连接模型 / Connect the analysis model first");try{result=await modelAnalysis(d.rawText,d.title,cs,cfg.methodNote,cfg.model,context,d.company,progress);engine="model";}catch(error){if(error instanceof ModelBudgetError)throw error;modelError=true;modelFailure=safeModelFailure(error);console.warn("Observatory model fallback",{code:modelFailure,runId});}}
   progress("validating");
   if(!op)result.comparisons=[];
   const id=uid(),stamp=now(),title=d.title||d.rawText.split("\n")[0].slice(0,80);
   const prepared=await readyTranslation(title,d.rawText);if(prepared)result.sourceTranslation=prepared;
   progress("saving");
   if(!identity){await finish(modelError?"fallback":"succeeded",`preview-${id}`,engine,modelFailure);return json({analysis:{id:`preview-${id}`,title,company:d.company,raw_text:d.rawText,source_url:d.sourceUrl,text_hash:hash,status:"draft",engine,result,revision:1,created_at:stamp,updated_at:stamp},ephemeral:true,modelError,modelFailure},200);}
   await database().prepare("INSERT INTO analyses (id,owner_id,title,company,raw_text,source_url,text_hash,status,engine,result_json,revision,change_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,'draft',?,?,1,?,?,?)").bind(id,user.userId,title,d.company,d.rawText,d.sourceUrl,hash,engine,JSON.stringify(result),uid(),stamp,stamp).run();await event(user.userId,modelError?"model_failed":"created",title,id);await finish(modelError?"fallback":"succeeded",id,engine,modelFailure);return json({analysis:await getAnalysis(id,user.userId),modelError,modelFailure},201);
  }
  if(root==="analyses"&&path[1]){
   const current=await getAnalysis(path[1],user.userId);
   if(path.length===2&&req.method==="GET")return json({analysis:current,reviews:op?await rows("SELECT * FROM reviews WHERE analysis_id=? ORDER BY created_at DESC",current.id):[],versions:op?await rows("SELECT revision,status,created_at FROM versions WHERE analysis_id=? ORDER BY revision DESC",current.id):[]});
   if(path.length===2&&req.method==="PATCH"){
    await operator(user.userId);const d=z.object({result:submittedResultSchema.optional(),status:z.enum(statuses).optional(),revision:z.number().int(),note:z.string().max(3000).optional(),issues:z.array(z.string().max(80)).max(8).optional()}).parse(await body(req));return json({analysis:await updateAnalysis(current,user.userId,d)});
   }
   if(path[2]==="feedback"&&req.method==="POST"){
    if(!identity)await publicQuota(req);
    const d=z.object({kind:z.enum(["useful","unclear","incorrect"]),note:z.string().max(2000).default("")}).parse(await body(req));await database().prepare("INSERT INTO feedback (id,analysis_id,user_id,kind,note,created_at) VALUES (?,?,?,?,?,?)").bind(uid(),current.id,user.userId||"anonymous",d.kind,d.note,now()).run();await event(user.userId,"feedback",d.kind,current.id);return json({ok:true},201);
   }
   if(path[2]==="export"&&req.method==="GET")return new Response(JSON.stringify(current,null,2),{headers:{"Content-Type":"application/json; charset=utf-8","Content-Disposition":`attachment; filename="jd-analysis-${current.id}.json"`,"Cache-Control":"no-store"}});
  }
  throw new HttpError(404,"接口不存在 / Endpoint not found");
 }catch(e){await finish("failed",undefined,undefined,e instanceof ModelBudgetError?"model_budget":e instanceof HttpError?`http_${e.status}`:e instanceof z.ZodError?"invalid_input":"internal");if(e instanceof UsageRateLimitError)return json({error:"操作过于频繁，请稍后再试 / Too many requests; please try later"},429);if(e instanceof ModelBudgetError)return json({error:"本站今日模型体验额度已用完，请明日再试 / The site’s daily model allowance has been reached; please try tomorrow"},429);if(e instanceof HttpError)return json({error:e.message},e.status);if(e instanceof z.ZodError)return json({error:"输入字段无效，请检查后重试 / Invalid input",fields:e.issues.map(x=>x.path.join("."))},422);console.error("Observatory API error",{type:e instanceof Error?e.name:"unknown"});return json({error:"操作未完成，请稍后重试 / The operation could not be completed"},500);}
}
