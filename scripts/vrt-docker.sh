#!/usr/bin/env bash
# Run Vitest browser VRT in Playwright's Linux image so screenshots match CI and other machines.
# Usage: scripts/vrt-docker.sh          # compare against baselines
#        scripts/vrt-docker.sh --update # refresh baselines after intentional UI changes
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Keep in sync with @playwright/test / Docker tag (https://playwright.dev/docs/docker)
IMAGE="mcr.microsoft.com/playwright:v1.59.0-noble"

EXTRA=()
if [[ "${1:-}" == "--update" ]]; then
  EXTRA+=(--update)
fi

docker run --rm \
  -v "$ROOT:/app" \
  -v /app/node_modules \
  -w /app \
  -e CI=true \
  "$IMAGE" \
  bash -lc "corepack enable && pnpm install --frozen-lockfile && pnpm exec playwright install chromium && pnpm exec vitest run --project browser ${EXTRA[*]:-}"
