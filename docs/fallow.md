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
pnpm fallow:audit && pnpm fallow:dead-code && pnpm fallow:dupes && pnpm fallow:health
```

The commands have distinct responsibilities:

- `fallow audit --gate all` blocks every error-severity finding in changed files.
- `fallow dead-code --type-aware --fail-on-issues` blocks dead code, duplicate exports, boundary violations, private-type leaks, and incomplete semantic evidence.
- `fallow dupes --fail-on-issues` reports the full duplication surface and fails when duplication exceeds the tightly measured `duplicates.threshold` of `5.1908%`. The current reviewed surface is `5.190732%`; any measurable increase crosses the ceiling.
- `fallow health --coverage coverage/coverage-final.json --coverage-root "$PWD" --fail-on-issues` blocks complexity, CRAP, and unit-size findings using the same Istanbul artifact produced by the test job.

Fallow exit codes are native: `0` is clean, `1` is a finding, and `2` is an
analyzer or configuration error. Run `pnpm fallow:status` to verify the
version-matched TypeScript-Go companion before diagnosing a semantic result.

## CI And Coverage

`.github/workflows/ci.yml` shares one coverage artifact across the Fallow jobs:

- **Test with coverage** runs `pnpm test:coverage` and uploads `coverage/coverage-final.json`.
- **Fallow gate** downloads the artifact and runs `pnpm fallow:ci`, which composes the strict audit, dead-code, duplication, and health commands.
- **Fallow PR review** runs one immutable native Fallow Action analysis with `gate: all`, type-aware analysis, and the same coverage artifact. It renders the sticky summary, Check Run, inline review comments, and review guidance.

No job reinstalls dependencies or reruns the test suite solely to obtain Fallow
coverage. The audit and health commands both receive repository-relative
coverage evidence; the Action receives the workspace root through
`coverage-root`.

## Configuration

Type-aware analysis is required and complete for:

- `tsconfig.json`
- `tsconfig.tests.json`
- `convex/tsconfig.json`

Architecture boundaries cover generated, test, adapter, logic, application,
infrastructure, backend, shared, and UI zones. `requireAllFiles` remains enabled
with only the documented tooling exclusions, and the full boundary scan passes.

Duplication uses semantic mode with near-miss detection, eight-line/60-token
floors, pair-level `minOccurrences: 2`, and import wiring ignored. Reviewed
clone fingerprints are narrow and change-sensitive: a content or occurrence
count change makes the clone reportable again. They cover framework-owned
Confect registration symmetry, Effect `Schema.TaggedError` declarations,
standard shadcn/ui primitive wrappers, static player-color data, geometry-
specific card SVGs, table-specific indexed reads, and known semantic-
normalization false positives. Extractable authored duplication is refactored
instead of being hidden.

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

- **Pre-commit** runs the staged, coverage-free `fallow audit --base HEAD --gate all` through `pnpm fallow:audit:staged`.
- **Pre-push** runs coverage and then the complete `pnpm fallow:ci` composition alongside the normal project checks.

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
