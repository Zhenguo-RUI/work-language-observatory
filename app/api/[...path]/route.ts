import {createHash,randomUUID} from "node:crypto";
import {createAnalysisRequestCache} from "@/lib/analysis-request-cache";
import {handleApi} from "@/lib/observatory-server";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export const maxDuration=300;
const resume=createAnalysisRequestCache<{data:unknown;ok:boolean;status:number}>(600000,32,result=>result.ok);
// First observed analysis stream in this process is a diagnostic, not proof of a cold start.
let hasSeenAnalysisStream=false;
const knownStages=new Set(["accepted","context","analysis","repairing","retrying","validating","saving","reconnecting"]);
type Context={params:Promise<{path:string[]}>};
type Diagnostic={event:"analysis_stream";requestId:string;phase:string;elapsedMs:number;first_in_instance:boolean;resumed?:boolean;status?:number;errorType?:string};
async function route(request:Request,context:Context){
 const path=(await context.params).path;
 if(request.method!=="POST"||path.join("/")!=="analyses"||!request.headers.get("accept")?.includes("text/event-stream"))return handleApi(request,path);
 const suppliedId=request.headers.get("x-wlo-request-id")||"",validId=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(suppliedId);
 const requestId=validId?suppliedId:randomUUID(),firstInInstance=!hasSeenAnalysisStream;hasSeenAnalysisStream=true;
 const cacheKey=validId?createHash("sha256").update([requestId,request.url,request.headers.get("cookie")||"",request.headers.get("origin")||"",await request.clone().text()].join("\0")).digest("hex"):null;
 const encoder=new TextEncoder();let cancelled=false,finished=false;const started=Date.now();
 const log=(phase:string,extra:Pick<Diagnostic,"resumed"|"status"|"errorType">={})=>{const entry:Diagnostic={event:"analysis_stream",requestId,phase,elapsedMs:Math.max(0,Date.now()-started),first_in_instance:firstInInstance,...extra};console.info(JSON.stringify(entry));return entry;};
 const stream=new ReadableStream({
  async start(controller){
   const send=(event:string,data:unknown)=>{if(!cancelled)controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));};
   const diagnostic=(phase:string,extra:Pick<Diagnostic,"resumed"|"status"|"errorType">={})=>send("diagnostics",log(phase,extra));
   send("stage",{stage:"accepted"});diagnostic("accepted");
   const heartbeat=setInterval(()=>{if(!cancelled)controller.enqueue(encoder.encode(": waiting\n\n"));},5000);
   try{
    let executed=false;
    const result=await resume(cacheKey,async()=>{executed=true;diagnostic("execution_started");const response=await handleApi(request,path,stage=>{send("stage",{stage});diagnostic(knownStages.has(stage)?stage:"other_stage");});return {data:await response.json(),ok:response.ok,status:response.status};});
    diagnostic(result.ok?"result":"failure",{status:result.status,resumed:!executed,...(!result.ok?{errorType:`http_${result.status}`}:{})});
    send(result.ok?"result":"failure",result.ok?result.data:{...(result.data as object),status:result.status});finished=true;
   }catch(error){const errorType=error instanceof DOMException&&error.name==="AbortError"?"aborted":error instanceof TypeError?"transport_error":"stream_exception";diagnostic("failure",{status:503,errorType});send("failure",{status:503,error:"分析连接中断，请重试 / Analysis interrupted; please retry"});finished=true;}
   finally{clearInterval(heartbeat);if(!cancelled)controller.close();}
  },
  cancel(){cancelled=true;if(!finished)log("cancelled");},
 });
 return new Response(stream,{headers:{"Content-Type":"text/event-stream; charset=utf-8","Cache-Control":"no-cache, no-transform","X-Accel-Buffering":"no","X-Content-Type-Options":"nosniff","Vary":"Cookie","X-WLO-Request-Id":requestId}});
}
export {route as GET,route as POST,route as PATCH};
