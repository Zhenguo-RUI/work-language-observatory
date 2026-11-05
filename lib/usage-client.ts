export function trackUsage(name:string,properties:Record<string,unknown>={}){
 const body=JSON.stringify({name,eventId:crypto.randomUUID(),...properties});
 void fetch("/api/usage/events",{method:"POST",headers:{"Content-Type":"application/json"},body,keepalive:true}).catch(()=>{});
}
export function feedbackIdentity(readingId:string){
 const key="observatory-feedback-ids-v1";
 try{const ids=JSON.parse(localStorage.getItem(key)||"{}") as Record<string,string>;if(!ids[readingId]){ids[readingId]=crypto.randomUUID();localStorage.setItem(key,JSON.stringify(ids));}return ids[readingId];}catch{return crypto.randomUUID();}
}
