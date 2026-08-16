---
title: 'format:check fails on unchanged master files'
severity: 'minor'
---

### Expected Behavior

The committed default branch satisfies `pnpm format:check`.

### Current Behavior

The check reports 14 tracked files as unformatted, and `pnpm format` creates unrelated churn.

### Possible Solution

Format the affected files in a dedicated cleanup PR.

### Minimal Reproducible Example

Check out current `master` and run `pnpm format:check`.

### Context

Found while verifying the Fallow fleet-convergence change; unrelated rewrites had to be restored.
