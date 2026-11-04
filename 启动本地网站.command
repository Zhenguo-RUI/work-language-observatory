#!/bin/zsh
set -e
cd "${0:A:h}"
if ! command -v node >/dev/null 2>&1; then
  print "请先安装 Node.js 22.13 或更新版本。"
  read "?按回车退出"
  exit 1
fi
if [[ ! -d node_modules ]]; then
  npm ci
fi
npm run build
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_sloppy_hellcat.sql
print "请打开下方显示的 Local 地址。停止网站：按 Ctrl+C。"
npm run dev -- --port 5185
