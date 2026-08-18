---
title: 'pnpm/setup v2 unified action differs from pnpm/action-setup'
severity: 'minor'
target: 'pnpm/setup'
---

pnpm/setup@v2.0.2 (NOT the legacy pnpm/action-setup) is a single action that installs pnpm, the Node runtime (version read from devEngines.runtime in package.json, not engines), and runs pnpm install by default. So the old setup-node + pnpm/action-setup(install:false) + explicit 'pnpm install --frozen-lockfile' still used in other repos is obsolete. Adding devEngines.runtime makes 'pnpm install' add a node@runtime:24.19.0 entry to pnpm-lock.yaml. Also, actionlint does not lint composite action.yml files (treats them as workflows and errors on 'runs'/'description').
