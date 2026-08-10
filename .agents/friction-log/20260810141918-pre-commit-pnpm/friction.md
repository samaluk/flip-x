---
title: 'Pre-commit pnpm reinstall aborts without a TTY'
severity: 'minor'
---

## Expected Behavior

Running `git commit` in a non-interactive agent shell should execute the repository pre-commit checks without requiring terminal input.

## Current Behavior

After pulling a `packageManager` update to pnpm 11.20.0 while `node_modules` was installed by the previous pnpm version, the hook aborts with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`. Re-running the commit with `CI=1` recreates dependencies and succeeds.

## Possible Solution

Make the hook or agent workflow set a safe non-interactive pnpm mode when dependency reconciliation is required, or document the required `CI=1` recovery.

## Minimal Reproducible Example

1. Install dependencies using the prior package-manager version.
2. Pull a commit that updates `packageManager` to pnpm 11.20.0.
3. Stage a file and run `git commit` from a non-interactive shell.

## Context

This interrupted an otherwise one-line GitHub Actions migration and required a second commit attempt plus a full dependency refresh.
