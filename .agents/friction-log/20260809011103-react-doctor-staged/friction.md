---
title: 'react-doctor --staged guard fails on gitignored package.json files'
severity: 'minor'
target: 'react-doctor'
---

react-doctor's staged-snapshot divergence guard (`Cannot scan staged files while configuration differs between the index and worktree`) trips on ANY gitignored package.json outside the index. `.opencode/package.json` (opencode plugin manifest, untracked) blocked `pnpm doctor:staged` in pre-commit until we deleted `.opencode/`. The guard reads repo-wide `git status --ignored=matching` and treats ignored config-named files as divergences, so tracked-or-absent is the only way to satisfy it.
