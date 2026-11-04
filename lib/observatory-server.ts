import {env} from "cloudflare:workers";
import {z} from "zod";
import {getChatGPTUser} from "@/app/chatgpt-auth";
import {seeds,seedTranslations} from "./seed-data";
import corpusData from "@/data/corpus.json";
import research from "@/data/research.json";
import {originalEnglish,sourceFingerprint,translateWithModel,translationErrors} from "./jd-translation";
import {PUBLIC_DEMO} from "./public-demo";
import {evidenceErrors,matchesFor,ruleDraft,textHash} from "./analysis-engine";
import {resultSchema} from "./analysis-contract";
import {ANALYSIS_VERSION} from "./analysis-prompt";
import {runModelReading} from "./model-reading";
import {modelRuntime} from "./model-client";
import type {Analysis,AnalysisResult,CorpusEntry} from "./observatory-types";
const corpus=corpusData as CorpusEntry[];
const now=()=>new Date().toISOString();
const uid=()=>crypto.randomUUID();
const statuses=["draft","in_review","published","archived"] as const;
class HttpError extends Error{constructor(public status:number,message:string){super(message)}}
function database(){if(!env.DB)throw new HttpError(503,"数据库正在连接，请稍后刷新 / Database unavailable");return env.DB;}
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
async function actor(){const user=await getChatGPTUser();if(!user)throw new HttpError(401,"请先登录 / Please sign in");return user;}
function isOperator(user:Awaited<ReturnType<typeof getChatGPTUser>>){return !!user&&!!env.OPERATOR_EMAIL&&user.email.toLowerCase()===env.OPERATOR_EMAIL.toLowerCase();}
async function operator(userId:string){const user=await actor();if(user.userId!==userId||!isOperator(user))throw new HttpError(403,"仅项目运营者可以执行此操作 / Operator access required");}
async function publicQuota(req:Request){
 const hour=new Date().toISOString().slice(0,13),ip=req.headers.get("cf-connecting-ip")||"shared",fingerprint=(await textHash(ip)).slice(0,32);
 for(const [scope,limit] of [["all",100],[fingerprint,12]] as const){
  const row=await database().prepare("INSERT INTO settings (key,value,updated_at) VALUES (?, '1', ?) ON CONFLICT(key) DO UPDATE SET value=CAST(CAST(value AS INTEGER)+1 AS TEXT),updated_at=excluded.updated_at RETURNING value").bind(`rate:${hour}:${scope}`,now()).first<{value:string}>();
  if(Number(row?.value)>limit)throw new HttpError(429,"本小时公开体验次数已达上限，请稍后再试 / Public preview limit reached; please try later");
 }
 await database().prepare("DELETE FROM settings WHERE key LIKE 'rate:%' AND updated_at<?").bind(new Date(Date.now()-48*3600000).toISOString()).run();
}
async function initialize(){
 const db=database();
 if(await setting("initialized")==="public-v1")return;
 const stmts:D1PreparedStatement[]=[];
 for(const s of seeds){const stamp=now();stmts.push(db.prepare("INSERT OR IGNORE INTO analyses (id,owner_id,title,company,raw_text,source_url,text_hash,status,engine,result_json,revision,change_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,'published','curated',?,1,?,?,?)").bind(s.id,"__observatory__",s.title,s.company,s.raw_text,s.source_url,await textHash(s.raw_text),JSON.stringify(s.result),`seed-${s.id}`,stamp,stamp));stmts.push(db.prepare("UPDATE analyses SET owner_id='__observatory__' WHERE id=? AND engine='curated'").bind(s.id));}
 stmts.push(db.prepare("INSERT INTO settings (key,value,updated_at) VALUES ('initialized','public-v1',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind(now()));
 stmts.push(db.prepare("INSERT OR IGNORE INTO settings (key,value,updated_at) VALUES ('method_note',?,?)").bind("以原文动作和对象解释能力词；区分资格、职责、协作与授权；保留来源、反例和解释边界。",now()));
 stmts.push(db.prepare("INSERT OR IGNORE INTO activities (id,actor_id,action,detail,created_at) VALUES ('initial-cases',?,'initialized',?,?)").bind("system",`Initialized with ${seeds.length} case records; not an independent evaluation.`,now()));
 await db.batch(stmts);
}
async function getAnalysis(id:string,userId:string){const op=isOperator(await getChatGPTUser());const r=await first("SELECT * FROM analyses WHERE id=? AND (owner_id=? OR ?)",id,userId,op?1:0);if(!r)throw new HttpError(404,"记录不存在 / Record not found");return readerView(parseRow(r),op);}
async function body(req:Request){if(!req.headers.get("content-type")?.includes("application/json"))throw new HttpError(415,"请使用JSON提交 / JSON required");const raw=await req.text();if(raw.length>120000)throw new HttpError(413,"提交内容过长 / Request too large");try{return JSON.parse(raw)}catch{throw new HttpError(400,"内容格式无效 / Invalid JSON")}}
async function config(){const runtime=modelRuntime(env),model=await setting("model",runtime.model);return {provider:runtime.provider,model,modelConnected:!!runtime.apiKey&&!!model,methodNote:await setting("method_note"),version:ANALYSIS_VERSION};}
function json(value:unknown,status=200){return Response.json(value,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Vary":"Cookie"}});}
async function modelAnalysis(raw:string,title:string,cs:CorpusEntry[],methodNote:string,model:string):Promise<AnalysisResult>{
 const runtime=modelRuntime(env);if(!runtime.apiKey)throw new Error("model_not_connected");
 return (await runModelReading({provider:runtime.provider,apiKey:runtime.apiKey,model,raw,title,comparators:cs,methodNote})).result;
}
async function updateAnalysis(current:Analysis,userId:string,input:{result?:AnalysisResult;status?:Analysis["status"];revision:number;note?:string;issues?:string[]}){
 if(input.revision!==current.revision)throw new HttpError(409,"该记录已更新，请刷新后再保存 / This record changed; refresh before saving");
 const result=input.result??current.result;const status=input.status??current.status;
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
export async function handleApi(req:Request,path:string[]){
 try{
  if(path.join("/")==="health")return json({ok:true,database:!!env.DB});
  if(req.method!=="GET"){const origin=req.headers.get("origin");if(origin&&origin!==new URL(req.url).origin)throw new HttpError(403,"跨站提交已拒绝 / Cross-origin write rejected");}
  const identity=await getChatGPTUser(),op=isOperator(identity),user=identity||{userId:"",displayName:"访客 / Guest",email:"",fullName:null};await initialize();const root=path[0];
  if(root==="bootstrap"&&req.method==="GET"){
   if(new URL(req.url).searchParams.get("scope")==="ops"){if(!identity)throw new HttpError(401,"请先登录 / Please sign in");await operator(user.userId);}
   const where=op?"1=1":"owner_id=?",args=op?[]:[user.userId];
   const list=(await rows(`SELECT * FROM analyses WHERE ${where} ORDER BY updated_at DESC LIMIT 250`,...args)).map(r=>readerView(parseRow(r),op));
   const feedback=op?await rows("SELECT f.*,a.title FROM feedback f JOIN analyses a ON a.id=f.analysis_id ORDER BY f.created_at DESC LIMIT 100"):[];
   const grouped=await rows<{status:string;n:number}>(`SELECT status,count(*) n FROM analyses WHERE ${where} GROUP BY status`,...args);
   const counts=Object.fromEntries(statuses.map(status=>[status,grouped.find(r=>r.status===status)?.n||0]));
   const feedbackCount=op?await first<{n:number}>("SELECT count(*) n FROM feedback"):null;
   const reviewCount=op?await first<{n:number}>("SELECT count(*) n FROM reviews"):null;
   return json({user:{displayName:user.displayName,email:user.email,authenticated:!!identity},operator:op,analyses:list,stats:{total:grouped.reduce((n,r)=>n+r.n,0),...counts,feedback:feedbackCount?.n||0,reviews:reviewCount?.n||0},feedback,activity:op?await rows("SELECT id,action,detail,created_at FROM activities ORDER BY created_at DESC LIMIT 15"):[],settings:op?await config():{model:"",modelConnected:(await config()).modelConnected,methodNote:"",version:ANALYSIS_VERSION}});
  }
  if(root==="corpus"&&req.method==="GET"){
   await operator(user.userId);
   const u=new URL(req.url);const q=(u.searchParams.get("q")||"").toLowerCase(),platform=u.searchParams.get("platform"),term=u.searchParams.get("term"),offset=Math.max(0,Number(u.searchParams.get("offset"))||0);
   const filtered=corpus.filter(c=>(!q||[c.title,c.employer||"",c.id,...c.terms].join(" ").toLowerCase().includes(q))&&(!platform||c.platform===platform)&&(!term||c.terms.includes(term)));
   const reviewRows=op?await rows("SELECT * FROM corpus_reviews"):[];const map=Object.fromEntries(reviewRows.map(r=>[r.id,r]));
   return json({total:filtered.length,offset,items:filtered.slice(offset,offset+30).map(c=>({...c,review:map[c.id]||null}))});
  }
  if(root==="research"&&req.method==="GET")return json(research);
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
   let translation;try{translation=await translateWithModel({title,raw,provider:runtime.provider,apiKey:runtime.apiKey!,model:cfg.model});}catch{throw new HttpError(502,"翻译未完整通过检查，请重试 / Translation did not pass completeness checks; please retry");}
   if(current&&identity){const saved=await updateAnalysis(current,user.userId,{result:{...current.result,sourceTranslation:translation},revision:current.revision});return json({translation,analysis:saved});}
   return json({translation,ephemeral:true});
  }
  if(root==="analyses"&&path.length===1&&req.method==="POST"){
   const d=z.object({title:z.string().max(160).default(""),company:z.string().max(160).default(""),rawText:z.string().min(40).max(24000),sourceUrl:z.string().max(1500).default(""),useModel:z.boolean().default(false)}).parse(await body(req));
   if(d.sourceUrl&&!/^https?:\/\//.test(d.sourceUrl))throw new HttpError(400,"来源链接须为HTTP或HTTPS / Invalid source URL");
   const n=await first<{n:number}>("SELECT count(*) n FROM analyses WHERE owner_id=? AND engine!='curated' AND created_at>?",user.userId,new Date(Date.now()-3600000).toISOString());if((n?.n||0)>=30)throw new HttpError(429,"本小时提交已达30份，请稍后再试 / Hourly limit reached");
   if(!identity)await publicQuota(req);
   const hash=await textHash(d.rawText);const existing=identity?await first("SELECT * FROM analyses WHERE owner_id=? AND text_hash=? AND status!='archived' ORDER BY CASE WHEN engine='curated' THEN 0 ELSE 1 END LIMIT 1",user.userId,hash):null;if(existing)return json({analysis:readerView(parseRow(existing),op),reused:true});
   const cs=op?matchesFor(`${d.title} ${d.rawText}`,corpus):[];const cfg=await config();let result=ruleDraft(d.rawText,d.title||d.rawText.split("\n")[0].slice(0,60),cs);let engine="rules",modelError=false;
   if(d.useModel){if(!cfg.modelConnected)throw new HttpError(409,"请先在运营端连接模型 / Connect the analysis model first");try{result=await modelAnalysis(d.rawText,d.title,cs,cfg.methodNote,cfg.model);engine="model";}catch{modelError=true;}}
   if(!op)result.comparisons=[];
   const id=uid(),stamp=now(),title=d.title||d.rawText.split("\n")[0].slice(0,80);
   const prepared=await readyTranslation(title,d.rawText);if(prepared)result.sourceTranslation=prepared;
   if(!identity)return json({analysis:{id:`preview-${id}`,title,company:d.company,raw_text:d.rawText,source_url:d.sourceUrl,text_hash:hash,status:"draft",engine,result,revision:1,created_at:stamp,updated_at:stamp},ephemeral:true,modelError},200);
   await database().prepare("INSERT INTO analyses (id,owner_id,title,company,raw_text,source_url,text_hash,status,engine,result_json,revision,change_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,'draft',?,?,1,?,?,?)").bind(id,user.userId,title,d.company,d.rawText,d.sourceUrl,hash,engine,JSON.stringify(result),uid(),stamp,stamp).run();await event(user.userId,modelError?"model_failed":"created",title,id);return json({analysis:await getAnalysis(id,user.userId),modelError},201);
  }
  if(root==="analyses"&&path[1]){
   const current=await getAnalysis(path[1],user.userId);
   if(path.length===2&&req.method==="GET")return json({analysis:current,reviews:op?await rows("SELECT * FROM reviews WHERE analysis_id=? ORDER BY created_at DESC",current.id):[],versions:op?await rows("SELECT revision,status,created_at FROM versions WHERE analysis_id=? ORDER BY revision DESC",current.id):[]});
   if(path.length===2&&req.method==="PATCH"){
    await operator(user.userId);const d=z.object({result:resultSchema.optional(),status:z.enum(statuses).optional(),revision:z.number().int(),note:z.string().max(3000).optional(),issues:z.array(z.string().max(80)).max(8).optional()}).parse(await body(req));return json({analysis:await updateAnalysis(current,user.userId,d)});
   }
   if(path[2]==="feedback"&&req.method==="POST"){
    if(!identity)await publicQuota(req);
    const d=z.object({kind:z.enum(["useful","unclear","incorrect"]),note:z.string().max(2000).default("")}).parse(await body(req));await database().prepare("INSERT INTO feedback (id,analysis_id,user_id,kind,note,created_at) VALUES (?,?,?,?,?,?)").bind(uid(),current.id,user.userId||"anonymous",d.kind,d.note,now()).run();await event(user.userId,"feedback",d.kind,current.id);return json({ok:true},201);
   }
   if(path[2]==="export"&&req.method==="GET")return new Response(JSON.stringify(current,null,2),{headers:{"Content-Type":"application/json; charset=utf-8","Content-Disposition":`attachment; filename="jd-analysis-${current.id}.json"`,"Cache-Control":"no-store"}});
  }
  throw new HttpError(404,"接口不存在 / Endpoint not found");
 }catch(e){if(e instanceof HttpError)return json({error:e.message},e.status);if(e instanceof z.ZodError)return json({error:"输入字段无效，请检查后重试 / Invalid input",fields:e.issues.map(x=>x.path.join("."))},422);console.error("Observatory API error",e instanceof Error?e.message:"unknown");return json({error:"操作未完成，请稍后重试 / The operation could not be completed"},500);}
}
