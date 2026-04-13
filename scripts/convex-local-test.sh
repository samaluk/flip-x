#!/usr/bin/env bash

set -euo pipefail

export IS_TEST=1

rm -rf .convex/local

log_file="$(mktemp)"
convex_pid=""
tmp_home="$(mktemp -d)"
env_backup="$(mktemp)"
had_env_local="false"

if [[ -f .env.local ]]; then
  cp .env.local "$env_backup"
  had_env_local="true"
fi

if [[ "$had_env_local" == "true" ]]; then
  cp "$env_backup" .env.local
fi
printf '\nIS_TEST=1\n' >>.env.local

cleanup() {
  if [[ -n "$convex_pid" ]] && kill -0 "$convex_pid" 2>/dev/null; then
    kill "$convex_pid" 2>/dev/null || true
    wait "$convex_pid" 2>/dev/null || true
  fi

  if [[ "$had_env_local" == "true" ]]; then
    cp "$env_backup" .env.local
  else
    rm -f .env.local
  fi

  rm -f "$log_file"
  rm -f "$env_backup"
  rm -rf "$tmp_home"
}

trap cleanup EXIT

HOME="$tmp_home" CONVEX_DEPLOYMENT= npx convex dev --local --typecheck disable --tail-logs disable >"$log_file" 2>&1 &
convex_pid="$!"

ready="false"
for _ in $(seq 1 60); do
  if rg -q "Convex functions ready!" "$log_file"; then
    ready="true"
    break
  fi
  sleep 2
done

if [[ "$ready" != "true" ]]; then
  cat "$log_file"
  exit 1
fi

pnpm vitest run --config vitest.convex.config.ts
