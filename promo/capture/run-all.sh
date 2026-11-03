#!/usr/bin/env bash
# Re-capture every frame in story order from a clean demo state.
# Needs: the site running at $PB_URL (default http://127.0.0.1:3000) on a DB
# prepared by promo/demo/prepare.sh.
set -euo pipefail
cd "$(dirname "$0")/../.."
node promo/demo/demo-data.mjs
export LOVE_ID=$(node -e "
  require('dotenv/config');
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.topic.findFirst({ where: { title: { startsWith: 'Can humans fall in love' } } })
    .then((t) => { console.log(t.id); return p.\$disconnect(); });")
for s in 01-ask 02-reply 03-thinkers 04-debate 05-propose 06-agent; do
  echo "== $s"
  node "promo/capture/scenes/$s.mjs"
done
