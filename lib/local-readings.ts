import type {Analysis} from "./observatory-types";

const DB_NAME="work-language-readings",STORE="readings",FALLBACK_KEY="observatory-readings-v1";
type StoredReading=Analysis&{_localSavedAt?:number};
function valid(value:unknown):value is Analysis{
 const a=value as Partial<Analysis>|null;
 return !!a&&typeof a.id==="string"&&typeof a.title==="string"&&typeof a.raw_text==="string"&&!!a.result?.headline&&Array.isArray(a.result.terms)&&typeof a.updated_at==="string";
}
function fallbackRead():Analysis[]{
 const stored=JSON.parse(localStorage.getItem(FALLBACK_KEY)||"[]") as unknown;
 return Array.isArray(stored)?stored.filter(valid):[];
}
function open():Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB_NAME,1);
  request.onupgradeneeded=()=>request.result.createObjectStore(STORE,{keyPath:"id"});
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||new Error("local_storage_unavailable"));
  request.onblocked=()=>reject(new Error("local_storage_blocked"));
 });
}
async function transact<T>(mode:IDBTransactionMode,operation:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T>{
 const db=await open();
 return new Promise((resolve,reject)=>{
  const transaction=db.transaction(STORE,mode),request=operation(transaction.objectStore(STORE));
  transaction.oncomplete=()=>{db.close();resolve(request.result);};
  transaction.onabort=transaction.onerror=()=>{db.close();reject(transaction.error||new Error("local_storage_unavailable"));};
 });
}
export async function loadLocalReadings():Promise<Analysis[]>{
 let databaseRecords:StoredReading[];
 try{databaseRecords=(await transact("readonly",store=>store.getAll())).filter(valid);}catch{return fallbackRead();}
 let fallback:StoredReading[]=[];try{fallback=fallbackRead();}catch{}
 const records=new Map<string,StoredReading>();
 for(const a of [...databaseRecords,...fallback]){const previous=records.get(a.id);if(!previous||(a._localSavedAt||Date.parse(a.updated_at))>=(previous._localSavedAt||Date.parse(previous.updated_at)))records.set(a.id,a);}
 return [...records.values()].sort((a,b)=>b.updated_at.localeCompare(a.updated_at));
}
export async function saveLocalReading(analysis:Analysis):Promise<void>{
 const stored={...analysis,_localSavedAt:Date.now()};
 try{await transact("readwrite",store=>store.put(stored));try{const previous=fallbackRead();if(previous.some(a=>a.id===analysis.id))localStorage.setItem(FALLBACK_KEY,JSON.stringify(previous.filter(a=>a.id!==analysis.id)));}catch{}}
 catch{
  const records=fallbackRead().filter(a=>a.id!==analysis.id);records.unshift(stored);
  // A full browser store must report failure rather than silently discard older readings.
  localStorage.setItem(FALLBACK_KEY,JSON.stringify(records));
 }
}
export async function deleteLocalReading(id:string):Promise<void>{
 let databaseDeleted=false;
 try{await transact("readwrite",store=>store.delete(id));databaseDeleted=true;}catch{}
 try{const records=fallbackRead().filter(a=>a.id!==id);localStorage.setItem(FALLBACK_KEY,JSON.stringify(records));}catch(error){if(!databaseDeleted)throw error;}
}
export function mergeReadings(local:Analysis[],cloud:Analysis[]):Analysis[]{
 const map=new Map(local.map(a=>[a.id,a]));
 for(const a of cloud){const previous=map.get(a.id);if(!previous||a.updated_at>=previous.updated_at)map.set(a.id,a);}
 return [...map.values()].sort((a,b)=>b.updated_at.localeCompare(a.updated_at));
}
