# DeepSeek configuration / 接口配置

The Node.js server calls the fixed official endpoint `https://api.deepseek.com/chat/completions`. The API key is never sent to browser code.

Local `.env.local`, or encrypted production server variables:

```dotenv
DEEPSEEK_API_KEY=
ANALYSIS_PROVIDER=deepseek
ANALYSIS_MODEL=deepseek-flash
```

Production also requires `DATABASE_URL` for durable quota counters. `.env.example` lists authentication settings separately. Do not commit `.env.local` or copy private runtime data into the repository.

Analysis enables thinking with `reasoning_effort=high`. Full translation disables thinking and checks source segments, the role title, numbers and contact strings. DeepSeek JSON mode constrains syntax rather than our complete schema, so decoded results still undergo local checks. An observed analysis contract failure may trigger one bounded repair. Quota, authentication and transport failures do not trigger repeated paid requests.

`npm run test:live` sends one synthetic JD and may incur API charges. Ordinary checks use synthetic fixtures and mocked responses without paid requests. Connectivity and schema conformance do not establish sociological accuracy.

[Official API format](https://api-docs.deepseek.com/) · [JSON output](https://api-docs.deepseek.com/guides/json_mode/)
