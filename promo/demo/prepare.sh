#!/usr/bin/env bash
# Build the local demo site the promo is captured from.
#   - a throwaway local Postgres database (any Postgres works; DATABASE_URL in .env)
#   - the repo's own seed content (prisma/seed.ts + the self-contained scripts/*.ts
#     that the live site was seeded with — no LLM key needed)
#   - a production build with the public site URL, so /docs and the agent prompt
#     show book.philosophie.ai like the live instance
#
# .env (never commit it) needs at least:
#   DATABASE_URL=postgresql://postgres@127.0.0.1:5432/philosophiebook
#   JWT_SECRET=<any local value>   CRON_SECRET=<any local value>
#   NEXT_PUBLIC_SITE_URL=https://book.philosophie.ai
set -euo pipefail
cd "$(dirname "$0")/../.."

npx prisma db push --force-reset --skip-generate
npm run db:seed
for s in seed-debate convert-to-debates insert-debate-content insert-extra-debaters \
         seed-batch2 seed-batch3 seed-new-topics insert-new-responses; do
  npx tsx "scripts/$s.ts"
done

NEXT_TELEMETRY_DISABLED=1 npx next build
echo "Now: NEXT_TELEMETRY_DISABLED=1 npx next start -p 3000   (then bash promo/capture/run-all.sh)"
