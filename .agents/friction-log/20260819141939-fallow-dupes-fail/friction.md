---
title: 'Fallow dupes --fail-on-issues does not gate clone groups'
severity: 'minor'
target: 'fallow-rs/fallow'
---

## Friction

With Fallow 3.17.0, `fallow dupes --fail-on-issues` exits 0 even when the
report contains clone groups, including a temporary 100% duplicated probe. The
CLI only exits non-zero when `duplicates.threshold` or `--threshold` is
configured.

## Impact

A repository following the standalone `dupes --fail-on-issues` command shape
cannot prove that newly introduced duplication fails that command. The strict
changed-code proof must use `fallow audit --gate all`, or the repository must
choose and maintain a duplication percentage threshold.

## Evidence

- `fallow dupes --fail-on-issues`: exit 0 with 24 clone groups in flip-x.
- Temporary three-file duplicated probe: exit 0 with 100% duplication.
- `fallow dupes --threshold 0.1 --fail-on-issues`: exit 1.
