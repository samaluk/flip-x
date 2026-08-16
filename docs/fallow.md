# Fallow quality gates

Flip-x pins Fallow 3.16.0 and uses the fleet-standard, zero-tolerance quality ratchet. Existing findings are committed as identity baselines; new findings, count regressions, stale baselines, incomplete semantic evidence, uncovered architecture files, and boundary violations fail CI.

## Gates

- `pnpm fallow:audit`: fast changed-code audit, `gate: new-only`, type-aware, with the same Istanbul coverage used by full scans and audit base snapshots.
- `pnpm fallow:dead-code`, `fallow:dupes`, and `fallow:health`: full-repo exact identity gates. A finding cannot be exchanged for a different finding while preserving the count.
- `pnpm fallow:regression`: zero-tolerance dead-code count ratchet plus a zero-abstention semantic guard.
- `pnpm fallow:baseline:check`: regenerates all baselines in a temporary directory and compares canonical JSON without modifying the worktree.
- `pnpm fallow:ci`: authoritative version, semantic status, exact identity, freshness, and regression gate used by pre-push, local CI, and GitHub CI.

Run `pnpm test:coverage` before local Fallow commands. Vitest writes `coverage/coverage-final.json`; health baseline generation, health checks, HEAD audit, audit base-snapshot analysis, local CI, and GitHub CI all receive that same Istanbul file and checkout root.

## Policy

- Type-aware analysis requires `complete`. All app, test, and Convex tsconfigs are selected. The migration proof reported completeness `complete`, zero abstentions, and zero unresolved semantic queries.
- Duplication uses semantic and near-miss detection, eight lines, 60 tokens, three occurrences, and excludes import wiring. Existing clone groups are baselined.
- Health uses the fleet ceilings: cyclomatic 20, cognitive 15, CRAP 30, and unit size 60. Existing health debt is baselined rather than hidden or assigned weaker thresholds.
- Architecture uses explicit generated, logic, application, infrastructure, backend, shared, adapter, UI, and test zones. Rules encode their allowed dependency directions; `requireAllFiles` prevents new source files from escaping the model.
- `private-type-leaks` and missing suppression reasons are errors. Existing private type leaks are identity-baselined; no source suppressions were added by this migration.

## Baseline maintenance

After a genuine fix:

```bash
pnpm test:coverage
pnpm fallow:baseline:update
pnpm fallow:baseline:check
git add .fallowrc.json fallow-baselines/
```

Never regenerate baselines to accept new debt. Freshness fails when debt improves but the committed identities/counts were not updated; exact and regression gates fail when debt grows.

## Hooks and GitHub

Pre-commit runs the changed-code audit. Pre-push runs `pnpm fallow:ci`. The main CI job runs coverage and the full ratchet. Pull requests also use the official Fallow action pinned to its 3.16.0 commit for annotations, a sticky comment, checks, and SARIF.

The version-matched skill is vendored at `.agents/skills/fallow/` from `node_modules/fallow/skills/fallow`; it is the agent source of truth. `.mcp.json` registers `pnpm exec fallow-mcp` for clients that support the common MCP configuration file. The single wrapper, `scripts/fallow.mjs`, owns only cross-platform orchestration for update, temp regeneration/diff, version/completeness/regression checks, and the authoritative composite gate.

Useful diagnostics:

```bash
pnpm fallow:config
pnpm fallow:status
pnpm exec fallow list --boundaries
pnpm exec fallow guard game/application/run-command.ts
pnpm exec fallow dead-code --type-aware --trace game/logic/round-state.ts:RoundRuntime
pnpm exec fallow dupes --trace dup:c77b3abb6f87acd9-1
pnpm exec fallow health --coverage coverage/coverage-final.json --hotspots --targets --ownership
pnpm fallow:suppressions
pnpm fallow:security
```

Fallow audit baselines are intentionally not configured: in 3.16.0 the audit requests the `type-coupling` semantic capability while a dead-code identity baseline cannot, so exact capability matching rejects the baseline. The audit instead uses its native new-only base-snapshot attribution. The separate full-repo identity gates provide exact identity enforcement.
