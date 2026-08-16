# Fallow quality gate

Flip-x uses [Fallow](https://docs.fallow.tools) with two complementary gates, both running type-aware:

- **`pnpm fallow:audit`** — `fallow audit` against the merge-base with the remote default branch. Fails (`gate: new-only`) only on findings the current changeset **introduces**; pre-existing findings in touched files are inherited context, not verdict blockers.
- **`pnpm fallow:regression`** — full-repo type-aware run (`fallow dead-code --fail-on-regression`) against the embedded `regression.baseline` in `.fallowrc.json`. Fails only when the total issue count grows beyond the baseline.

Existing technical debt is baselined; new debt is rejected.

## Why no baseline files

The audit gate runs type-aware (`audit.typeAware: true` in `.fallowrc.json`). Fallow's audit dead-code analysis requests the `type-coupling` semantic capability, which never matches the identity of baselines saved by `fallow dead-code --type-aware --save-baseline` (capabilities mismatch, exit 2). The audit therefore runs without `audit.*Baseline` files and relies on its base-snapshot attribution pass to separate introduced from inherited findings. The full-repo ratchet instead lives in `regression.baseline` in `.fallowrc.json`, written and compared by the dead-code command itself, so its type-aware identity always matches.

## Commands

```bash
pnpm fallow:audit                # Changed-files review (new-only, type-aware); what CI runs
pnpm fallow:regression           # Full-repo type-aware ratchet (embedded baseline); what CI runs
pnpm fallow:regression:update    # Regenerate regression.baseline after genuine fixes
```

`fallow:regression:update` writes the current type-aware counts into `regression.baseline` in `.fallowrc.json` and tolerates exit 1 (findings still present — that is the point of baselining them), failing only on real errors.

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

## Updating the baseline after improvements

When you remove findings legitimately:

```bash
pnpm fallow:regression:update
git add .fallowrc.json
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

On pull requests, `.github/workflows/ci.yml` runs `pnpm fallow:audit && pnpm fallow:regression`:

1. `fallow audit` resolves the base as the merge-base against the upstream remote default branch, runs type-aware dead-code, health, and duplication analysis on changed files, and fails only on **introduced** error-severity findings (base-snapshot attribution, no baseline files).
2. `fallow regression` re-runs type-aware dead-code across the whole repository and fails if the total count exceeds the embedded `regression.baseline`.

The same two gates run in the `hk.pkl` pre-push hook and `pnpm ci:local`.
