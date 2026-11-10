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

/** Reconnect once after transport failure; input and request identity stay fixed. */
export async function requestAnalysis(body:unknown,onStage:(stage:string)=>void,signal?:AbortSignal,request:typeof fetch=fetch):Promise<AnalysisResponse>{
 const serialized=JSON.stringify(body),requestId=crypto.randomUUID(),deadline=AbortSignal.timeout(310000);
 const activeSignal=signal?AbortSignal.any([signal,deadline]):deadline;
 for(let attempt=0;attempt<2;attempt++){
  if(deadline.aborted)throw new Error("analysis_deadline");
  activeSignal.throwIfAborted();
  try{return await requestAnalysisOnce(serialized,onStage,activeSignal,request,requestId)}catch(error){
   if(signal?.aborted)throw error;
   if(deadline.aborted)throw new Error("analysis_deadline");
   const message=error instanceof Error?error.message:String(error);
   const transport=error instanceof AnalysisTransportError||error instanceof TypeError||/network\s*error|failed to fetch|fetch failed|load failed|connection (?:ended|unavailable|interrupted)/i.test(message);
   if(attempt||!transport)throw error;
   onStage("reconnecting");await new Promise(resolve=>setTimeout(resolve,500));
  }
 }
 throw new AnalysisTransportError("analysis_connection_ended");
}
