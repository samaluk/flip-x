---
title: 'Fallow Action auto-changed-since narrows gate all to added lines'
severity: 'minor'
target: 'fallow-rs/fallow'
---

While simplifying flip-x's duplicated Fallow CI audit on 3.27.0, replacing the
standalone file-scoped audit with only the native Action would have weakened
`gate: all`: the Action's default `auto-changed-since: true` generates and exports
`FALLOW_DIFF_FILE`, which filters source findings to added hunks. Findings
elsewhere in a changed file are hidden even with the all gate.

Verified in the pinned v3.27.0 `action/scripts/analyze.sh` (automatic base
selection and unified-diff construction) and its `action.yml` input descriptions.
For whole-changed-file enforcement, use `command: audit`, `gate: all`,
`auto-changed-since: false`, and `args: --base <PR base SHA>`. This lets the audit
own file discovery while the native feedback renderers handle inline placement.

This repository now uses that configuration and documents why the two scope
inputs are intentional. Do not remove them as apparently redundant defaults.
