import type {Analysis,Bi} from "./observatory-types";
export type ReadingSubmission={title:string;company:string;rawText:string;sourceUrl:string;useModel:boolean};
/** Snapshot the saved reading, never a potentially unrelated input form. */
export function modelRetrySubmission(reading:Analysis):ReadingSubmission{return {title:reading.title,company:reading.company,rawText:reading.raw_text,sourceUrl:reading.source_url,useModel:true};}
export function modelFailureText(code:string|undefined):Bi{
 if(code?.includes("timeout")||code==="analysis_deadline")return {zh:"模型响应超时，尚未完成完整分析。",en:"The model timed out before completing the analysis."};
 if(code==="model_network_error")return {zh:"与模型服务的连接中断，尚未收到完整分析。",en:"The connection to the model service was interrupted before a complete analysis arrived."};
 if(code==="model_http_429")return {zh:"模型服务繁忙或触发限流，请稍后重试。",en:"The model service is busy or rate-limited. Please retry shortly."};
 if(code==="model_http_402")return {zh:"模型服务余额不足，需由网站运营者处理。",en:"The model service has insufficient credit. The site operator needs to resolve this."};
 if(code==="model_http_400")return {zh:"模型请求配置不符合服务要求，需由网站运营者检查。",en:"The model request configuration was rejected and needs to be checked by the site operator."};
 if(code==="model_http_401"||code==="model_http_403"||code==="model_not_connected")return {zh:"模型服务连接配置异常，需由网站运营者检查。",en:"The model service connection needs to be checked by the site operator."};
 if(/^model_http_5\d{2}$/.test(code||""))return {zh:"模型服务暂时异常，请稍后重试。",en:"The model service is temporarily unavailable. Please retry shortly."};
 if(code==="model_incomplete_output"||code==="model_incomplete_stream")return {zh:"模型输出被截断，尚未收到完整分析。",en:"The model output was cut off before a complete analysis arrived."};
 if(code==="model_contract_invalid_after_one_repair")return {zh:"模型分析未通过证据或结构检查，未作为完整分析展示。",en:"The model reading did not pass evidence or structure checks and is not shown as a completed analysis."};
 if(["model_invalid_stream","model_invalid_response","model_provider_invalid_json","model_stream_error"].includes(code||""))return {zh:"模型返回的数据格式异常，暂时无法读取完整分析。",en:"The model returned a malformed response, so a complete analysis could not be read."};
 if(code==="model_quota_storage_unavailable")return {zh:"模型使用额度服务暂不可用，请稍后重试。",en:"The model allowance service is temporarily unavailable. Please retry later."};
 return {zh:"模型服务尚未返回可用的完整分析。",en:"The model service has not returned a usable complete analysis."};
}
