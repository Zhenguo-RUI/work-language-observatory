/** Best-effort reconnect within one warm instance; never a shared/persistent cache. */
type Entry<T>={expires:number;work:Promise<T>;pending:boolean};
export function createAnalysisRequestCache<T>(ttlMs=600000,maxEntries=32,retain:(value:T)=>boolean=()=>true){
 const entries=new Map<string,Entry<T>>();
 return (key:string|null,run:()=>Promise<T>,now=Date.now()):Promise<T>=>{
  if(!key)return run();
  for(const [id,e]of entries)if(e.expires<now&&!e.pending)entries.delete(id);
  const cached=entries.get(key);if(cached)return cached.work;
  if(entries.size>=maxEntries)return run();
  const e:Entry<T>={expires:now+ttlMs,pending:true,work:Promise.resolve().then(run)};
  entries.set(key,e);e.work.then(value=>{if(!retain(value)){entries.delete(key);return}e.pending=false;e.expires=Date.now()+ttlMs},()=>entries.delete(key));
  return e.work;
 };
}
