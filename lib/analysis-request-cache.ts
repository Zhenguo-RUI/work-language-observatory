/** Best-effort reconnect within one warm instance; never a shared/persistent cache. */
type Entry<T>={expires:number;work:Promise<T>;pending:boolean;value?:T};
export type AnalysisCacheInspection<T>={state:"unknown"}|{state:"pending"}|{state:"ready";value:T};
export function createAnalysisRequestCache<T>(ttlMs=600000,maxEntries=32,retain:(value:T)=>boolean=()=>true){
 const entries=new Map<string,Entry<T>>();
 const peek=(key:string|null,now=Date.now()):AnalysisCacheInspection<T>=>{
  if(!key)return {state:"unknown"};
  const entry=entries.get(key);if(!entry)return {state:"unknown"};
  if(entry.expires<now){entries.delete(key);return {state:"unknown"};}
  return entry.pending?{state:"pending"}:{state:"ready",value:entry.value as T};
 };
 const runCached=(key:string|null,run:()=>Promise<T>,now=Date.now()):Promise<T>=>{
  if(!key)return run();
  for(const [id,e]of entries)if(e.expires<now)entries.delete(id);
  const cached=entries.get(key);if(cached)return cached.work;
  if(entries.size>=maxEntries)return run();
  const e:Entry<T>={expires:now+ttlMs,pending:true,work:Promise.resolve().then(run)};
  entries.set(key,e);e.work.then(value=>{if(entries.get(key)!==e)return;if(!retain(value)){entries.delete(key);return}e.value=value;e.pending=false;e.expires=Date.now()+ttlMs},()=>{if(entries.get(key)===e)entries.delete(key)});
  return e.work;
 };
 // Inspection is read-only: it never invokes the producer or extends the TTL.
 return Object.assign(runCached,{peek});
}
