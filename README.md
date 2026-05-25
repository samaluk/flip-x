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

4. Open `http://localhost:3000` and create a 3-player match.

## Testing

- Detailed reference: `docs/testing.md`
- `pnpm test`: fast local default. Runs the Vitest `unit`, `contract`, `integration`, and `confect` suites.
- `pnpm test:unit`: isolated logic and lightweight UI tests in `tests/unit/**` and `game/**/*.test.tsx`.
- `pnpm test:contract`: Vitest contract tests in `tests/contract/**`.
- `pnpm test:integration`: Vitest integration tests in `tests/integration/**`.
- `pnpm test:confect`: Node-based Confect tests in `tests/confect/**`.
- `pnpm test:backend`: Convex backend smoke tests in `tests/backend/**` (local backend by default; see `docs/testing.md`).
- `pnpm test:vrt`: visual regression tests with Vitest browser in Linux Docker.
- `pnpm test:vrt:update`: refresh visual regression baselines.
- `pnpm test:e2e`: Playwright end-to-end tests (uses the same Convex URL as backend smoke; local by default).

Tooling split:

- Vitest jsdom: `pnpm test`, `pnpm test:unit`, `pnpm test:contract`, `pnpm test:integration`
- Vitest node: `pnpm test:confect`, `pnpm test:backend`
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

- GitHub repository: `https://github.com/samaluk/flip7`
- Vercel project: `flip7` deploying from the `master` branch
- Convex production URL: `https://valuable-peacock-13.convex.cloud`
- Required Vercel environment variable: `NEXT_PUBLIC_CONVEX_URL`
- PostHog frontend environment variables: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- PostHog Convex environment variables: `POSTHOG_API_KEY`, `POSTHOG_HOST`
- PostHog source map upload environment variable: `POSTHOG_PROJECT_ID`; `POSTHOG_API_KEY` must be a personal API key with error tracking write access during the production build.
- Optional Convex feature-flag local evaluation variable: `POSTHOG_PERSONAL_API_KEY`

PostHog feature flag support is configured, but no feature flags are currently evaluated by the app.
