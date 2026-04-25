# Testing

The repo is optimized for fast local PR signal first. Pure engine, infrastructure, contract, UI, and Confect-backed tests are the default confidence layer. Preview-backed Convex, VRT, and E2E suites are narrower and should only cover runtime wiring or user-visible regressions.

## Fast Local Default

`pnpm test` runs:

- `pnpm test:engine`
- `pnpm test:infra`
- `pnpm test:contract`
- `pnpm test:ui`
- `pnpm test:confect`

These suites do not require a Convex preview deployment.

## Suite Map

### Engine Unit

- Command: `pnpm test:engine`
- Tool: Vitest with `node`
- Paths: `tests/unit/engine/**`
- Owns: pure game rules, scoring, turn resolution, Flip Three, card deck construction, deterministic RNG, and deterministic replay diagnostics.
- Delete duplicate coverage when the assertion needs Convex, React, or persistence to be meaningful.

### Infrastructure Unit

- Command: `pnpm test:infra`
- Tool: Vitest with `node`
- Paths: `tests/unit/infrastructure/**`
- Owns: serialization, persisted event mapping, round history projection, and other persistence-boundary helpers without a live database.
- Delete duplicate coverage when it is only rechecking game rules already covered by engine tests.

### Contract

- Command: `pnpm test:contract`
- Tool: Vitest with `node`
- Paths: `tests/contract/**`
- Owns: stable public shapes such as `MatchSnapshot`, round history entries, deterministic replay fixtures, and replay DSL invariants.
- Delete duplicate coverage when it asserts component copy, layout, or detailed rule outcomes.

### Confect Local Backend

- Command: `pnpm test:confect`
- Tool: Vitest with `node` and `convex-test`
- Paths: `tests/confect/**`
- Owns: Confect refs, schema codecs, command runner behavior, idempotency, persistence, finalization, and deterministic backend replay.
- Delete duplicate coverage from preview-backed tests unless the assertion depends on deployed runtime wiring.

### React UI

- Command: `pnpm test:ui`
- Tool: Vitest with `jsdom`
- Paths:
  - `game/**/*.test.tsx`
  - `tests/integration/**/*.test.tsx`
- Owns: component behavior, controls, player lane rendering, score/history rendering, and lobby code copy.
- Delete duplicate coverage when it tests game rules instead of rendered behavior.

### Convex Preview Smoke

- Command: `pnpm test:backend` or `pnpm test:smoke:backend`
- Tool: Vitest with `node` against a real Convex preview deployment
- Paths: `tests/backend/**`
- Owns: deployed Convex wrapper registration, preview deployment config, presence component integration, create/join/start smoke, one valid turn, and one invalid actor rejection.
- Delete duplicate coverage when it replays deterministic scenarios or exhaustively checks game rules.

This suite is destructive for its target deployment. It clears all app data between tests.

### Visual Regression

- Command: `pnpm test:vrt`
- Update baselines: `pnpm test:vrt:update`
- Tool: Vitest browser with Playwright provider, executed in Linux Docker
- Paths: `game/**/*.vitest.tsx`
- Owns: high-value visual states only. Prefer representative states over exhaustive card matrices unless visual styling genuinely varies by every value.
- Delete duplicate baselines when the corresponding VRT file is removed or moved.

### End-to-End

- Command: `pnpm test:e2e`
- Tool: Playwright against the running app and Convex preview backend
- Paths: `e2e/**`
- Owns: one or two critical browser journeys, currently create/join/start/hit and join-by-code seat claim.
- Delete duplicate coverage when it tests game rules better covered by engine or Confect tests.

## Preview-Backed Suites

`pnpm test:backend` and `pnpm test:e2e` always run against a Convex preview deployment.

Requirements:

- `CONVEX_DEPLOY_KEY` must be set, either exported in the shell or present in `.env.local`

Preview naming:

- Local runs use `local-<user>-<git-branch>`
- PR CI runs use `pr-<number>`
- Push CI runs use the branch name

Notes:

- The preview wrapper sources `.env.local` for local runs before checking for `CONVEX_DEPLOY_KEY`
- Local and CI preview-backed tests do not use `convex dev --local`
- Do not point backend tests at a shared deployment

## Typical Commands

Fast local validation:

```bash
pnpm lint
pnpm test
pnpm build
```

Preview-backed validation:

```bash
CONVEX_DEPLOY_KEY=... pnpm test:backend
CONVEX_DEPLOY_KEY=... pnpm test:e2e
```

Full CI-style coverage:

```bash
pnpm test
pnpm test:vrt
CONVEX_DEPLOY_KEY=... pnpm test:backend
CONVEX_DEPLOY_KEY=... pnpm test:e2e
```

## Deterministic Tests

Deterministic tests replay a recorded game using the exact same player decisions and deck order. They verify that the game produces the same outcome from the same input without relying on randomness.

Fixtures and runners live in `tests/fixtures/deterministic/`. Local engine and Confect suites own deterministic behavior. Preview-backed backend tests should only keep deterministic setup coverage if it is needed to prove deployed wrapper/runtime wiring.
