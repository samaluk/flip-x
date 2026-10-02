---
title: 'pnpm trust verification keeps stale version timestamps'
severity: 'minor'
target: 'pnpm/pnpm'
---

With pnpm 12.8.1, adding Effect 4 dependencies failed ERR_PNPM_TRUST_DOWNGRADE for all 19 existing @oxlint/binding-* packages at 1.86.0 because their cached metadata was missing the version timestamp. A fresh pnpm view @oxlint/binding-darwin-arm64 time --json returned the timestamp, but repeating the install (including --config.preferOnline=true) still failed. Running pnpm cache delete '@oxlint/binding-*' followed by the same pnpm add command passed all 1144 lockfile policy checks without changing pnpm-workspace.yaml or its trust policy. The error guidance suggested deleting the lockfile or relaxing policy; refreshing just the affected metadata cache was sufficient.
