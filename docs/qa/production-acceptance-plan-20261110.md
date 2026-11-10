# Production acceptance driver — planned scope

Status: prepared, not yet run against production. No paid calls have been made by this script during preparation.

- `node scripts/verify-production-release.mjs`: GET-only against `https://work-language-observatory.org`. Records elapsed HTTP time, safe response headers, sample/unknown-page text, release image hash and exact public-research equality with this release baseline. It does not measure browser paint or mobile visibility.
- `node scripts/verify-production-release.mjs --live`: first performs the GET checks. If they pass, submits the user-provided four-duty telephone-sales JD and a project-written seven-duty quality-engineering JD. Each analysis uses the actual client implementation, its single bounded reconnect and a 310-second deadline. There is no outer retry loop. Provider repairs are controlled by the production server, so client request counts are not presented as billed provider-call counts.
- `node scripts/verify-production-release.mjs --fault`: interrupts real production GET response bodies locally inside the Node client. It tests one reconnect, a stable request identifier/body and the actual Chinese error helper. It performs no paid analysis request.
- `node scripts/verify-production-release.mjs --self-check`: validates the fixtures and compiles the current client modules without any network request. Passed during preparation.

Evidence is incrementally saved to `docs/qa/second-deploy-20261110-http-evidence.json`; complete synthetic analysis results stay in `.sites-runtime/production-acceptance/`.

The seven-duty fixture covers reading test specifications, executing tests, retesting failures, coordinating with hardware engineers, summarizing results in Excel, drafting an evidence-linked report and revising/archiving it. Its text is embedded in the script and contains no real company, person or private corpus material.

## Limits of the fault check

A passing `fault.passed` is only a production-HTTP-plus-local-client fault-injection result. It does not prove actual browser offline/recovery behavior, form-input retention, localStorage persistence or the final visible error panel. Those need separate browser observation. Do not mark the full seventh production-acceptance requirement as passed using this script alone.
