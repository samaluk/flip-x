---
title: 'pnpm/setup v2 unified action differs from pnpm/action-setup'
severity: 'minor'
target: 'pnpm/setup'
---

pnpm/setup@v2.0.2 (NOT the legacy pnpm/action-setup) is a single action that installs pnpm, the Node runtime (version read from devEngines.runtime in package.json, not engines), and runs pnpm install by default. Adding devEngines.runtime makes 'pnpm install' add a node@runtime:24.19.0 entry to pnpm-lock.yaml. Also, actionlint does not lint composite action.yml files (treats them as workflows and errors on 'runs'/'description').

## Current caveat

The bundled install is not sufficient for every project configuration. With `verifyDepsBeforeRun: error`, pnpm/setup v2.1.0 can leave workspace validation state stale, so later `pnpm run` or `pnpm exec` commands fail even though setup reported a successful install. See [the follow-up friction entry](../20260906144222-pnpm-setup-bundled/friction.md) for the reproducible CI case and workaround.
