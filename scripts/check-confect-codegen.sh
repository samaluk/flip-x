#!/usr/bin/env bash

set -euo pipefail

pnpm confect:codegen

generated_paths=(confect/_generated convex ':(exclude)convex/README.md' ':(exclude)convex/convex.config.ts' ':(exclude)convex/tsconfig.json')

if [[ -n "$(git status --porcelain -- "${generated_paths[@]}")" ]]; then
  git status --short -- "${generated_paths[@]}"
  echo "::error::Confect generated files are stale. Run pnpm confect:codegen and commit the changes."
  exit 1
fi
