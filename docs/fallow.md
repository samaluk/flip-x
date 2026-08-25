# Fallow zero-debt gate

Flip-x uses Fallow 3.17.0 as a strict repository-quality gate. The repository
does not carry a debt baseline or a regression-count allowance. Existing
dead-code and health findings are rejected directly, while reviewed framework
patterns remain narrowly configured or suppressed with reasons.

The workflow follows [fintual-api #405](https://github.com/samaluk/fintual-api/pull/405):
the native changed-file audit uses `gate: all`, and full-repository checks run
as separate commands so type-aware completeness and coverage failures cannot be
hidden by a combined fallback path.

## Gate Commands

Generate coverage before running the coverage-aware commands:

```bash
pnpm test:coverage
pnpm fallow:audit
pnpm fallow:dead-code
pnpm fallow:dupes
pnpm fallow:health
```

The authoritative local and CI composition is:

```bash
pnpm fallow:full
```

which expands to:

```bash
pnpm fallow:audit && pnpm fallow:dead-code && pnpm fallow:dupes && pnpm fallow:health
```

The commands have distinct responsibilities:

- `fallow audit --gate all` blocks every error-severity finding in changed files.
- `fallow dead-code --type-aware --fail-on-issues` blocks dead code, duplicate exports, boundary violations, private-type leaks, and incomplete semantic evidence.
- `fallow dupes --fail-on-issues` reports the full semantic and near-miss duplication surface. It uses the narrow `5.4016%` ceiling only because Fallow 3.17 reassigns ordinal `dup:c77b3abb6f87acd9-N` fingerprints when the reviewed suppression set changes; the ceiling equals the current measured value and leaves no headroom.
- `fallow health --coverage coverage/coverage-final.json --coverage-root "$PWD" --fail-on-issues` blocks complexity, CRAP, and unit-size findings using the same Istanbul artifact produced by the test job.

Fallow exit codes are native: `0` is clean, `1` is a finding, and `2` is an
analyzer or configuration error. Run `pnpm fallow:status` to verify the
version-matched TypeScript-Go companion before diagnosing a semantic result.

## CI And Coverage

`.github/workflows/fallow.yml` is the dedicated Fallow workflow and shares one
coverage artifact across its jobs:

- **Test with coverage** runs `pnpm test:coverage` and uploads `coverage/coverage-final.json`.
- **Fallow gate** downloads the artifact and runs `pnpm fallow:full`, which composes the strict audit, dead-code, duplication, and health commands.
- **Fallow PR review** runs one immutable native Fallow Action analysis with `gate: all`, type-aware analysis, and the same coverage artifact. It renders the sticky summary, Check Run, inline review comments, and review guidance.

Within that workflow, no job reinstalls dependencies or reruns the test suite
solely to obtain Fallow coverage. The audit and health commands both receive
repository-relative coverage evidence; the Action receives the workspace root
through `coverage-root`.

### Version Drift

`.github/workflows/fallow-drift.yml` runs once per exact Fallow version resolved
from `pnpm-lock.yaml`, rather than on a cron. On a cache miss it checks out full
history, sets up the repository's pinned Node and pnpm versions, installs with
`pnpm install --frozen-lockfile`, verifies the installed CLI matches the
lockfile version, generates fresh coverage, and runs `pnpm fallow:full`.

The version-keyed cache marker is saved by GitHub only after the entire job
succeeds. A failed install, test, or gate therefore remains retryable, while a
successful same-version rerun is a cache-hit no-op. The native Fallow Action
remains the PR feedback surface in `.github/workflows/fallow.yml`; it does not
define a separate drift verdict.

The exact duplication percentage bound remains only the documented workaround
for Fallow's unstable ordinal clone fingerprints. It is independent of the
version-drift cache and execution mechanics.

## Configuration

Type-aware analysis is required and complete for:

- `tsconfig.json`
- `tsconfig.tests.json`
- `convex/tsconfig.json`

Architecture boundaries cover generated, test, adapter, logic, application,
infrastructure, backend, shared, and UI zones. `requireAllFiles` remains enabled
with only the documented tooling exclusions, and the full boundary scan passes.

Duplication uses semantic mode with near-miss detection, eight-line/60-token
floors, pair-level `minOccurrences: 2`, and import wiring ignored. The stable
`ignoredClones` fingerprints are narrow and change-sensitive: a content or
occurrence-count change makes the clone reportable again. Fallow's ordinal
`dup:c77b3abb6f87acd9-N` fingerprints are not stable when the suppression set
changes, so those intentional groups remain visible and are covered by the
exact `5.4016%` measurement bound described below. The reviewed groups are:

| Fingerprints and counts | Classification and reason |
| --- | --- |
| `dup:2e174d80:2`, `dup:33a7c5c4:2`, `dup:8691c349:2`, `dup:9ed7c5ca:2` | Stable hash fingerprints for repeated CSS token and utility blocks in `app/globals.css`; nearby declarations remain explicit for cascade readability. |
| `dup:146daa20:2`, `dup:ec5a72c6:2` | Stable hash fingerprints for generated Confect service declarations and adjacent domain operation branches. |
| `dup:65e19125:2` | Stable hash fingerprint for latest-event handlers that preserve explicit event-family dispatch and exhaustive ordering. |
| `dup:66964408:2`, `dup:776beb96:2` | Stable hash fingerprints for VRT cases that repeat the render, viewport, and screenshot scaffold while varying the visual scenario. |
| `dup:c77b3abb6f87acd9-1:2`, `dup:c77b3abb6f87acd9-25:2`, `dup:c77b3abb6f87acd9-13:2`, `dup:c77b3abb6f87acd9-2:3`, `dup:c77b3abb6f87acd9-21:2` | Ordinal groups for Effect `Schema.TaggedError` declarations; each error retains its own stable class and constructor. |
| `dup:c77b3abb6f87acd9-19:3`, `dup:c77b3abb6f87acd9-8:2`, `dup:c77b3abb6f87acd9-26:2`, `dup:c77b3abb6f87acd9-9:2`, `dup:c77b3abb6f87acd9-24:2` | Ordinal groups for standard shadcn/Base UI primitive wrappers; each exported primitive keeps its library-required markup and slot contract. |
| `dup:c77b3abb6f87acd9-20:2`, `dup:c77b3abb6f87acd9-28:2`, `dup:c77b3abb6f87acd9-6:2` | Ordinal groups for static player-color data and semantic object-shape normalization false positives. |
| `dup:c77b3abb6f87acd9-23:2`, `dup:c77b3abb6f87acd9-22:3`, `dup:c77b3abb6f87acd9-11:3`, `dup:c77b3abb6f87acd9-14:2`, `dup:c77b3abb6f87acd9-16:2` | Ordinal groups for Confect `FunctionImpl` and `GroupImpl` registration symmetry; framework-owned wiring remains explicit at each entrypoint. |
| `dup:c77b3abb6f87acd9-7:3`, `dup:c77b3abb6f87acd9-17:2` | Ordinal groups for VRT cases that intentionally keep each visual scenario readable and independently asserted. |
| `dup:c77b3abb6f87acd9-12:2` | Ordinal group for geometry-specific card SVGs with similar parameterized path markup but different motifs. |
| `dup:c77b3abb6f87acd9-18:2` | Ordinal group for table-specific indexed reads reported by semantic normalization; the operations have different boundaries. |
| `dup:c77b3abb6f87acd9-15:2` | Ordinal group for card and player memo comparators that compare different domain props and remain separate by component boundary. |
| `dup:c77b3abb6f87acd9-5:2`, `dup:c77b3abb6f87acd9-27:2` | Ordinal groups for deterministic replay and Confect test fixtures; repeated snapshots and interface methods remain independently readable. |
| `dup:c77b3abb6f87acd9-10:2` | Ordinal group for separate command handlers with the same transition scaffold but different validation and resolution semantics. |
| `dup:c77b3abb6f87acd9-4:2`, `dup:c77b3abb6f87acd9-3:2` | Ordinal groups for event decoding and pending-action state transitions; these are distinct discriminated-union branches and a semantic false positive. |

No remaining group is extractable authored duplication. New clone content or
an occurrence-count change is intentionally reportable rather than absorbed by
aggregate headroom.

### Fallow Fingerprint Limitation

This bound is reproducible without source changes. Run the semantic-plus-near
scan with only the nine stable hash fingerprints above; it reports `844`
duplicated lines out of `15,625`, or exactly `5.4016%`. Adding an ordinal
`dup:c77b3abb6f87acd9-N` fingerprint changes the ordinal assigned to other
source ranges, so the same source can receive a different fingerprint when the
suppression set changes. The `5.4016` value is the exact current report with
only stable suppressions, so any measurable increase remains blocking.

The generated Confect services expose service tags and identifiers named
`DatabaseReader` and `DatabaseWriter`. `confect/lib/types.ts` intentionally
derives the corresponding Effect success types under the same public names;
the narrow `ignoreExports` entry prevents Fallow from treating those two
framework surfaces as an ambiguous barrel.

Health uses these thresholds:

- cyclomatic complexity: `20`
- cognitive complexity: `15`
- CRAP: `30`
- unit size: `60` lines

The two player-lane components keep exact, reasoned health threshold overrides
because their conditional badges and orthogonal interaction states are the
component's responsibility. The overrides match the current measurements, so
any further complexity increase remains blocking. Inline suppression reasons
are still required elsewhere, and stale suppressions remain errors.

Structural coverage gaps remain advisory. Istanbul coverage is enforced through
CRAP scoring, while the repository does not pretend that static dependency
paths are equivalent to runtime test coverage.

## Hooks

`hk` is the only hook manager:

- **Pre-commit** runs `pnpm fallow:staged`, which pipes `git diff --cached` into `fallow audit --diff-file - --base HEAD --gate all --type-aware` so findings are scoped line-level to staged hunks. Staged diffs that add no lines (pure renames, pure deletions, binary-only changes) fall back to plain file-scoped auditing instead of passing through the empty diff filter (`scripts/fallow-staged.sh`).
- **Pre-push** fetches `origin/master` first (so base resolution sees current master), then runs coverage and the complete `pnpm fallow:full` composition alongside the normal project checks; the fallow step depends on the `fetch` step.

There is no baseline updater, regression-count wrapper, freshness check, or
custom Fallow orchestration layer.

## Review And Investigation

Use `fallow review` for an advisory, graph-grounded orientation brief. It is
not a gate and always exits zero. Use `fallow audit` for the blocking changed-
file verdict.

```bash
pnpm fallow review --base origin/master
pnpm exec fallow dead-code --trace <file>:<export>
pnpm exec fallow dead-code --type-aware --symbol-impact <file>:<export>
pnpm exec fallow dupes --trace dup:<fingerprint>
pnpm exec fallow health --hotspots --targets
pnpm exec fallow guard <files>
pnpm fallow:suppressions
```

The reproducible negative-test matrix is recorded in
[`fallow-zero-debt-proof.md`](fallow-zero-debt-proof.md).
