import type {Analysis} from "./observatory-types";
export type AnalysisResponse={analysis:Analysis;modelError?:boolean;modelFailure?:string;reused?:boolean;ephemeral?:boolean};
class AnalysisTransportError extends Error {}
async function requestAnalysisOnce(serialized:string,onStage:(stage:string)=>void,signal:AbortSignal|undefined,request:typeof fetch,requestId:string):Promise<AnalysisResponse>{
 const response=await request("/api/analyses",{method:"POST",headers:{"Content-Type":"application/json",Accept:"text/event-stream","X-WLO-Request-Id":requestId},body:serialized,signal});
 if(!response.headers.get("content-type")?.includes("text/event-stream")){
  let data;try{data=await response.json()}catch{if(response.status===429)throw new Error("analysis_rate_limited");if(response.status===401||response.status===403)throw new Error("analysis_auth_required");throw new AnalysisTransportError("analysis_response_invalid")}if(!response.ok){if(response.status>=500)throw new AnalysisTransportError(data.error||"analysis_connection_error");throw new Error(data.error||"Request failed");}return data;
 }
 if(!response.body)throw new AnalysisTransportError("analysis_connection_error");
 const reader=response.body.getReader(),decoder=new TextDecoder();let buffer="",result:AnalysisResponse|undefined;
 function parse(frame:string){
  const lines=frame.split("\n"),event=lines.find(line=>line.startsWith("event:"))?.slice(6).trim();
  const raw=lines.filter(line=>line.startsWith("data:")).map(line=>line.slice(5).trimStart()).join("\n");
  if(!raw)return;let data;try{data=JSON.parse(raw)}catch{throw new AnalysisTransportError("analysis_stream_invalid")}
  if(event==="stage")onStage(data.stage);
  else if(event==="result")result=data;
  else if(event==="failure"){if(data.status>=500)throw new AnalysisTransportError(data.error||"analysis_connection_error");throw new Error(data.error||"The analysis could not be completed");}
 }
 try{
  while(true){const {value,done}=await reader.read();buffer+=decoder.decode(value,{stream:!done}).replace(/\r\n/g,"\n");let split:number;while((split=buffer.indexOf("\n\n"))!==-1){const frame=buffer.slice(0,split);buffer=buffer.slice(split+2);parse(frame);}if(result){await reader.cancel().catch(()=>{});break;}if(done)break;}
  if(buffer.trim())parse(buffer);
 }catch(error){await reader.cancel().catch(()=>{});throw error;}finally{reader.releaseLock();}
 if(!result)throw new AnalysisTransportError("analysis_connection_ended");
 return result;
}

export type AnalysisRequestOptions={totalTimeoutMs?:number;pollBudgetMs?:number;pollIntervalMs?:number;maxPollAttempts?:number;reconnectDelayMs?:number};
function isTransportFailure(error:unknown){const message=error instanceof Error?error.message:String(error);return error instanceof AnalysisTransportError||error instanceof TypeError||/network\s*error|failed to fetch|fetch failed|load failed|connection (?:ended|unavailable|interrupted)/i.test(message);}
function pause(ms:number,signal:AbortSignal){return new Promise<void>((resolve,reject)=>{if(signal.aborted){reject(signal.reason);return;}const abort=()=>{clearTimeout(timer);reject(signal.reason)};const timer=setTimeout(()=>{signal.removeEventListener("abort",abort);resolve()},ms);signal.addEventListener("abort",abort,{once:true});});}

/** One SSE reconnect, then read-only status checks for the same submitted task.
 * Neither polling nor an unknown cache entry may start another model request.
 * Warm-instance recovery is best effort; the original total deadline still applies.
 */
export async function requestAnalysis(body:unknown,onStage:(stage:string)=>void,signal?:AbortSignal,request:typeof fetch=fetch,options:AnalysisRequestOptions={}):Promise<AnalysisResponse>{
 const serialized=JSON.stringify(body),requestId=crypto.randomUUID(),totalMs=Math.max(1,Math.min(310000,options.totalTimeoutMs??310000)),started=Date.now(),deadline=AbortSignal.timeout(totalMs);
 const activeSignal=signal?AbortSignal.any([signal,deadline]):deadline;
 let lastTransport:unknown=new AnalysisTransportError("analysis_connection_ended");
 for(let attempt=0;attempt<2;attempt++){
  if(deadline.aborted)throw new Error("analysis_deadline");
  activeSignal.throwIfAborted();
  try{return await requestAnalysisOnce(serialized,onStage,activeSignal,request,requestId)}catch(error){
   if(signal?.aborted)throw error;
   if(deadline.aborted)throw new Error("analysis_deadline");
   if(!isTransportFailure(error))throw error;
   lastTransport=error;
   if(attempt===0){onStage("reconnecting");try{await pause(options.reconnectDelayMs??500,activeSignal)}catch(error){if(deadline.aborted)throw new Error("analysis_deadline");throw error;}}
  }
 }
 const totalRemaining=totalMs-(Date.now()-started);if(totalRemaining<=0)throw new Error("analysis_deadline");
 const remaining=Math.min(totalRemaining,options.pollBudgetMs??totalMs),pollAttempts=Math.max(0,Math.min(80,options.maxPollAttempts??80));
 if(remaining<=0||!pollAttempts)throw lastTransport;
 const pollDeadline=AbortSignal.timeout(Math.max(1,remaining)),pollSignal=AbortSignal.any([activeSignal,pollDeadline]),until=Date.now()+remaining;
 onStage("checking_result");
 for(let poll=0;poll<pollAttempts&&Date.now()<until;poll++){
  if(signal?.aborted)throw signal.reason;
  if(deadline.aborted)throw new Error("analysis_deadline");
  try{
   const response=await request("/api/analyses",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json","X-WLO-Request-Id":requestId,"X-WLO-Result-Status":"1"},body:serialized,signal:pollSignal,cache:"no-store"});
   if([401,403,422,429].includes(response.status)){
    const error=response.status===429?"analysis_rate_limited":response.status===422?"analysis_input_invalid":"analysis_auth_required";
    throw new Error(error);
   }
   if(response.status!==404){
    if(!response.ok)throw new AnalysisTransportError("analysis_connection_error");
    let state;try{state=await response.json()}catch{throw new AnalysisTransportError("analysis_response_invalid")}
    if(state?.state==="ready"&&state.data?.analysis)return state.data as AnalysisResponse;
    if(state?.state!=="pending"&&state?.state!=="unknown")throw new AnalysisTransportError("analysis_response_invalid");
   }
  }catch(error){
   if(signal?.aborted)throw signal.reason;
   if(deadline.aborted)throw new Error("analysis_deadline");
   if(pollDeadline.aborted)break;
   if(!isTransportFailure(error))throw error;
   lastTransport=error;
  }
  if(poll+1>=pollAttempts)break;
  const timeLeft=until-Date.now();if(timeLeft<=0)break;const wait=Math.min(Math.max(0,options.pollIntervalMs??4000),timeLeft);
  try{if(wait>0)await pause(wait,pollSignal)}catch(error){if(signal?.aborted)throw signal.reason;if(deadline.aborted)throw new Error("analysis_deadline");if(pollDeadline.aborted)break;throw error;}
 }
 if(deadline.aborted)throw new Error("analysis_deadline");
 throw new AnalysisTransportError("analysis_connection_ended");
}
