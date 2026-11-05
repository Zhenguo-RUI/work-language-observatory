const knownModelFailures=new Set([
 "model_contract_invalid_after_one_repair","model_incomplete_output",
 "model_empty_or_refused","model_not_connected",
]);

/** Never persist arbitrary exception messages or provider response bodies. */
export function safeModelFailure(error:unknown):string{
 if(!(error instanceof Error))return "model_unavailable";
 if(/^model_http_[45]\d{2}$/.test(error.message))return error.message;
 if(knownModelFailures.has(error.message))return error.message;
 if(error.message==="analysis_deadline"||error.name==="TimeoutError"||error.name==="AbortError")return "model_timeout";
 if(error instanceof SyntaxError)return "model_provider_invalid_json";
 if(error instanceof TypeError&&/^(?:fetch failed|Failed to fetch|NetworkError)/i.test(error.message))return "model_network_error";
 return "model_unavailable";
}
