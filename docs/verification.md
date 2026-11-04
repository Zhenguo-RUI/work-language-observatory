# Verification / 验证记录

Verified on 2026-11-04 in a fresh temporary directory with Node.js 22.23.1. Dependencies installed successfully with `npm ci` from the lockfile.

- TypeScript: passed.
- Full client/server build: passed.
- Analysis and provider checks: 45 passed.
- Full translation checks: 19 passed (no private prepared cases included).
- Boundary and cross-field fidelity checks: 63 passed.
- Language checks: 13 passed.
- Known semantic regressions: 12 passed.

These 152 checks exercise finite contracts, synthetic regressions and mocked provider responses. They are not an independent sociological accuracy estimate. A live smoke test, if recorded below, uses one synthetic input and is not a quality benchmark.

## Live DeepSeek smoke test

One synthetic data-analyst JD was sent to `deepseek-flash`: one analysis request and one full-translation request. Both passed their respective local contracts. Total elapsed time was 53.6 seconds. The provider reported 13,018 tokens across the two calls, including thinking tokens. This timing and token count describe this one test only. No private corpus, CV or personal statement was sent.

Browser interaction was not rechecked in this session because the browser tool timed out. Seven local HTTP checks passed: reader response, model-connected anonymous bootstrap, no saved-case exposure, protected operations and archive routes, rejected forged identity headers, public aggregates, and an ephemeral labelled rule preview. No independent production deployment was performed.

A manual read of the live result also flagged wording that can blur “authority not specified in the JD” and “authority not granted”. This is an interpretive review issue that the automatic contract does not fully detect; the smoke test is therefore not a claim that every generated assertion is correct.
