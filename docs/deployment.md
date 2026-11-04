# Deployment / 部署

## Vercel

1. Import `Zhenguo-RUI/work-language-observatory`. Use the repository root, Next.js, Node.js 22, build `npm run build`, install `npm ci --include=dev`.
2. Add the Neon integration, choose its Free plan, accept its service terms and connect the database to this project. The integration injects `DATABASE_URL`. Tables and indexes initialize transactionally on first access; no private corpus is seeded.
3. Add encrypted server-side environment variables:
   - `ANALYSIS_PROVIDER=deepseek`
   - `ANALYSIS_MODEL=deepseek-flash`
   - `DEEPSEEK_API_KEY` from your own API account
   - `MODEL_DAILY_CALL_LIMIT=100`: shared provider requests per UTC day, including repairs and translations
   - `AUTH_SECRET`: a securely generated value of at least 32 characters
   - `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`: optional GitHub OAuth application credentials for personal histories
   - `OPERATOR_ACCESS_KEY`: optional separate random owner-only key, at least 32 characters; never a personal account password
   - `OPERATOR_GITHUB_ID`: the operator's stable numeric GitHub user ID
4. Set the GitHub OAuth callback to `https://YOUR-PRODUCTION-HOST/api/auth/callback/github`. Optional `AUTH_URL` must match that host; update it when switching to a custom domain. Never share OAuth client secrets or model keys in the repository.
5. Deploy. If the public production URL requires Vercel login, disable Vercel Authentication for production in project Deployment Protection. The application still protects saved records and operations via Auth.js.
6. Check anonymous analysis, the English title/full-text translation, private record ownership and owner-only operator access. A successful page load alone does not verify model or database functionality.

## Data and permissions

The public tool and aggregate findings need no visitor account. Anonymous readings are ephemeral and not written into the site's history. Signed-in submissions are saved and may be reviewed by the operator; other visitors cannot retrieve them. A record's `published` status does not change this ownership boundary.

Database transactions protect revision histories and optimistic review updates. Durable database counters enforce anonymous hourly and shared daily model-call limits. The database is required for paid public model calls; production does not fall back to process-local counters or ephemeral SQLite.

GitHub identities come only from verified Auth.js sessions. Caller-supplied host identity headers are ignored. The operator is authorized by a numeric provider ID, not by a display name or an unverified email. An owner-key login uses the same Auth.js encrypted HttpOnly sessions and CSRF protection, with a distinct internal identity. The key is checked on the server and its credential version is checked on each session refresh; rotation invalidates prior owner-key sessions. It does not impersonate a GitHub identity. When OAuth is absent, public-user cloud histories are disabled; the operator can still use the owner-key workspace. Without either authentication method, the public reader remains available while storage and operations actions require login.

## Custom domain

Add the purchased domain in Vercel Settings → Domains. Copy the exact DNS records shown there into the domain's DNS provider; do not assume a fixed historical IP address. Check Vercel's domain status and HTTPS after propagation. A domain purchase is separate from hosting and API billing.

## Releases

Normal updates are source commits followed by a Vercel rebuild. Changing environment variables also requires a new deployment. Keep model keys in Vercel's server environment. Retain database backups and test major prompt or schema changes before promoting them. Never restore the former Cloudflare-only archive over this version.

If a deployment was uploaded directly before GitHub synchronization, label that state explicitly: automatic GitHub deployment is not complete until the same source is committed and the repository is connected.
