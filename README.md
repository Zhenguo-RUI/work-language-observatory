# Work Language Observatory · 工作语言观察站

*Observatoire du langage du travail*

A bilingual, AI-assisted research prototype for reading skills, expectations and work arrangements in job advertisements.

一个中英双语的工作语言观察工具：从招聘文本中的能力词出发，解释它在这份岗位里要求完成什么、依赖谁，以及有哪些值得进一步确认的问题。

## What it delivers / 交付

- **A situated reading:** short interpretations anchored to exact source passages, possible alternative readings, concrete work outputs and useful follow-up questions.
- **A sociological reading:** how the text connects individual qualities to tasks, coordination, evaluation and decision rights. Interpretations remain distinguishable from source facts.
- **A review workspace:** stored readings, revisions, feedback and operator review, with access boundaries around individual records.
- **Bilingual access:** Chinese and English analysis, with the original JD retained alongside a separately checked translation of its title and full text.

- **给使用者：** 能力词解释、原文依据、具体产出、社会学分析，以及能改变判断的追问。
- **给研究者：** 保留来源与解释分歧，支持复核和比较；公开页面只提供汇总结果。

## Current status / 当前状态

This is the source export of a working research prototype, **not a completed Vercel migration**. The current runtime uses Vinext, Cloudflare Workers and D1. Stored-user and operator access depend on a trusted hosting authentication gateway. The local development server supplies a mock identity for testing only.

当前源码依赖 Cloudflare Workers / D1 以及原托管环境的认证网关。迁移到 Vercel 还需要替换运行时、数据库连接和认证。**不要将当前认证适配器直接部署到没有可信网关的公网环境。** 具体边界见 [deployment notes](docs/deployment.md)。

The server supports **DeepSeek Chat Completions** (`deepseek-flash`, high thinking for analysis) and OpenAI Responses. Provider choice is server configuration. DeepSeek JSON output is validated against the same local evidence and bilingual contracts; it does not bypass them. With no model configured, the application returns a **labelled rule-assisted draft**. No external expert accuracy score is claimed by this public export. Automatic full JD translation requires a configured model; the synthetic demo has a prepared translation.

未配置模型时，界面会标明规则辅助草稿。源码中的结构检查、模拟调用和合成回归用例不等于独立的人类评测，也不代表模型线上准确率。

## Public data boundary / 公开范围

This repository includes application source, analysis instructions, synthetic checks and aggregate research counts. `data/seeds.json`, `data/corpus.json` and `data/seed-translations.json` are intentionally empty. Private application essays, CVs, user submissions, individual archived JDs, source indexes and credentials are excluded. The built-in demonstration in `lib/public-demo.ts` is synthetic.

`data/research.json` records a historical archive count of 2,000 and an exploratory model-coded pilot of 120 texts / 168 occurrences of “独立”. These are **historical project counts**, not a corpus distributed here, a representative labour-market estimate, or a validated accuracy benchmark. See [data notes](docs/data.md).

## Local development / 本地运行

Requires Node.js 22.13+ and npm. Use a local development environment; the mock login is not production authentication.

```sh
npm ci
npm run build
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_sloppy_hellcat.sql
npm run dev
```

Use the local URL printed by the development server. Both the build and development server use the same local D1 state directory. For server settings, copy `.env.example` to `.dev.vars` and fill values locally. Set `DEEPSEEK_API_KEY`, `ANALYSIS_PROVIDER=deepseek` and `ANALYSIS_MODEL=deepseek-flash` for DeepSeek. Set `ANALYSIS_PROVIDER=openai`, `OPENAI_API_KEY` and an appropriate `ANALYSIS_MODEL` for OpenAI. Never commit `.dev.vars`. `OPERATOR_EMAIL` must match the development identity if you want to exercise operator access; see the development plugin for that identity. Secrets must remain server-side.

## Checks / 检查

```sh
npm run typecheck
npm run test:analysis
npm run test:fidelity
npm run test:translation
node scripts/check-language.mjs
node scripts/check-semantic-regressions.mjs
```

Run `test:analysis` before translation, language and semantic checks: it prepares the isolated test build. Checks cover schema contracts, evidence spans, known modality/numeric boundary errors, language coverage and mocked model responses. They do **not** measure whether an interpretation is sociologically correct, whether a job is good, or whether a system improves applicants' outcomes.

## Read more / 方法与示例

- [Method and review dimensions / 分析与评价方法](docs/methodology.md)
- [Synthetic bilingual example / 合成双语示例](docs/example-reading.md)
- [Data provenance and limits / 数据来源与边界](docs/data.md)
- [Deployment and portability / 部署与迁移](docs/deployment.md)
- [Verification / 验证记录](docs/verification.md)
- [DeepSeek configuration / DeepSeek 接入](docs/deepseek.md)

The analysis instructions live in `lib/analysis-prompt.ts`; validation and model orchestration are separate modules. Editing a prompt alone does not establish a quality improvement: retain examples, compare versions and review failures.

## License / 许可

A project-wide reuse license has not yet been selected. Public visibility alone does not grant a general software license. Existing third-party notices are retained in `vendor/` and `scripts/vite/`; dependency licenses also apply.
