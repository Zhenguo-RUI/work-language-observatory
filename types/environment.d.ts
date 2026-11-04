declare namespace NodeJS {
  interface ProcessEnv {
    ANALYSIS_PROVIDER?:string;
    ANALYSIS_MODEL?:string;
    DEEPSEEK_API_KEY?:string;
    OPENAI_API_KEY?:string;
    DATABASE_URL?:string;
    POSTGRES_URL?:string;
    AUTH_GITHUB_ID?:string;
    AUTH_GITHUB_SECRET?:string;
    AUTH_SECRET?:string;
    AUTH_URL?:string;
    OPERATOR_GITHUB_ID?:string;
    OPERATOR_ACCESS_KEY?:string;
    MODEL_DAILY_CALL_LIMIT?:string;
  }
}
