# Fallow gate verification

Run probes in a disposable checkout with installed dependencies, the current
`.fallowrc.json`, and fresh `pnpm test:coverage` output. Verify the expected
advisory or blocking verdict, then remove each probe to restore a clean result.

| Probe | Command | Expected result |
| --- | --- | --- |
| Add an unused production export | `pnpm fallow:dead-code` | Exit `1`, unused export reported. |
| Add a semantic clone below the percentage ceiling | `pnpm fallow:staged` | Exit `0`, audit verdict `warn`, clones reported. |
| Lower the ceiling below that clone report's percentage | `pnpm fallow:staged` | Exit `1`, audit verdict `fail`. |
| Set a temporary duplication ceiling below the measured percentage | `pnpm fallow:dupes` | Exit `1`, enforced threshold gate fails. |
| Add a function above the cognitive threshold | `pnpm fallow:health` | Exit `1`, complexity finding reported. |
| Make semantic evidence unavailable while an unused export needs refinement | `pnpm fallow:dead-code` | Nonzero exit under `typeAware.require: "complete"`. |
| Remove only a consumer line, leaving an unused export in the same changed file | `pnpm fallow:staged` | Exit `1`; deletion-only diffs cannot hide the finding. |

`fallow:staged` uses native file scoping against HEAD. In pre-commit, hk stashes
unstaged changes so the audited working tree matches the index. Direct invocations
include unstaged changes too.

Both duplication verdicts use the configured percentage ceiling;
`--fail-on-issues` and `audit --gate all` do not reject every clone group.
Do not replace the full gate with the bare combined command: Fallow 3.27
explicitly reports its duplication threshold as unenforced.

## Setup regression checks

- `pnpm fallow list --entry-points` still discovers all application entries after
  removing redundant Next.js and Convex globs. Keep the custom i18n request entry.
- `pnpm fallow type-aware status` resolves the version-matched companion;
  `pnpm fallow config` retains complete semantic evidence and the `all` audit gate.
- `pnpm fallow:health --format json` reports Istanbul coverage with the same
  matched files and thresholds before and after configuration simplification.
  In a second checkout, set `FALLOW_COVERAGE_ROOT` to the producing checkout's
  absolute path, as CI does through the coverage job output.
- `pnpm fallow:audit` and `pnpm fallow:full` pass with the clean source tree.
- `actionlint .github/workflows/fallow.yml` passes and all three required job names
  remain: `Test with coverage`, `Fallow gate`, and `Fallow PR review`.
- The native Action installer with `FALLOW_INSTALL_DRY_RUN=true` resolves the
  package's pinned CLI and matching sidecar from project configuration.

The regular workflow runs the full gate on dependency PRs and pushes, covering
version drift without a separate workflow or version-keyed cache marker.

Verified with Fallow 3.27.0 on 2026-09-20: every probe above produced the expected
exit/verdict and returned to clean after removal. All 131 Istanbul files matched
in both checkout locations. The native Action analysis script also rejected an
existing unused export outside the edited hunk with automatic diff scoping off.
The coverage run passed 212 tests across 52 files.
