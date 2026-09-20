# Fallow quality gates

Flip-x pins Fallow in `package.json` and the GitHub Action by release SHA.
`.fallowrc.json` owns the shared policy: complete type-aware evidence, architecture
boundaries, reasoned suppressions, coverage, and `audit.gate: "all"`. Local
commands and CI inherit it.

## Commands

```bash
pnpm test:coverage
pnpm fallow:audit        # Changed-file gate against the detected base
pnpm fallow:full         # Full-repository dead-code, duplication, and health gates
pnpm fallow:staged       # Changed-file gate against HEAD; used by hk
```

The three repository gates remain individually runnable as
`pnpm fallow:dead-code`, `pnpm fallow:dupes`, and `pnpm fallow:health`.
`pnpm ci:local` and pre-push generate coverage, then run the audit and full gate.
Native exit codes propagate: `0` passes, `1` blocks on findings, and `2` reports
an analyzer/configuration error.

Use `pnpm fallow <command>` for other native commands instead of maintaining
one package script for every Fallow feature:

```bash
pnpm fallow doctor
pnpm fallow type-aware status
pnpm fallow recommend
pnpm fallow config
pnpm fallow list --boundaries
pnpm fallow review --base origin/master
pnpm fallow dead-code --trace <file>:<export>
pnpm fallow dupes --trace dup:<fingerprint>
pnpm fallow health --hotspots --targets
pnpm fallow suppressions
pnpm fallow fix --dry-run
# Review the preview before applying:
pnpm fallow fix --yes
```

`review` is advisory and always exits zero; `audit` is the blocking command.

## CI and hooks

`.github/workflows/fallow.yml` retains the three required status-check names:

| Check | Responsibility |
| --- | --- |
| Test with coverage | Run the fast Vitest projects once and upload Istanbul coverage. |
| Fallow gate | Download coverage and run the three full-repository gates. |
| Fallow PR review | Download coverage and run one native Action audit, including the sticky summary, Check Run, inline comments, and review guidance. |

The Action reads the CLI version from `package.json` and provisions its matching
TypeScript companion from `typeAware.enabled`. Coverage comes from
`health.coverage`; both consumers rebase its absolute paths using the producing
job's checkout root. Renovate updates the package and Action together.

The Action receives an explicit audit base SHA with `auto-changed-since: false`.
Its automatic mode also supplies a line-diff filter, which would narrow the
`all` gate to edited hunks. Explicit file scoping preserves the local gate's
behavior while native renderers place review comments on eligible diff lines.

The full gate runs on every PR and push to master/main, including dependency
updates. A separate version-drift workflow would repeat the same tests and
gates, so none is needed.

`hk` remains the only hook manager. Pre-commit stashes unstaged changes and runs
`fallow audit --base HEAD` against the staged snapshot. The audit deliberately
checks whole changed files, including pre-existing findings in them. There is
no line-diff pipe or empty-diff fallback to maintain; deletion-only changes use
the same native path. Pre-push fetches the current base, generates coverage,
and runs both the changed-file audit and the repository gates.

Running `pnpm fallow:staged` directly does not stash: it examines working-tree
changes against HEAD. Use `mise run pre-commit` when partial staging matters.

## Project-specific configuration

Next.js and Convex entries and the `.next` exclusion come from native discovery.
Only Confect table definitions and the custom `shared/i18n/request.ts` path need
manual entries. Confect implementation registration remains dynamically loaded.
Generated-code findings, external UI primitive exports, generated locale imports,
and tooling-only dependencies retain their narrow exceptions.

Type-aware analysis requires complete evidence across `tsconfig.json`,
`tsconfig.tests.json`, and `convex/tsconfig.json`. Architecture boundaries still
cover the logic, application, infrastructure, backend, shared, UI, adapter,
generated, and test zones, with `requireAllFiles` enabled.

Health uses Fallow's defaults: cyclomatic `20`, cognitive `15`, CRAP `30`, and
unit size `60`. Exact, reasoned per-function overrides remain in the config.
Istanbul coverage supplies CRAP scoring; structural coverage gaps stay advisory.

Duplication retains semantic mode, near-miss detection, eight-line/60-token
floors, pairs, and ignored imports. Reviewed `ignoredClones` entries and the
existing `6.08%` ceiling remain unchanged. That ceiling is an aggregate guard,
not a claim of zero clone debt or an exact current measurement. The changed-file
`audit` reports clones in touched files and also uses the configured percentage
to decide whether duplication warns or fails. A new clone below the ceiling can
therefore warn without failing; `gate: all` does not change that threshold.

Fallow 3.23 replaced old numeric collision handles with report-scoped `-rN`
handles ordered by canonical fragments and locations. Those handles can still
change with the report's group set, so this setup does not replace the ceiling
with a newly generated suppression list. Existing reviewed patterns include
Effect error classes, Confect registration, UI primitives, CSS tokens, and test
fixtures. Review a group with `dupes --trace` before changing its exception.

## Why keep standalone gates?

The [3.27 release](https://github.com/fallow-rs/fallow/releases/tag/v3.27.0)
propagates native gate outcomes through the Action. Its combined command still
reports the duplication threshold as **not enforced**, so bare `fallow` cannot
replace `fallow:full`. Keep `dupes` as a standalone gate and let the Action own
the changed-code audit once.

Upstream references: [CI setup](https://github.com/fallow-rs/fallow/tree/v3.27.0#ci),
[Action inputs](https://github.com/fallow-rs/fallow/blob/v3.27.0/action.yml), and
[configuration](https://docs.fallow.tools/configuration/overview).
See [gate verification](fallow-zero-debt-proof.md) for regression probes.
