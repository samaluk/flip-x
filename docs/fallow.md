# Fallow adoption gate

Flip-x is in the Fallow 3.17 adoption state. The repository deliberately keeps
its existing findings visible while blocking newly introduced debt with native
`audit --gate new-only`. This is a migration guard, not the zero-debt
architecture; the later transition is tracked in [issue #580](https://github.com/samaluk/flip-x/issues/580), with [fintual-api #405](https://github.com/samaluk/fintual-api/pull/405) as the steady-state reference.

## Blocking migration gate

Run coverage first, then the changed-code gate:

```bash
pnpm test:coverage
pnpm fallow:audit
```

`pnpm fallow:audit` is `fallow audit --gate new-only --type-aware` with the
Istanbul coverage file and repository root. Existing findings are inherited
and mergeable; new error-severity dead-code, duplication, complexity, styling,
or boundary findings fail the audit. `pnpm fallow:ci` is an alias for this same
migration gate. Hooks and the authoritative CI gate job use this command, never
a full-repository `--fail-on-issues` command.

`.github/workflows/ci.yml` is split into parallel jobs so a pull request goes
green as fast as possible (the layout follows the parallelization first applied
to [fintual-api PR #407](https://github.com/samaluk/fintual-api/pull/407)):

- **`Test with coverage`** — runs `pnpm test:coverage` once and uploads
  `coverage/coverage-final.json` as a short-lived artifact.
- **`Fallow gate`** — downloads that artifact and runs `pnpm fallow:ci` (the
  authoritative changed-file `new-only` migration gate) against it.
- **`Fallow PR review`** — the version-pinned native Action (below), which also
  consumes the shared coverage artifact.

Both Fallow jobs download the coverage artifact instead of reinstalling and
re-running the test suite, so a PR no longer pays for a second full
install + test run. Each job is its own required status check on the `master`
branch ruleset.

Pull requests use one immutable Fallow 3.17.0 Action analysis. It renders the
compact sticky summary, Check Run, inline review comments, and review guidance
directly. The former manual SARIF generation, HEAD/base splitting, duplicate
SARIF uploads, and `security-events` permission are intentionally removed.

## Full-repository inspection

These commands measure the backlog and are not expected to return zero during
the adoption phase:

```bash
pnpm fallow:dead-code
pnpm fallow:dupes
pnpm fallow:health
pnpm fallow:security
pnpm fallow:suppressions
pnpm fallow:recommend
pnpm fallow:status
pnpm fallow:boundaries
```

The migration snapshot is 91 dead-code findings (1 unused file, 11 unused
exports, and 79 private-type leaks), 54 semantic/near clone groups across 31
families, 16 health findings (2 critical, 6 high, and 8 moderate), six
advisory security candidates, and zero active suppressions. These are future
cleanup work, not permanent acceptance.

## Analysis configuration

- Type-aware analysis is required and complete across `tsconfig.json`,
  `tsconfig.tests.json`, and `convex/tsconfig.json` (TypeScript-Go protocol 7,
  zero abstentions and unresolved queries).
- Duplication uses semantic mode, near detection, eight-line/60-token floors,
  pair-level `minOccurrences: 2`, and import wiring ignored. Reviewed Confect
  clones, global CSS theme variables, shared Effect error boilerplate, shared UI
  primitive structures, and static player color palettes are fingerprinted
  narrowly: generated service declarations and `GroupImpl`/`FunctionImpl`
  registration symmetry are framework-owned; turn-command wrappers preserve
  distinct command contracts; indexed reads preserve table-specific inference;
  CSS `:root`/`.dark` variable pairs declare theme tokens; Effect
  `Schema.TaggedError` classes define nominal domain error schemas; shadcn/ui
  primitive wrappers forward standard component slots/props; and
  cascading-delete/player-color matches are semantic-normalization false
  positives. Presence component error handling is shared in authored code
   instead of fingerprinted. The card SVG icon components keep their
   geometry-specific viewBoxes and paths instead of forcing unrelated icons
   through a generic SVG wrapper, so `dup:c77b3abb6f87acd9-8:2` is a narrow
   reviewed fingerprint. `dup:6f87acd9:2` is the changed-file audit
   fingerprint for the same reviewed session-store/lobby indexed-read pair.
- Vitest produces real V8 Istanbul coverage. Fallow consumes it for audit and
  health/CRAP scoring. Structural coverage gaps were evaluated but remain
  advisory/off because the current 61-file/140-export signal is too noisy for
  a blocking adoption rule.
- Architecture boundaries model generated, test, adapter, logic,
  application, infrastructure, backend, shared, and UI zones with explicit
  dependency direction and `requireAllFiles`. The full scan currently reports
  no boundary violations.
- Entry-file exports remain externally credited by default. Enabling
  `includeEntryExports` was re-tested against the Next, Convex, and Confect
  surfaces and produced framework-managed false positives plus unresolved
  symbols, so it is not an accurate blocking signal for this repository yet.
- `private-type-leaks`, `stale-suppressions`, and suppression-reason checks are
  errors. Existing private-type leaks remain visible for later cleanup.

Only narrow, re-tested exceptions remain: generated Convex/Confect surfaces,
the `@/messages/**` JSON alias, `@confect/test`, `tailwindcss`, the next-intl
`usePathname` export, and standard public shadcn/ui primitive component exports.
Each covers runtime, build-time, or library-contract usage that Fallow cannot
infer from the static graph alone.

## Hooks

`hk` remains the only hook manager. Pre-commit formats/lints staged changes
and runs the changed-code Fallow audit. Pre-push runs coverage and then the
same `new-only` gate alongside the normal project checks. No baseline,
regression, freshness, or custom Fallow wrapper is involved.

## New-only proof

Temporary probes for an unused export, unused file, unused production
dependency, boundary crossing, and semantic duplication were introduced and
then removed. With the probes present, native audit returned `fail` and
reported introduced findings separately from inherited findings; after
restoration, the audit returned `pass`. This is the migration safety rail
until issue #580 reaches the strict zero-debt criteria.
