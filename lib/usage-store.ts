import {createHmac,randomUUID} from "node:crypto";
import type {Database} from "./database-core";
import type {UsageEventInput,UsageFeedbackInput,UsageRunOutcome,UsageSummary} from "./usage-contract";

const iso=()=>new Date().toISOString();
export class UsageRateLimitError extends Error{}

// The rotating fingerprint is used only for rate-limit counters, never event rows.
export function usageFingerprint(req:Request,secret:string,stamp=new Date()){
 const ip=process.env.VERCEL==="1"?(req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"shared"):"local";
 return createHmac("sha256",secret).update(`${stamp.toISOString().slice(0,13)}:${ip}`).digest("hex").slice(0,32);
}
export async function reserveUsageWrite(db:Database,scope:"event"|"feedback"|"share",fingerprint:string,stamp=new Date()){
 const hour=stamp.toISOString().slice(0,13),limits=scope==="event"?[20000,500]:scope==="feedback"?[1000,40]:[200,10];
 for(const [index,key] of ["all",fingerprint].entries()){
  const row=await db.prepare("INSERT INTO settings (key,value,updated_at) VALUES (?, '1', ?) ON CONFLICT(key) DO UPDATE SET value=CAST(CAST(settings.value AS INTEGER)+1 AS TEXT),updated_at=excluded.updated_at WHERE CAST(settings.value AS INTEGER) < ? RETURNING value").bind(`usage-rate:${scope}:${hour}:${key}`,stamp.toISOString(),limits[index]).first<{value:string}>();
  if(!row)throw new UsageRateLimitError("usage_rate_limit");
 }
 // Reserve cleanup once per UTC day across concurrent function instances.
 const cleanup=await db.prepare("INSERT INTO settings (key,value,updated_at) VALUES ('usage-retention-day',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at WHERE settings.value!=excluded.value RETURNING value").bind(stamp.toISOString().slice(0,10),stamp.toISOString()).first();
 if(cleanup)await pruneUsage(db,stamp);
}
export async function recordUsageEvent(db:Database,value:UsageEventInput){
 return db.prepare("INSERT INTO usage_events (id,name,view,format,reading_id,created_at) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING").bind(value.eventId,value.name,value.view||"",value.format||"",value.readingId||null,iso()).run();
}
// A stable random browser feedback id makes vote and comment updates one row.
// It is not derived from identity, IP, JD content or an advertising identifier.
export async function recordUsageFeedback(db:Database,value:UsageFeedbackInput){
 const stamp=iso();
 return db.prepare("INSERT INTO usage_feedback (id,reading_id,vote,category,note,created_at,updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET vote=excluded.vote,category=excluded.category,note=CASE WHEN ? THEN excluded.note ELSE usage_feedback.note END,updated_at=excluded.updated_at WHERE usage_feedback.reading_id=excluded.reading_id RETURNING id").bind(value.feedbackId,value.readingId,value.vote,value.category,value.note??"",stamp,stamp,value.note!==undefined).first<{id:string}>();
}
export async function startUsageRun(db:Database,requestedModel:boolean){
 const id=randomUUID(),stamp=iso();
 await db.prepare("INSERT INTO usage_runs (id,status,requested_model,created_at,updated_at) VALUES (?,'accepted',?,?,?)").bind(id,requestedModel,stamp,stamp).run();return id;
}
export async function finishUsageRun(db:Database,id:string,outcome:UsageRunOutcome,options:{readingId?:string;engine?:string;durationMs:number;errorCode?:string}){
 await db.prepare("UPDATE usage_runs SET reading_id=?,status=?,engine=?,duration_ms=?,error_code=?,updated_at=? WHERE id=?").bind(options.readingId||null,outcome,options.engine||"",Math.min(900000,Math.max(0,Math.round(options.durationMs))),options.errorCode||"",iso(),id).run();
}
export async function pruneUsage(db:Database,stamp=new Date()){
 const date=(days:number)=>new Date(stamp.getTime()-days*86400000).toISOString();
 await db.batch([
  db.prepare("DELETE FROM usage_events WHERE created_at<?").bind(date(90)),
  db.prepare("DELETE FROM usage_runs WHERE created_at<?").bind(date(90)),
  db.prepare("DELETE FROM usage_feedback WHERE updated_at<?").bind(date(180)),
  db.prepare("DELETE FROM settings WHERE key LIKE 'usage-rate:%' AND updated_at<?").bind(date(2)),
 ]);
}
export async function getUsageSummary(db:Database,stamp=new Date()):Promise<UsageSummary>{
 // A platform termination cannot execute the handler's catch/finally path.
 // Old accepted rows are interrupted attempts, rather than forever "running".
 await db.prepare("UPDATE usage_runs SET status='failed',error_code='interrupted',duration_ms=900000,updated_at=? WHERE status='accepted' AND created_at<?").bind(stamp.toISOString(),new Date(stamp.getTime()-15*60000).toISOString()).run();
 const after=new Date(stamp.getTime()-30*86400000).toISOString();
 const queries=[
  "SELECT name,count(*)::integer AS count FROM usage_events WHERE created_at>=? GROUP BY name ORDER BY count DESC",
  "SELECT view AS name,count(*)::integer AS count FROM usage_events WHERE created_at>=? AND name='view_open' GROUP BY view ORDER BY count DESC",
  "SELECT format,count(*)::integer AS count FROM usage_events WHERE created_at>=? AND name='export_download' GROUP BY format ORDER BY count DESC",
  "SELECT vote,count(*)::integer AS count FROM usage_feedback WHERE updated_at>=? GROUP BY vote",
  "SELECT status,count(*)::integer AS count FROM usage_runs WHERE created_at>=? GROUP BY status",
  "SELECT percentile_cont(0.5) WITHIN GROUP(ORDER BY duration_ms)::integer AS median FROM usage_runs WHERE created_at>=? AND status IN ('succeeded','fallback')",
  "SELECT id,reading_id,status,engine,requested_model,duration_ms,error_code,created_at,updated_at FROM usage_runs WHERE created_at>=? ORDER BY created_at DESC LIMIT 100",
  "SELECT id,reading_id,vote,category,note,created_at,updated_at FROM usage_feedback WHERE updated_at>=? ORDER BY updated_at DESC LIMIT 100",
 ];
 const result=await db.batch(queries.map(sql=>db.prepare(sql).bind(after)));
 const rows=<T>(index:number)=>result[index].results as T[];
 const eventsByName=rows<{name:string;count:number}>(0),ratings=rows<{vote:string;count:number}>(3),runs=rows<{status:string;count:number}>(4);
 const count=(status:string)=>runs.find(r=>r.status===status)?.count||0;
 const up=ratings.find(r=>r.vote==="up")?.count||0,down=ratings.find(r=>r.vote==="down")?.count||0;
 return {windowDays:30,events:eventsByName.reduce((n,r)=>n+r.count,0),eventsByName,views:rows(1),downloads:rows(2),ratings:{up,down,total:up+down},funnel:{accepted:runs.reduce((n,r)=>n+r.count,0),succeeded:count("succeeded"),fallback:count("fallback"),failed:count("failed"),reused:count("reused"),inProgress:count("accepted"),medianDurationMs:rows<{median:number|null}>(5)[0]?.median??null},recentRuns:rows(6),recentFeedback:rows(7),retention:{eventsDays:90,feedbackDays:180}};
}
