#!/bin/zsh
set -e
cd "${0:A:h}"
if [[ ! -d node_modules ]]; then
  npm ci --include=dev
fi
npm run dev
