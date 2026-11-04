/// <reference types="@cloudflare/workers-types" />
declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    OPENAI_API_KEY?: string;
      DEEPSEEK_API_KEY?: string;
      ANALYSIS_PROVIDER?: string;
    ANALYSIS_MODEL?: string;
    OPERATOR_EMAIL?: string;
    CONNECTORS?: import("./lib/connector-contract.mjs").ConnectorBinding;
  }
}
