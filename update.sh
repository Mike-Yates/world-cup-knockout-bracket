#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

: "${YATESCUP_WEB_ROOT:?Set YATESCUP_WEB_ROOT in .env or the environment}"

git pull --ff-only
npm install
npm run update:results
npm run build
sudo rsync -az --delete dist/ "${YATESCUP_WEB_ROOT%/}/"
sudo nginx -t
sudo systemctl daemon-reload
sudo systemctl reload nginx
