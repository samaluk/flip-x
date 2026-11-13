#!/usr/bin/env bash

set -euo pipefail

pnpm confect:codegen

if [[ -n "$(git status --porcelain)" ]]; then
  git status --short
  echo "::error::Confect generated files are stale. Run pnpm confect:codegen and commit the changes."
  exit 1
fi
