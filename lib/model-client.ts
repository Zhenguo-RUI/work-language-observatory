import {safeModelFailure} from "./usage-diagnostics";
export type ModelProvider = "openai" | "deepseek";
/** Transport diagnostics only: completion does not mean the analysis passed validation. */
export type ModelRequestDiagnostics={elapsedMs:number;firstContentMs:number|null;outputChars:number;finishReason:string|null;outcome:"completed"|"failed";errorCode?:string};
type RuntimeSettings = {
  ANALYSIS_PROVIDER?:string;
  ANALYSIS_MODEL?:string;
  OPENAI_API_KEY?:string;
  DEEPSEEK_API_KEY?:string;
};

// Called only from server modules. Never include its apiKey in an API response.
export function modelRuntime(settings:RuntimeSettings) {
  const provider:ModelProvider = settings.ANALYSIS_PROVIDER === "deepseek" ||
    (!settings.ANALYSIS_PROVIDER && !!settings.DEEPSEEK_API_KEY && !settings.OPENAI_API_KEY)
    ? "deepseek" : "openai";
  return {
    provider,
    apiKey:provider === "deepseek" ? settings.DEEPSEEK_API_KEY : settings.OPENAI_API_KEY,
    model:settings.ANALYSIS_MODEL || (provider === "deepseek" ? "deepseek-flash" : ""),
  };
}

type JsonRequest = {
  provider?:ModelProvider;
  apiKey:string;
  model:string;
  instructions:string;
  input:unknown;
  schema:Record<string,unknown>;
  schemaName:string;
  maxOutputTokens:number;
  timeoutMs:number;
  thinking?:boolean;
  reasoningEffort?:"low"|"high";
  maxCompletionTokens?:number;
  request?:typeof fetch;
  onDiagnostics?:(diagnostics:ModelRequestDiagnostics)=>void;
};

const MAX_PROVIDER_BYTES=16*1024*1024;
const MAX_STREAM_FRAME=512*1024;
const MAX_ANSWER_LENGTH=1024*1024;

// Keep reading upstream while a thinking model works. A single non-streaming
// JSON response can otherwise leave an intermediary connection idle for a minute.
// The browser still receives a complete, validated reading, never these deltas.
async function consumeProviderBody(response:Response,signal:AbortSignal,onChunk:(bytes:Uint8Array,done:boolean)=>boolean){
 if(!response.body)throw new Error("model_empty_response");
 const reader=response.body.getReader();let completed=false,total=0;
 const abort=()=>{void reader.cancel().catch(()=>{});};
 signal.addEventListener("abort",abort,{once:true});
 try{
  signal.throwIfAborted();
  for(;;){
   const {value,done}=await reader.read();signal.throwIfAborted();
   if(done){completed=true;onChunk(new Uint8Array(),true);break;}
   total+=value.byteLength;if(total>MAX_PROVIDER_BYTES)throw new Error("model_response_too_large");
   if(!onChunk(value,false))break;
  }
 }finally{
  signal.removeEventListener("abort",abort);
  // Do not wait on a stalled producer's cancellation promise after the deadline.
  if(!completed)void reader.cancel().catch(()=>{});
  reader.releaseLock();
 }
}

async function providerJson(response:Response,signal:AbortSignal):Promise<unknown>{
 const decoder=new TextDecoder("utf-8",{fatal:true});let text="";
 await consumeProviderBody(response,signal,(bytes,done)=>{text+=decoder.decode(bytes,{stream:!done});return true;});
 try{return JSON.parse(text);}catch{throw new Error("model_invalid_response");}
}

type OutputObserver={content:(length:number)=>void;finish:(reason:unknown)=>void};
async function deepseekStream(response:Response,signal:AbortSignal,observe:OutputObserver):Promise<string>{
 const decoder=new TextDecoder("utf-8",{fatal:true});
 let pending="",data:string[]=[],frameSize=0,answerLength=0,stopped=false,sawDone=false;
 const content:string[]=[];
 const dispatch=()=>{
  if(!data.length){frameSize=0;return;}
  const payload=data.join("\n");data=[];frameSize=0;
  if(payload.trim()==="[DONE]"){sawDone=true;return;}
  let event:unknown;try{event=JSON.parse(payload);}catch{throw new Error("model_invalid_stream");}
  if(!event||typeof event!=="object")throw new Error("model_invalid_stream");
  const value=event as {error?:unknown;choices?:{index?:number;finish_reason?:string|null;delta?:{content?:unknown;refusal?:unknown;reasoning_content?:unknown}}[]};
  if(value.error)throw new Error("model_stream_error");
  if(!Array.isArray(value.choices))throw new Error("model_invalid_stream");
  // Tolerate a usage-only frame from a compatible proxy. It cannot establish
  // completion: both a stop reason and the terminal DONE marker are mandatory.
  const choice=value.choices[0];if(!choice)return;
  if(choice.index!==undefined&&choice.index!==0)throw new Error("model_invalid_stream");
  if(choice.delta?.refusal)throw new Error("model_empty_or_refused");
  const delta=choice.delta?.content;
  if(delta!==undefined&&delta!==null&&typeof delta!=="string")throw new Error("model_invalid_stream");
  if(typeof delta==="string"&&delta){
   observe.content(delta.length);
   if(stopped)throw new Error("model_invalid_stream");
   answerLength+=delta.length;if(answerLength>MAX_ANSWER_LENGTH)throw new Error("model_response_too_large");
   content.push(delta);
  }
  // reasoning_content is deliberately ignored rather than concatenated, logged
  // or returned. It is not part of the JSON answer or the analysis contract.
  if(choice.finish_reason){
   observe.finish(choice.finish_reason);
   if(choice.finish_reason==="length")throw new Error("model_incomplete_output");
   if(choice.finish_reason!=="stop")throw new Error("model_empty_or_refused");
   stopped=true;
  }
 };
 const line=(value:string)=>{
  if(value===""){dispatch();return;}
  if(value.startsWith(":"))return;
  if(value==="data"||value.startsWith("data:")){
   const part=value==="data"?"":value.slice(5).replace(/^ /,"");
   frameSize+=part.length;if(frameSize>MAX_STREAM_FRAME)throw new Error("model_response_too_large");data.push(part);
  }
 };
 await consumeProviderBody(response,signal,(bytes,done)=>{
  pending+=decoder.decode(bytes,{stream:!done});
  for(;;){
   const at=pending.search(/[\r\n]/);if(at<0)break;
   if(!done&&pending[at]==="\r"&&at===pending.length-1)break;
   const skip=pending[at]==="\r"&&pending[at+1]==="\n"?2:1;
   const current=pending.slice(0,at);pending=pending.slice(at+skip);line(current);
   if(sawDone)return false;
  }
  if(pending.length>MAX_STREAM_FRAME)throw new Error("model_response_too_large");
  if(done){if(pending)line(pending);dispatch();}
  return !sawDone;
 });
 if(!sawDone||!stopped)throw new Error("model_incomplete_stream");
 const answer=content.join("");if(!answer.trim())throw new Error("model_empty_or_refused");return answer;
}

export async function requestModelJson(options:JsonRequest):Promise<string> {
  const started=Date.now();let firstContentMs:number|null=null,outputChars=0,finishReason:string|null=null,errorCode:string|undefined,outcome:ModelRequestDiagnostics["outcome"]="failed";
  const observe:OutputObserver={content:length=>{if(length>0){firstContentMs??=Math.max(0,Date.now()-started);outputChars+=length;}},finish:reason=>{finishReason=typeof reason==="string"&&["stop","length","content_filter","tool_calls","function_call","insufficient_system_resource","aborted","completed","incomplete","failed"].includes(reason)?reason:"other";}};
  try{
  const deepseek = options.provider === "deepseek";
  const request = options.request || fetch;
  // Destinations are fixed: an operator cannot redirect a provider key elsewhere.
  const endpoint = deepseek ? "https://api.deepseek.com/chat/completions" : "https://api.openai.com/v1/responses";
  const body = deepseek ? {
    model:options.model,
    messages:[
      {role:"system",content:options.instructions + "\nReturn exactly one JSON object, without Markdown fences, matching this JSON schema: " + JSON.stringify(options.schema)},
      {role:"user",content:JSON.stringify(options.input)},
    ],
    response_format:{type:"json_object"},
    thinking:{type:options.thinking === false ? "disabled" : "enabled"},
    reasoning_effort:options.thinking === false ? "none" : options.reasoningEffort || "high",
    // DeepSeek counts thinking and final answer in the completion budget.
    max_tokens:options.thinking === false ? options.maxOutputTokens : Math.max(options.maxCompletionTokens??32768,options.maxOutputTokens),
    stream:true,
  } : {
    model:options.model,store:false,max_output_tokens:options.maxOutputTokens,
    instructions:options.instructions,input:JSON.stringify(options.input),
    text:{format:{type:"json_schema",name:options.schemaName,strict:true,schema:options.schema}},
  };
  const signal=AbortSignal.timeout(options.timeoutMs);
  const response = await request(endpoint,{
    method:"POST",
    headers:{"Content-Type":"application/json",Authorization:`Bearer ${options.apiKey}`},
    signal,body:JSON.stringify(body),
  });
  // Do not propagate provider response bodies: they can contain source text.
  if(!response.ok)throw new Error(`model_http_${response.status}`);
  if(deepseek){
    if(response.headers.get("content-type")?.includes("text/event-stream")){const answer=await deepseekStream(response,signal,observe);outcome="completed";return answer;}
    // Some test fixtures and compatible gateways return the non-streaming JSON
    // shape. Preserve its strict finish-reason checks rather than treating it as SSE.
    const data=await providerJson(response,signal) as {choices?:{finish_reason?:string;message?:{content?:string;refusal?:string}}[]};
    const choice=data.choices?.[0];
    if(choice?.finish_reason)observe.finish(choice.finish_reason);
    if(typeof choice?.message?.content==="string")observe.content(choice.message.content.length);
    if(choice?.finish_reason === "length")throw new Error("model_incomplete_output");
    if(choice?.finish_reason !== "stop" || choice.message?.refusal)throw new Error("model_empty_or_refused");
    const content=choice.message?.content;
    if(typeof content !== "string" || !content.trim())throw new Error("model_empty_or_refused");
    // reasoning_content is deliberately neither returned nor stored.
    outcome="completed";return content;
  }
  const data=await providerJson(response,signal) as {status?:string;output?:{content?:{type:string;text?:string}[]}[]};
  if(data.status)observe.finish(data.status);
  if(data.status === "incomplete")throw new Error("model_incomplete_output");
  const content=data.output?.flatMap(o=>o.content||[]).filter(c=>c.type === "output_text").map(c=>c.text||"").join("");
  if(content)observe.content(content.length);
  if(!content?.trim())throw new Error("model_empty_or_refused");
  outcome="completed";return content;
  }catch(error){errorCode=safeModelFailure(error);throw error;}
  finally{
   // Never emit prompts, source material, answer fragments, reasoning or arbitrary errors.
   try{options.onDiagnostics?.({elapsedMs:Math.max(0,Date.now()-started),firstContentMs,outputChars,finishReason,outcome,...(errorCode?{errorCode}:{})});}catch{/* Observability must not alter the request result. */}
  }
}
