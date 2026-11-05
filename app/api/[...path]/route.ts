import {handleApi} from "@/lib/observatory-server";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export const maxDuration=180;
type Context={params:Promise<{path:string[]}>};
async function route(request:Request,context:Context){
 const path=(await context.params).path;
 if(request.method!=="POST"||path.join("/")!=="analyses"||!request.headers.get("accept")?.includes("text/event-stream"))return handleApi(request,path);
 const encoder=new TextEncoder();let cancelled=false;
 const stream=new ReadableStream({
  async start(controller){
   const send=(event:string,data:unknown)=>{if(!cancelled)controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));};
   const heartbeat=setInterval(()=>{if(!cancelled)controller.enqueue(encoder.encode(": waiting\n\n"));},15000);
   try{
    const response=await handleApi(request,path,stage=>send("stage",{stage}));
    const data=await response.json();send(response.ok?"result":"failure",data);
   }catch{send("failure",{error:"分析连接中断，请重试 / Analysis interrupted; please retry"});}
   finally{clearInterval(heartbeat);if(!cancelled)controller.close();}
  },
  cancel(){cancelled=true;},
 });
 return new Response(stream,{headers:{"Content-Type":"text/event-stream; charset=utf-8","Cache-Control":"no-cache, no-transform","X-Accel-Buffering":"no","X-Content-Type-Options":"nosniff","Vary":"Cookie"}});
}
export {route as GET,route as POST,route as PATCH};
