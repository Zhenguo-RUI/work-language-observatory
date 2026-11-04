# Work Language Observatory · 工作语言观察站

*Observatoire du langage du travail*

A bilingual research tool for interpreting competence labels in job advertisements: what a term asks someone to do, how that work is coordinated and evaluated, and which questions would clarify the arrangement.

一个中英双语的工作语言观察工具：把“独立”“沟通”“抗压”等能力词放回具体任务、协作和评价关系中，提供有原文依据、可复核的解释。

## What it delivers / 交付

- **Situated readings:** concise explanations, exact evidence, concrete work outputs and useful follow-up questions.
- **Sociological interpretation:** connections between individual qualities, coordination, evaluation and decision rights, with facts and hypotheses distinguished.
- **Review workspace:** private saved readings, versioned revisions, feedback and operator review.
- **Bilingual access:** Chinese and English readings; separately validated translations of the job title and complete JD.

## Runtime / 运行方式

This version uses **Next.js on Node.js 22, Neon Postgres and Auth.js with optional GitHub OAuth and an owner-only operator key**. It can be deployed to Vercel from this repository. It replaces the former Cloudflare Workers/D1 adapter; trusted hosting identity headers and mock production logins are no longer used.

服务端支持 DeepSeek Chat Completions 和 OpenAI Responses。未配置模型时，界面明确标注规则辅助草稿。模型输出通过结构、证据和双语检查，但这些检查不构成独立专家准确率。

## Local development / 本地运行

```sh
npm ci --include=dev
cp .env.example .env.local
npm run dev
```

Open `http://127.0.0.1:5185`. Node.js 22 is required. With no database URL, development uses an on-disk PGlite database under ignored `.runtime/`; production requires Neon Postgres. Local mode has **no mock external identity**. Saving personal histories uses configured GitHub OAuth. The owner can alternatively access operations with a separate securely generated operator key.

Fill model keys only in `.env.local`. Never commit credentials. For a build, run `npm run build`; `npm start` serves the build locally.

## Deployment / 上线

Connect the repository to a Vercel project, choose Node.js 22 and install with `npm ci --include=dev`. Add a Neon Free database through the Vercel integration. Configure server-only variables using `.env.example`. GitHub OAuth uses callback `https://YOUR-DOMAIN/api/auth/callback/github`; the GitHub operator is selected by a stable numeric GitHub ID. For owner-only operations without OAuth setup, use a separately generated random `OPERATOR_ACCESS_KEY` of at least 32 characters; never reuse a personal account password. Rotating that key invalidates its earlier sessions. See [deployment instructions](docs/deployment.md).

The public tool works without visitor login. Saving personal histories and operator review require verified sessions. Public-user history stays disabled until GitHub OAuth is configured; owner-key access does not enable public accounts. Public submissions are temporary by default and not saved into the site's history. Deep model calls require a durable database for usage limits. The default anonymous limit is 12 requests per hour per fingerprint, with an additional shared daily model-call budget. Limits count attempts; repairs can add provider requests. Configure provider-level spending limits separately.

公开网站只展示工具与研究汇总。个体记录不会因为标为 published 而对其他访客开放；该状态只表示内部复核状态。

## Public data boundary / 公开范围

`data/seeds.json`, `data/corpus.json` and `data/seed-translations.json` are empty. Personal essays, CVs, user submissions, individual archived JDs, source indexes and credentials are excluded. The built-in demo in `lib/public-demo.ts` is synthetic.

`data/research.json` contains historical project counts: an archive of 2,000 records and an exploratory model-coded pilot of 120 texts / 168 occurrences of “独立”. These are historical counts, not a corpus distributed here, a representative market estimate or an accuracy benchmark. See [data notes](docs/data.md).

## Checks / 检查

```sh
npm run typecheck
npm run test:analysis
npm run test:fidelity
npm run test:translation
node scripts/check-language.mjs
node scripts/check-semantic-regressions.mjs
npm run test:database
```

Run the analysis checks first: they prepare an isolated test build. `scripts/check-vercel-http.mjs` additionally verifies HTTP/session/ownership behavior against an explicitly configured loopback server and synthetic test identities. `npm run test:live` is optional and sends a synthetic JD to the configured paid API. Ordinary checks do not make paid model calls.

## Method and documentation / 方法与文档

- [Analysis and review dimensions](docs/methodology.md)
- [Synthetic bilingual example](docs/example-reading.md)
- [Data provenance and limits](docs/data.md)
- [Deployment and authentication](docs/deployment.md)
- [Verification record](docs/verification.md)
- [DeepSeek configuration](docs/deepseek.md)

The analysis instructions live in `lib/analysis-prompt.ts`; validation, fidelity checks and provider orchestration remain separate modules. Prompt edits alone do not establish a quality improvement.

## License / 许可

A project-wide reuse license has not yet been selected. Public visibility alone does not grant a general software license. Third-party notices are retained in `vendor/`; dependency licenses also apply.
