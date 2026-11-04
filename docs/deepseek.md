# DeepSeek configuration / 接口配置

The server uses the official Chat Completions endpoint, a fixed destination at `https://api.deepseek.com/chat/completions`. No browser code receives the configured API key.

Local `.dev.vars` settings:

```dotenv
DEEPSEEK_API_KEY=
ANALYSIS_PROVIDER=deepseek
ANALYSIS_MODEL=deepseek-flash
OPERATOR_EMAIL=
```

Put your own key after the first equals sign. The blank template contains no working credential. The model selector in the operator workspace must remain compatible with the chosen provider.

Analysis enables thinking with `reasoning_effort=high`. Full translation disables thinking and still checks every source segment, the job title, numbers and contact strings. DeepSeek JSON mode guarantees JSON syntax rather than our exact schema; the application therefore runs its schema and evidence checks after decoding, and allows at most one analysis repair for an observed contract failure. Quota/authentication/transport failures do not trigger repeated paid requests.

To invoke the optional live smoke test yourself, run `npm run test:live`. It sends one synthetic input and may incur API charges. Ordinary synthetic checks make no live calls.

[Official API format](https://api-docs.deepseek.com/) · [JSON output](https://api-docs.deepseek.com/guides/json_mode/)

中文：密钥保存在服务端本地配置；迁移上线时需改为托管平台的服务端密钥配置。这个交付文件夹不含你提供的密钥。默认分析用高强度思考，英文全文翻译另行调用。真实连通测试不等于学术解释已经获得独立专家认可。
