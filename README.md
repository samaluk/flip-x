# Flip 7

Flip 7 is a shared-table web app for playing the press-your-luck card game with live
turn tracking, action-card resolution, and automatic scoring to 200 points.

## Stack

- Next.js 16.2.3
- Tailwind CSS v4
- shadcn/ui
- Convex for database and functions
- Effect-TS for incremental typed config and error handling adoption
- Vitest for unit, contract, and integration tests
- Oxc for linting and formatting
- pnpm for package management
- GitHub Actions for CI

## Architecture

- Repo structure reference: `docs/repo-layout.md`
- Gameplay mutations flow through thin `confect/` entrypoints into `game/application/run-command.ts`.
- Pure rules stay in `game/logic/`, while `game/infrastructure/` owns Convex document loading, persistence, and snapshot rebuilding.

## Local development

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start Convex development sync:

   ```bash
   npx convex dev
   ```

3. Start the app:

   ```bash
   pnpm dev
   ```

4. Open `https://flip7.localhost` (via [portless](https://github.com/vercel/portless)) and create a 3-player match.

   To use plain localhost instead: `PORTLESS=0 pnpm dev` and open `http://localhost:3000`.

## Testing

- Detailed reference: `docs/testing.md`
- `pnpm test`: fast local default. Runs Vitest `engine`, `infrastructure`, `contract`, `ui`, and `confect` projects.
- `pnpm test:engine`: pure gameplay logic tests.
- `pnpm test:infra`: infrastructure boundary tests.
- `pnpm test:contract`: Vitest contract tests in `tests/contract/**`.
- `pnpm test:ui`: UI tests.
- `pnpm test:confect`: Node-based Confect tests in `tests/confect/**`.
- `pnpm test:backend`: Convex backend smoke tests in `tests/backend/**` (local backend by default; see `docs/testing.md`).
- `pnpm test:vrt`: visual regression tests with Vitest browser in Linux Docker.
- `pnpm test:vrt:update`: refresh visual regression baselines.
- `pnpm test:e2e`: Playwright end-to-end tests (uses the same Convex URL as backend smoke; local by default).

Tooling split:

- Vitest node: `pnpm test`, `pnpm test:engine`, `pnpm test:infra`, `pnpm test:contract`, `pnpm test:confect`, `pnpm test:backend`
- Vitest jsdom: `pnpm test:ui`
- Vitest browser: `pnpm test:vrt`
- Playwright: `pnpm test:e2e`

Backend and E2E (`pnpm test:backend`, `pnpm test:e2e`):

- **By default (your machine):** these use a **local** Convex deployment — run `npx convex deployment create local --select` once, then the test wrapper runs `convex dev --once` and reads `NEXT_PUBLIC_CONVEX_URL` from `.env.local`. No `CONVEX_DEPLOY_KEY` is required.
- **CI and optional local preview:** when `CI` / `GITHUB_ACTIONS` is set, or you set `CONVEX_TEST_USE_PREVIEW=1`, the wrapper deploys to a **cloud preview**; set `CONVEX_DEPLOY_KEY` (or use `.env.local` for the key). Preview names: `pr-<number>` in PR CI, `local-<user>-<git-branch>` for local preview mode, or override with `PREVIEW_DEPLOYMENT_NAME`.
- The wrapper clears all app data in the target deployment before running tests, so do not point it at a shared production deployment.

## Quality checks

```bash
pnpm design:lint
pnpm lint
pnpm test
pnpm build
```

## Gameplay validation

1. Create a match with 3 players.
2. Confirm the opening deal is visible.
3. Hit until an action card appears and verify the app waits for target selection when needed.
4. Continue until one player busts on a duplicate number.
5. Finish the round and verify the score breakdown values.
6. Start the next round and confirm cumulative scores persist.

## CI

GitHub Actions runs the fast Vitest suites, build, visual regression, backend tests, and E2E on pushes and pull requests using Convex preview deployments.

## Effect usage

- Confect is adopted for backend contracts and implementation wiring.
- Remaining Effect work is focused on service-boundary cleanup, typed error normalization, schema precision, and deterministic dependencies.
- Pure gameplay rules under `game/logic/` remain plain TypeScript.

## Deployment

Configure deployment in your Convex and Vercel dashboards:

- **Vercel:** set `NEXT_PUBLIC_CONVEX_URL` to your production Convex deployment URL.
- **Convex:** set backend env vars (`POSTHOG_PROJECT_TOKEN`, optional `POSTHOG_HOST`, etc.) with `npx convex env set`.
- **PostHog frontend (Vercel):** `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- **PostHog source maps (Vercel build):** `POSTHOG_PROJECT_ID`; `POSTHOG_API_KEY` must be a personal API key with error tracking write access.
- **Optional Convex-only feature flags:** `POSTHOG_PERSONAL_API_KEY`; `POSTHOG_FLAGS_POLLING_INTERVAL_SECONDS` (cron cadence in seconds, default `300`)

PostHog feature flag support is configured, but no feature flags are currently evaluated by the app.
