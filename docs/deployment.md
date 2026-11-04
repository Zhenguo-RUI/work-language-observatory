# Deployment and portability / 部署与迁移

## Current implementation

The application uses Vinext and the Cloudflare Vite plugin, with a Cloudflare Worker entry point and D1 SQL storage. `.openai/hosting.json` declares binding names only; this export contains no previous hosting project identifier or deployed resource IDs. Local builds use a placeholder database ID for the local emulator.

`npm run build` prepares `dist/`. `npm start` serves that build through **local** Wrangler; it does not deploy a production site.

The authentication adapter reads `oai-authenticated-user-*` headers injected by the original host's gateway. This is safe only when a trusted gateway removes caller-supplied versions of those headers and injects verified identity. The Vite mock login strips spoofed headers during local development. It provides no identity verification for an independently deployed production server.

**Do not expose a standalone deployment with this adapter unchanged.** A configured operator email is an authorization check after authentication; it is not a replacement for authentication.

## Vercel migration checklist

The target deployment requested for this project is GitHub → Vercel → a custom domain. Uploading this source is the first step. A functioning migration still requires:

1. Replace Vinext/Worker entry and `cloudflare:workers` bindings with the selected Vercel-compatible runtime.
2. Adapt D1 SQL operations, migrations, revision checks and rate counters to the selected persistent database.
3. Replace host headers and host sign-in routes with verified server-side sessions; recheck record ownership and operator authorization.
4. Store model credentials only in the hosting provider's server secret settings. Add a spending limit and recheck anonymous request quotas.
5. Test anonymous analysis, bilingual output, private history, concurrent edits and operator actions on a preview deployment.
6. Connect the custom domain using the DNS records actually supplied by the selected host.

Do not assume the repository can currently be imported into Vercel as an ordinary Next.js application and immediately work. No Vercel deployment, external database or custom-domain setup is included in this export.

## 中文说明

当前是可本地构建的研究原型源码。数据库、登录和运营权限仍依赖原运行环境；迁移到独立网站，需要把这些连接落实并验证。域名只决定访问地址，不会自动补齐数据库、认证或模型服务。

公开仓库仅包含工具和汇总数据。不要为使部署方便而把私有语料、个人文书、真实用户提交或密钥重新放回仓库。生产密钥应通过服务端配置注入，浏览器不能直接持有。
