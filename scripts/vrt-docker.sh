#!/usr/bin/env bash
# Run Vitest browser VRT in Playwright's Linux image so screenshots match CI and other machines.
# Usage: scripts/vrt-docker.sh          # compare against baselines
#        scripts/vrt-docker.sh --update # refresh baselines after intentional UI changes
#
# On GitHub Actions (ubuntu-latest), set SKIP_VRT_DOCKER_INSTALL=1 so the job reuses the
# runner's Linux node_modules instead of pnpm install inside Docker — saves CI minutes.
# Do not use SKIP on macOS/Windows: host node_modules targets the wrong OS/arch for the
# container (e.g. rolldown native bindings). The anonymous node_modules volume + inner
# pnpm install forces a Linux install that matches the image — use that locally.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Keep in sync with @playwright/test / Docker tag (https://playwright.dev/docs/docker)
IMAGE="mcr.microsoft.com/playwright:v1.61.0-noble"

EXTRA=()
if [[ "${1:-}" == "--update" ]]; then
  EXTRA+=(--update)
fi

VRT_CMD=(./node_modules/.bin/vitest run --project browser)
if [[ ${#EXTRA[@]} -gt 0 ]]; then
  VRT_CMD+=("${EXTRA[@]}")
fi

if [[ "${SKIP_VRT_DOCKER_INSTALL:-}" == "1" ]]; then
  docker run --rm \
    -v "$ROOT:/app" \
    -w /app \
    -e CI=true \
    -e PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    "$IMAGE" \
    bash -lc "$(printf '%q ' "${VRT_CMD[@]}")"
else
  docker run --rm \
    -v "$ROOT:/app" \
    -v /app/node_modules \
    -w /app \
    -e CI=true \
    "$IMAGE" \
    bash -lc "corepack enable && pnpm install --frozen-lockfile && pnpm exec playwright install chromium && $(printf '%q ' "${VRT_CMD[@]}")"
fi
