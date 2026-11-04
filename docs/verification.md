# Verification / 验证记录

## Next.js migration — 2026-11-04

Node.js 22.23.1, standard Next.js 16.3.4, Auth.js, Postgres-compatible adapter. The production build and TypeScript checks passed locally.

- Analysis/provider checks: 45.
- Full translation checks: 19.
- Cross-field fidelity checks: 63.
- Language checks: 13.
- Known semantic regressions: 12.
- Database, identity-policy and model-budget checks: 18.
- Actual Next.js HTTP/session/isolation checks: 30.

These 200 finite checks use synthetic cases, mocked providers, PGlite and encrypted synthetic test sessions. HTTP checks cover ownership, spoofed identity headers, invalid sessions, concurrent review conflicts, private exports, rate limits and operator separation. They do not establish live GitHub OAuth or Neon connectivity, independent semantic accuracy or improved applicant outcomes.

## Earlier local live check

The separate retained Cloudflare local prototype completed a real DeepSeek analysis and full translation of a synthetic JD, followed by private record readback and operator revision synchronization. That result verifies its local workflow only; it does not verify this Next.js deployment or constitute a social-science quality benchmark.

Browser automation was unavailable in this migration session. HTTP checks and a production build were used; visual interaction was not independently rechecked. A production verification record should be added only after the real deployed endpoints have been exercised.

## Public deployment smoke test

The Vercel public deployment at `https://work-language-observatory.vercel.app` completed 12 anonymous HTTP checks, including real Neon initialization, one live DeepSeek analysis, source-grounded quotes and complete role-title/JD translation, with no private record or comparator exposure. The entire check sequence took 82.9 seconds. The input was synthetic; this is a connectivity and functionality test, not a human semantic accuracy estimate. That run preceded the optional owner-key login update; its deployment still needs its own authentication verification.
