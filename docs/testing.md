# Testing

The repo is optimized for fast local PR signal first. Pure engine, infrastructure, contract, UI, and Confect-backed tests are the default confidence layer. Backend smoke, VRT, and E2E suites are narrower and should only cover runtime wiring or user-visible regressions.

## Fast Local Default

`pnpm test` runs:

- `pnpm test:engine`
- `pnpm test:infra`
- `pnpm test:contract`
- `pnpm test:ui`
- `pnpm test:confect`

These suites do not require a running Convex backend.

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
- Delete duplicate coverage from smoke tests unless the assertion depends on deployed runtime wiring.

### React UI

- Command: `pnpm test:ui`
- Tool: Vitest with `jsdom`
- Paths:
  - `game/**/*.test.tsx`
  - `tests/integration/**/*.test.tsx`
- Owns: component behavior, controls, player lane rendering, score/history rendering, and lobby code copy.
- Delete duplicate coverage when it tests game rules instead of rendered behavior.

### Convex Backend Smoke

- Command: `pnpm test:backend` or `pnpm test:smoke:backend`
- Tool: Vitest with `node` against a real Convex deployment URL (`NEXT_PUBLIC_CONVEX_URL`)
- Paths: `tests/backend/**`
- Owns: deployed Convex wrapper registration, presence component integration, create/join/start smoke, one valid turn, and one invalid actor rejection.
- Delete duplicate coverage when it replays deterministic scenarios or exhaustively checks game rules.

This suite is destructive for its target deployment. The wrapper clears all app data before the suite starts, and backend tests clear data between tests.

### Visual Regression

- Command: `pnpm test:vrt`
- Update baselines: `pnpm test:vrt:update`
- Tool: Vitest browser with Playwright provider, executed in Linux Docker
- Paths: `game/**/*.vitest.tsx`
- Owns: high-value visual states only. Prefer representative states over exhaustive card matrices unless visual styling genuinely varies by every value.
- Delete duplicate baselines when the corresponding VRT file is removed or moved.

### End-to-End

- Command: `pnpm test:e2e`
- Tool: Playwright against the running app and the same Convex deployment URL as backend smoke
- Paths: `e2e/**`
- Owns: one or two critical browser journeys, currently create/join/start/hit and join-by-code seat claim.
- Delete duplicate coverage when it tests game rules better covered by engine or Confect tests.

## Backend and E2E: local vs preview

[`scripts/convex-preview-test.sh`](scripts/convex-preview-test.sh) prepares the deployment and runs your command (Vitest or Playwright).

**Default on developer machines** (no `CI`, no `GITHUB_ACTIONS`): **local Convex backend**

1. One-time setup: select a local deployment, e.g. `npx convex deployment create local --select` (see [Convex local deployments](https://docs.convex.dev/cli/local-deployments)).
2. Each run: `convex dev --once` syncs functions and refreshes `.env.local`; the script reads `NEXT_PUBLIC_CONVEX_URL` and clears app data before tests.
3. No `CONVEX_DEPLOY_KEY` required for this path.

**CI and opt-in preview** (`CI=true`, `GITHUB_ACTIONS` set, or `CONVEX_TEST_USE_PREVIEW=1` locally): **cloud preview deployment**

- Runs `convex deploy --preview-name …`; uses [`scripts/write-convex-url.mjs`](scripts/write-convex-url.mjs) to capture the deployment URL.
- Requires a preview-capable `CONVEX_DEPLOY_KEY` in the environment or `.env.local` (the Convex CLI loads `.env.local` from the project directory).
- Requires `POSTHOG_PROJECT_TOKEN` on the preview deployment (`@posthog/convex` v2). New previews inherit [project defaults](https://docs.convex.dev/production/environment-variables#project-environment-variable-defaults) for the preview type (placeholder token unless you set GitHub secret `POSTHOG_PROJECT_TOKEN`). In GitHub Actions, the script deletes and recreates the PR preview each run so defaults apply; locally it only patches an existing preview.

Preview naming:

- Local machines using preview mode: `local-<user>-<git-branch>` (or override with `PREVIEW_DEPLOYMENT_NAME`)
- PR CI: `pr-<number>`
- Push CI: branch name via `PREVIEW_DEPLOYMENT_NAME`

Escape hatch: set `CONVEX_TEST_USE_PREVIEW=1` when you need to reproduce CI-style preview behavior locally.

### PR preview cleanup

[`.github/workflows/cleanup-convex-preview.yml`](../.github/workflows/cleanup-convex-preview.yml) deletes the cloud preview deployment when a pull request is closed or merged. It calls [`scripts/delete-convex-preview.mjs`](../scripts/delete-convex-preview.mjs) with the same preview name CI uses (`pr-<number>`).

One-time setup for the workflow:

1. In the [Convex dashboard](https://dashboard.convex.dev), create a **team access token** for the team that owns this project.
2. Add it to GitHub as repository secret `CONVEX_TEAM_ACCESS_TOKEN`.

Manual cleanup (same preview name as CI):

```bash
export CONVEX_TEAM_ACCESS_TOKEN='…'
PREVIEW_DEPLOYMENT_NAME=pr-123 node scripts/delete-convex-preview.mjs
```

Convex also expires unused preview deployments automatically (5 days on Free/Starter, 14 days on higher plans). The workflow removes them immediately when the PR ends.

## Typical Commands

Fast local validation:

```bash
pnpm lint
pnpm test
pnpm build
```

Backend / E2E on your machine (default: **local** Convex — fast, no preview deploy key):

```bash
pnpm test:backend
pnpm test:e2e
```

Force **cloud preview** locally (matches CI behavior; requires `CONVEX_DEPLOY_KEY` in the environment or `.env.local`):

```bash
CONVEX_TEST_USE_PREVIEW=1 pnpm test:backend
CONVEX_TEST_USE_PREVIEW=1 pnpm test:e2e
```

Full local validation including smoke suites:

```bash
pnpm test
pnpm test:vrt
pnpm test:backend
pnpm test:e2e
```

## Deterministic Tests

Deterministic tests replay a recorded game using the exact same player decisions and deck order. They verify that the game produces the same outcome from the same input without relying on randomness.

Fixtures and runners live in `tests/fixtures/deterministic/`. Local engine and Confect suites own deterministic behavior. Smoke tests should only keep deterministic setup coverage if it is needed to prove deployed wrapper/runtime wiring.
