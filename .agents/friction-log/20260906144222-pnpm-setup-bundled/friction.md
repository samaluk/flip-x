---
title: 'pnpm/setup bundled install leaves verifyDepsBeforeRun state stale'
severity: 'minor'
target: 'pnpm/setup'
---

## Friction

The pnpm/setup v2 action ran its bundled `pnpm install --no-runtime` successfully, but subsequent `pnpm run`/`pnpm exec` commands intermittently failed with `ERR_PNPM_VERIFY_DEPS_BEFORE_RUN` under `verifyDepsBeforeRun: error`. Replacing the bundled install with an explicit `pnpm install --frozen-lockfile` in the shared CI setup action refreshed the workspace validation state and made the build, visual regression, and exec checks pass.

## Context

Observed on pnpm/setup v2.1.0 with pnpm 12.3.1 in GitHub Actions.
