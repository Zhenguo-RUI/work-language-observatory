export type ModelProvider = "openai" | "deepseek";
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
  request?:typeof fetch;
};

export async function requestModelJson(options:JsonRequest):Promise<string> {
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
    reasoning_effort:options.thinking === false ? "none" : "high",
    // DeepSeek counts thinking and final answer in the completion budget.
    max_tokens:options.thinking === false ? options.maxOutputTokens : Math.max(16000,options.maxOutputTokens),
    stream:false,
  } : {
    model:options.model,store:false,max_output_tokens:options.maxOutputTokens,
    instructions:options.instructions,input:JSON.stringify(options.input),
    text:{format:{type:"json_schema",name:options.schemaName,strict:true,schema:options.schema}},
  };
  const response = await request(endpoint,{
    method:"POST",
    headers:{"Content-Type":"application/json",Authorization:`Bearer ${options.apiKey}`},
    signal:AbortSignal.timeout(options.timeoutMs),body:JSON.stringify(body),
  });
  // Do not propagate provider response bodies: they can contain source text.
  if(!response.ok)throw new Error(`model_http_${response.status}`);
  if(deepseek){
    const data=await response.json() as {choices?:{finish_reason?:string;message?:{content?:string;refusal?:string}}[]};
    const choice=data.choices?.[0];
    if(choice?.finish_reason === "length")throw new Error("model_incomplete_output");
    if(choice?.finish_reason !== "stop" || choice.message?.refusal)throw new Error("model_empty_or_refused");
    const content=choice.message?.content;
    if(typeof content !== "string" || !content.trim())throw new Error("model_empty_or_refused");
    // reasoning_content is deliberately neither returned nor stored.
    return content;
  }
  const data=await response.json() as {status?:string;output?:{content?:{type:string;text?:string}[]}[]};
  if(data.status === "incomplete")throw new Error("model_incomplete_output");
  const content=data.output?.flatMap(o=>o.content||[]).filter(c=>c.type === "output_text").map(c=>c.text||"").join("");
  if(!content?.trim())throw new Error("model_empty_or_refused");
  return content;
}
