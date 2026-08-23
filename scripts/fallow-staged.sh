#!/usr/bin/env bash
# Staged Fallow audit for the hk pre-commit hook (`pnpm fallow:staged`).
#
# When the staged diff adds lines, pipe `git diff --cached` into
# `fallow audit --diff-file -` so findings are scoped line-level to staged
# hunks while `--base HEAD` still drives file discovery.
#
# Diff shapes with no added lines (pure renames, pure deletions, and
# binary-only changes) produce an empty diff-filter index, which fallow
# warns about and then passes trivially. That would silently skip gating
# for those commits, so they fall back to plain file-discovery scoping:
# with `--gate all`, every error finding in a staged-changed file blocks,
# matching the strict zero-debt posture.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

if git diff --cached --numstat | awk '($1 != "-" && $1 + 0 > 0) { found = 1 } END { exit !found }'; then
  git diff --cached | fallow audit --diff-file - --base HEAD --gate all --type-aware
else
  echo "fallow:staged: staged diff adds no lines; using file-scoped audit" >&2
  fallow audit --base HEAD --gate all --type-aware
fi
