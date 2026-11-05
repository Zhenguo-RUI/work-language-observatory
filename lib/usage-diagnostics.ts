const knownModelFailures=new Set([
 "model_contract_invalid_after_one_repair","model_incomplete_output",
 "model_empty_or_refused","model_not_connected",
 "model_empty_response","model_invalid_response","model_invalid_stream","model_stream_error","model_incomplete_stream","model_response_too_large","model_quota_storage_unavailable",
]);

/** Never persist arbitrary exception messages or provider response bodies. */
export function safeModelFailure(error:unknown):string{
 if(!(error instanceof Error))return "model_unavailable";
 if(/^model_http_[45]\d{2}$/.test(error.message))return error.message;
 if(knownModelFailures.has(error.message))return error.message;
 if(error.message==="analysis_deadline"||error.name==="TimeoutError"||error.name==="AbortError")return "model_timeout";
 if(error instanceof SyntaxError)return "model_provider_invalid_json";
 const cause=(error as Error&{cause?:{code?:unknown}}).cause;
 if(typeof cause?.code==="string"&&/^(?:UND_ERR_(?:SOCKET|CONNECT_TIMEOUT|HEADERS_TIMEOUT|BODY_TIMEOUT)|ECONNRESET|ETIMEDOUT|EPIPE)$/.test(cause.code))return "model_network_error";
 if(error instanceof TypeError&&/^(?:fetch failed|Failed to fetch|NetworkError)/i.test(error.message))return "model_network_error";
 return "model_unavailable";
}
