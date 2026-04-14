#!/usr/bin/env bash
# Run Playwright against a local Convex backend (`npx convex dev --local`).
#
# Starts Convex in the background, waits until functions are ready, sets
# NEXT_PUBLIC_CONVEX_URL (and optional site URL) for the Next.js dev server
# that Playwright starts, then runs the E2E suite.
set -euo pipefail

rm -rf .convex/local

log_file="$(mktemp)"
convex_pid=""
tmp_home="$(mktemp -d)"

cleanup() {
  if [[ -n "$convex_pid" ]] && kill -0 "$convex_pid" 2>/dev/null; then
    kill "$convex_pid" 2>/dev/null || true
    wait "$convex_pid" 2>/dev/null || true
  fi
  rm -f "$log_file"
  rm -rf "$tmp_home"
}

trap cleanup EXIT

echo "Starting local Convex (npx convex dev --local)..."
HOME="$tmp_home" CONVEX_DEPLOYMENT= npx convex dev --local --typecheck try --tail-logs disable >"$log_file" 2>&1 &
convex_pid="$!"

ready="false"
for _ in $(seq 1 60); do
  if grep -q "Convex functions ready!" "$log_file" 2>/dev/null; then
    ready="true"
    break
  fi
  sleep 2
done

if [[ "$ready" != "true" ]]; then
  echo "Local Convex did not become ready in time. Log:" >&2
  cat "$log_file" >&2
  exit 1
fi

# Defaults match Convex local deployment; override with CONVEX_LOCAL_URL / CONVEX_LOCAL_SITE_URL if needed.
export NEXT_PUBLIC_CONVEX_URL="${CONVEX_LOCAL_URL:-http://127.0.0.1:3210}"
export NEXT_PUBLIC_CONVEX_SITE_URL="${CONVEX_LOCAL_SITE_URL:-http://127.0.0.1:3211}"

echo "Using NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL}"
echo "Using NEXT_PUBLIC_CONVEX_SITE_URL=${NEXT_PUBLIC_CONVEX_SITE_URL}"
exec pnpm test:e2e
