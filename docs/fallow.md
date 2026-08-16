# Fallow quality gate

Flip-x uses [Fallow](https://docs.fallow.tools) with a changed-files quality gate:

- **`pnpm fallow:audit`** — `fallow audit` against the merge-base with the remote default branch. Fails (`--gate new-only`) only on findings the current changeset **introduces**; pre-existing findings in touched files are inherited context, not verdict blockers.
- **`pnpm fallow:baseline`** — regenerates the committed baselines after you legitimately remove findings.

Existing technical debt is baselined; new debt is rejected.

## Baselines

`fallow-baselines/*.json` are identity snapshots of current findings, declared in `.fallowrc.json` under `audit.*Baseline`:

| File | Analysis | Saved with |
|------|----------|------------|
| `dead-code.json` | Unused code, deps, private type leaks | `fallow dead-code --no-type-aware --save-baseline` |
| `health.json` | Complexity, CRAP, unit size | `fallow health --no-type-aware --baseline-mode identity --save-baseline` |
| `dupes.json` | Semantic clone groups | `fallow dupes --save-baseline` |

Baselines are saved **syntactically** (`--no-type-aware`) because the audit gate runs with `audit.typeAware: false` in `.fallowrc.json`: fallow's audit dead-code analysis requests the `type-coupling` semantic capability (via its health-shared parse), so type-aware baselines saved by `fallow dead-code --type-aware --save-baseline` never match the audit's analysis identity (`capabilities` mismatch, exit 2). Keeping both sides syntactic keeps the gate version-resilient — no hardcoded version pin, no baseline identity churn across fallow upgrades.

Type-aware analysis remains available ad-hoc for local cleanup work:

```bash
pnpm exec fallow dead-code --type-aware --trace <file>:<export>   # exact consumers
pnpm exec fallow fix --type-aware --dry-run                      # preview safe fixes
pnpm exec fallow health --type-aware --type-coupling             # signature coupling
```

## Commands

```bash
pnpm fallow:audit       # Changed-files review (new-only gate); what CI runs
pnpm fallow:baseline    # Regenerate all baselines after genuine fixes
```

`fallow:baseline` tolerates exit 1 (findings still present — that is the point of baselining them) and fails only on real errors.

## Inspecting findings

```bash
# Why is an export flagged?
pnpm exec fallow dead-code --trace shared/i18n/navigation.ts:usePathname

# Exact TypeScript consumers
pnpm exec fallow dead-code --type-aware --symbol-impact game/logic/round-state.ts:RoundRuntime

# Duplication fingerprint
pnpm exec fallow dupes --trace dup:c77b3abb6f87acd9

# Health hotspots and targets
pnpm exec fallow health --hotspots --targets --ownership

# Explain an issue type
pnpm exec fallow explain private-type-leak
```

## Updating baselines after improvements

When you remove findings legitimately:

```bash
pnpm fallow:baseline
git add .fallowrc.json fallow-baselines/
```

## Configuration exclusions

| Pattern | Reason |
|---------|--------|
| `ignoreFindings: convex/_generated/**`, `confect/_generated/**` | Hide dead-code noise; files stay in graph for import resolution |
| `ignoreExports: shared/ui/*.tsx` | shadcn re-exports full component API |
| `ignoreExports: shared/i18n/navigation.ts:usePathname` | next-intl `createNavigation` destructuring breaks type-aware completeness |
| `ignoreUnresolvedImports: @/messages/**` | JSON locale imports resolved at build time |
| `ignoreDependencies: tailwindcss, shadcn, …` | Tooling/CSS deps not imported as modules |

## CI behavior

On pull requests, `pnpm fallow:audit` (`.github/workflows/ci.yml`):

1. Resolves the base as the merge-base against the upstream remote default branch
2. Runs dead-code, health, and duplication analysis on changed files
3. Compares against `fallow-baselines/*` and fails only on **introduced** error-severity findings

Baselines are committed; update them with `pnpm fallow:baseline` when a finding is genuinely fixed.
