---
title: 'pnpm dependency verification rejects shared node_modules in temporary hook test repos'
severity: 'minor'
issue: 'samaluk/flip-x#811'
---

## Expected Behavior

A disposable hook fixture can reuse the installed formatter without a separate dependency installation.

## Current Behavior

With pnpm 12.4.2, copying package.json, pnpm-lock.yaml, and pnpm-workspace.yaml and symlinking the installed node_modules into another repository causes pnpm exec oxfmt to fail with ERR_PNPM_VERIFY_DEPS_BEFORE_RUN: The workspace structure has changed since last install. The original checkout passes after pnpm install --frozen-lockfile.

## Possible Solution

For the disposable fixture only, set verifyDepsBeforeRun: false in its copied pnpm-workspace.yaml. Keep verifyDepsBeforeRun: error in the actual repository. Alternatively, install dependencies independently in the fixture.

## Minimal Reproducible Example

1. Create a temporary Git repository.
2. Copy package.json, pnpm-lock.yaml, and pnpm-workspace.yaml from an installed checkout.
3. Symlink its node_modules into the temporary repository.
4. Run pnpm exec oxfmt against a fixture file; dependency verification rejects the relocated workspace.

## Context

Observed with pnpm 12.4.2 and hk 2.0.1 on macOS during the hk v2 migration. Disabling dependency verification only in the disposable fixture allowed real hk check, fix, fix --stage, and pre-commit formatting/staging assertions to pass. This is a test-harness limitation of sharing node_modules, not an hk migration failure.
