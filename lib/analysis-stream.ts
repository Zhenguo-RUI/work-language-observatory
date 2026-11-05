import type {Analysis} from "./observatory-types";
export type AnalysisResponse={analysis:Analysis;modelError?:boolean;reused?:boolean;ephemeral?:boolean};
export async function requestAnalysis(body:unknown,onStage:(stage:string)=>void):Promise<AnalysisResponse>{
 const response=await fetch("/api/analyses",{method:"POST",headers:{"Content-Type":"application/json",Accept:"text/event-stream"},body:JSON.stringify(body)});
 if(!response.headers.get("content-type")?.includes("text/event-stream")){
  const data=await response.json();if(!response.ok)throw new Error(data.error||"Request failed");return data;
 }
 if(!response.body)throw new Error("Analysis connection unavailable");
 const reader=response.body.getReader(),decoder=new TextDecoder();let buffer="",result:AnalysisResponse|undefined;
 function parse(frame:string){
  const lines=frame.split("\n"),event=lines.find(line=>line.startsWith("event:"))?.slice(6).trim();
  const raw=lines.filter(line=>line.startsWith("data:")).map(line=>line.slice(5).trimStart()).join("\n");
  if(!raw)return;const data=JSON.parse(raw);
  if(event==="stage")onStage(data.stage);
  else if(event==="result")result=data;
  else if(event==="failure")throw new Error(data.error||"The analysis could not be completed");
 }
 try{
  while(true){const {value,done}=await reader.read();buffer+=decoder.decode(value,{stream:!done}).replace(/\r\n/g,"\n");let split:number;while((split=buffer.indexOf("\n\n"))!==-1){const frame=buffer.slice(0,split);buffer=buffer.slice(split+2);parse(frame);}if(done)break;}
  if(buffer.trim())parse(buffer);
 }catch(error){await reader.cancel().catch(()=>{});throw error;}finally{reader.releaseLock();}
 if(!result)throw new Error("The connection ended before the result arrived. Please try again.");
 return result;
}
