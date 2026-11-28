---
title: 'Pre-commit Fallow audit requires pre-generated coverage in fresh worktrees'
severity: 'minor'
issue: 'samaluk/flip-x#1174'
---

## Expected Behavior

A fresh worktree has a documented or automatic path to satisfy the commit hook's coverage requirement.

## Current Behavior

The staged Fallow audit in `hk.pkl` always reads `coverage/coverage-final.json`. In a fresh worktree the hook rejects the commit with a missing-file error, even when the other checks pass.

## Possible Solution

Have the hook report the exact coverage-generation command when the file is absent, or document `pnpm test:coverage` as a prerequisite for the first commit in each worktree. Keep the audit and its coverage input intact.

## Minimal Reproducible Example

Install dependencies in a new worktree with the repository hooks installed. Stage a lint config change and run `git commit` before running `pnpm test:coverage`.

## Context

The first attempt to commit the Landmines migration on #1173 failed. The same commit passed after `pnpm test:coverage` finished.
