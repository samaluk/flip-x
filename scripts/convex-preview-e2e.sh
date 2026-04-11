#!/usr/bin/env bash
# Deploy Convex functions to a preview deployment, then run Playwright.
#
# Convex runs `npx convex deploy --cmd` BEFORE pushing functions to preview
# (the --cmd hook is for frontend builds that only need the deployment URL).
# E2E needs the backend live first, so we deploy without --cmd, parse the URL
# from CLI output, then run tests.
set -euo pipefail

RAW_NAME="${CONVEX_PREVIEW_NAME:-local-e2e}"
PREVIEW_NAME="${RAW_NAME//\//-}"
PREVIEW_NAME="${PREVIEW_NAME:-local-e2e}"

LOG=$(mktemp)
trap 'rm -f "$LOG"' EXIT

echo "Deploying Convex preview \"${PREVIEW_NAME}\" (functions only, no --cmd)..."
npx convex deploy --preview-create "$PREVIEW_NAME" --typecheck try 2>&1 | tee "$LOG"

# Strip ANSI (chalk) so we can grep the URL (perl works on macOS + Linux CI)
STRIPPED=$(perl -pe 's/\e\[[0-9;]*m//g' <"$LOG")
URL=$(echo "$STRIPPED" | grep 'Deployed Convex functions to' | grep -oE 'https://[a-z0-9-]+\.convex\.cloud' | tail -1)

if [[ -z "${URL}" ]]; then
  echo "Could not parse preview deployment URL from \`npx convex deploy\` output." >&2
  echo "Look for a line like: Deployed Convex functions to https://....convex.cloud" >&2
  exit 1
fi

echo "Using NEXT_PUBLIC_CONVEX_URL=${URL}"
export NEXT_PUBLIC_CONVEX_URL="$URL"
exec pnpm test:e2e
