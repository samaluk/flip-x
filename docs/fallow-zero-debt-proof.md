# Fallow Zero-Debt Proof

This document records the negative checks for the steady-state Fallow gate.
Each probe is introduced in a disposable worktree or temporary copy and
removed before the next case. The repository is clean before the probes.

## Matrix

| Probe | Blocking command | Expected result | What it proves |
| --- | --- | --- | --- |
| Add an unused production export | `pnpm fallow:dead-code` | Exit `1` | Dead-code findings are not accepted by the full-repository gate. |
| Add a semantic clone to changed code | `pnpm fallow:dupes` and `pnpm fallow:staged` | Audit verdict `fail`; the clone must be reviewed before adding an exact fingerprint/count | The `all` audit gate blocks duplication introduced by the staged change, while the full duplication report exposes new clone debt without an aggregate allowance. |
| Add a function above the cognitive threshold | `pnpm fallow:health` | Exit `1` | Coverage-aware health findings block the repository gate. |
| Remove each probe | The same command for each row | Exit `0` | The gate returns to clean after the debt is removed. |

The repository uses the exact measured `2.7392%` duplication value as its
narrow threshold because Fallow 3.17 reassigns ordinal clone fingerprints when
the reviewed `ignoredClones` set changes. There is no generic headroom. The
changed-file `audit --gate all` is the strict blocking proof for an introduced
clone, and the standalone command remains the full repository duplication
report.

## Reproduction Shape

The probes need only use the native commands and the repository configuration:

```bash
# Run the clean baseline first.
pnpm test:coverage
pnpm fallow:dead-code
pnpm fallow:dupes
pnpm fallow:health

# After adding one probe, stage it and run the matching command.
pnpm fallow:dead-code
pnpm fallow:dupes
pnpm fallow:staged
pnpm fallow:health

# Remove the probe, regenerate coverage when health was exercised, and rerun.
pnpm test:coverage
pnpm fallow:dead-code
pnpm fallow:dupes
pnpm fallow:health
```

The audit probe is run against `HEAD` so it examines exactly the staged
changes. CI uses the same `all` gate against the pull request's changed files.
Staged diffs without added lines (pure renames, deletions, binary-only
changes) are audited file-scoped rather than through fallow's empty diff
filter.

## Completeness Checks

The strict composition also proves the supporting evidence paths:

- `pnpm fallow:status` reports the version-matched TypeScript-Go companion with protocol 7.
- `pnpm fallow:dead-code` requires `typeAware.require: "complete"` across all three configured projects.
- `pnpm fallow:boundaries` validates the configured architecture zones.
- `pnpm fallow:health` consumes `coverage/coverage-final.json` from Vitest's Istanbul reporter.
- The CI gate downloads that same artifact instead of producing a second coverage run.

These checks are deliberately separate. A combined fallback analysis must not
be allowed to turn an incomplete configured semantic project into a successful
repository gate.
