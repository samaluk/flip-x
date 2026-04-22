#!/usr/bin/env bash

set -euo pipefail

if [[ $# -lt 1 ]]; then
  printf 'Usage: %s <command> [args...]\n' "$0" >&2
  exit 1
fi

if [[ -z "${CONVEX_DEPLOY_KEY:-}" ]]; then
  printf 'CONVEX_DEPLOY_KEY is required for preview-backed tests.\n' >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

slugify() {
  local value
  value="${1,,}"
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

preview_name="$(resolve_preview_name)"
url_file="$(mktemp)"

cleanup() {
  rm -f "$url_file"
}

trap cleanup EXIT

printf 'Using Convex preview deployment: %s\n' "$preview_name"

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

exec "$@"
