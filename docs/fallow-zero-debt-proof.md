# Fallow Zero-Debt Proof

This document records the negative checks for the steady-state Fallow gate.
Each probe is introduced in a disposable worktree or temporary copy and
removed before the next case. The repository is clean before the probes.

## Matrix

| Probe | Blocking command | Expected result | What it proves |
| --- | --- | --- | --- |
| Add an unused production export | `pnpm fallow:dead-code` | Exit `1` | Dead-code findings are not accepted by the full-repository gate. |
| Add a semantic clone to changed code | `pnpm fallow:dupes` and `pnpm fallow:audit:staged` | Exit `1`, audit verdict `fail` | The duplication ceiling and `all` audit gate block duplication introduced by the staged change. |
| Add a function above the cognitive threshold | `pnpm fallow:health` | Exit `1` | Coverage-aware health findings block the repository gate. |
| Remove each probe | The same command for each row | Exit `0` | The gate returns to clean after the debt is removed. |

The repository configures Fallow's native duplication threshold at `5.1908%`.
The current scan measures `5.190732%`, leaving no meaningful growth allowance.
The changed-file `audit --gate all` is an additional strict proof for the
introduced clone itself, while the standalone command proves that the full
repository stays under the measured ceiling.

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
pnpm fallow:audit:staged
pnpm fallow:health

# Remove the probe, regenerate coverage when health was exercised, and rerun.
pnpm test:coverage
pnpm fallow:dead-code
pnpm fallow:dupes
pnpm fallow:health
```

The audit probe is run against `HEAD` so it examines exactly the staged
changes. CI uses the same `all` gate against the pull request's changed files.

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
