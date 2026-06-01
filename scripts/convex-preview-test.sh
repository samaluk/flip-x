#!/usr/bin/env bash

set -euo pipefail

if [[ $# -lt 1 ]]; then
  printf 'Usage: %s <command> [args...]\n' "$0" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

use_preview_path() {
  [[ "${CONVEX_TEST_USE_PREVIEW:-}" == "1" ]] ||
    [[ "${CI:-}" == "true" ]] ||
    [[ "${CI:-}" == "1" ]] ||
    [[ -n "${GITHUB_ACTIONS:-}" ]]
}

slugify() {
  local value
  value="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
  value="${value//[^a-z0-9-]/-}"
  value="$(printf '%s' "$value" | tr -s '-')"
  value="${value#-}"
  value="${value%-}"

  if [[ -z "$value" ]]; then
    return 1
  fi

  printf '%.48s' "$value"
}

resolve_preview_name() {
  if [[ -n "${PREVIEW_DEPLOYMENT_NAME:-}" ]]; then
    slugify "$PREVIEW_DEPLOYMENT_NAME"
    return
  fi

  if [[ -n "${GITHUB_PR_NUMBER:-}" ]]; then
    printf 'pr-%s' "$GITHUB_PR_NUMBER"
    return
  fi

  local user_name branch_name
  user_name="${USER:-${LOGNAME:-}}"
  if [[ -z "$user_name" ]]; then
    user_name="$(id -un)"
  fi

  branch_name="$(git rev-parse --abbrev-ref HEAD)"
  if [[ "$branch_name" == "HEAD" ]]; then
    printf 'PREVIEW_DEPLOYMENT_NAME is required when running tests from a detached HEAD.\n' >&2
    exit 1
  fi

  printf 'local-%s-%s' "$(slugify "$user_name")" "$(slugify "$branch_name")"
}

run_local_path() {
  printf 'Using local Convex backend (convex dev --once). For cloud preview instead, set CONVEX_TEST_USE_PREVIEW=1.\n'

  pnpm exec convex dev --once --typecheck try

  if [[ ! -f "$ROOT/.env.local" ]]; then
    printf 'Expected %s after convex dev --once. Run: npx convex deployment create local --select\n' "$ROOT/.env.local" >&2
    exit 1
  fi

  local url
  url="$(node "$ROOT/scripts/read-env-value-from-file.mjs" "$ROOT/.env.local" NEXT_PUBLIC_CONVEX_URL)" || true

  if [[ -z "${url:-}" ]]; then
    printf 'Could not read NEXT_PUBLIC_CONVEX_URL from .env.local. Run: npx convex deployment create local --select\n' >&2
    exit 1
  fi

  export NEXT_PUBLIC_CONVEX_URL="$url"
  printf 'Using NEXT_PUBLIC_CONVEX_URL=%s\n' "$NEXT_PUBLIC_CONVEX_URL"

  pnpm exec node "$ROOT/scripts/clear-convex-app-data.mjs"
}

sync_preview_posthog_env() {
  local preview_name="$1"
  local deployment_ref="preview/${preview_name}"
  local project_token="${POSTHOG_PROJECT_TOKEN:-phc_preview_deploy_placeholder}"
  local flags_polling_interval="${POSTHOG_FLAGS_POLLING_INTERVAL_SECONDS:-300}"

  # Patch an existing preview before deploy. New previews inherit project defaults
  # (set once via `npx convex env default set … --type preview` in the dashboard or CLI).
  pnpm exec convex env set POSTHOG_PROJECT_TOKEN "$project_token" \
    --deployment "$deployment_ref" --force 2>/dev/null || true

  pnpm exec convex env set POSTHOG_FLAGS_POLLING_INTERVAL_SECONDS "$flags_polling_interval" \
    --deployment "$deployment_ref" --force 2>/dev/null || true

  if [[ -n "${POSTHOG_HOST:-}" ]]; then
    pnpm exec convex env set POSTHOG_HOST "$POSTHOG_HOST" \
      --deployment "$deployment_ref" --force 2>/dev/null || true
  fi
}

run_preview_path() {
  local preview_name url_file

  preview_name="$(resolve_preview_name)"
  url_file="$(mktemp)"

  cleanup() {
    rm -f "${url_file:-}"
  }

  trap cleanup EXIT

  printf 'Using Convex preview deployment: %s\n' "$preview_name"

  if [[ -n "${GITHUB_ACTIONS:-}" && -n "${CONVEX_TEAM_ACCESS_TOKEN:-}" ]]; then
    PREVIEW_DEPLOYMENT_NAME="$preview_name" node "$ROOT/scripts/delete-convex-preview.mjs"
  fi

  sync_preview_posthog_env "$preview_name"

  pnpm exec convex deploy \
    --preview-create "$preview_name" \
    --typecheck try \
    --cmd "node \"$ROOT/scripts/write-convex-url.mjs\" \"$url_file\"" \
    --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL

  export NEXT_PUBLIC_CONVEX_URL="$(<"$url_file")"
  printf 'Using NEXT_PUBLIC_CONVEX_URL=%s\n' "$NEXT_PUBLIC_CONVEX_URL"

  if [[ -n "${NEXT_PUBLIC_CONVEX_SITE_URL:-}" ]]; then
    printf 'Ignoring NEXT_PUBLIC_CONVEX_SITE_URL for preview-backed tests.\n'
  fi

  cleanup
  trap - EXIT
}

if use_preview_path; then
  run_preview_path
else
  run_local_path
fi

exec "$@"
