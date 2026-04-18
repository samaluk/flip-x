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

## Local development

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start the local Convex backend:

   ```bash
   CONVEX_AGENT_MODE=anonymous npx convex dev
   ```

3. Start the app:

   ```bash
   pnpm dev
   ```

4. Open `http://localhost:3000` and create a 3-player match.

## Quality checks

```bash
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

GitHub Actions runs install, Convex API generation, lint, test, and build on pushes and pull requests.

## Effect migration

- Incremental adoption notes live in `docs/effect-migration.md`.
- Early PRs are limited to `Config`, `Data.TaggedError`, `Effect.gen`, and `Effect.tryPromise`.
- Broad service/layer rollouts and Confect are intentionally deferred.

## Deployment

- GitHub repository: `https://github.com/samaluk/flip7`
- Vercel project: `flip7` deploying from the `master` branch
- Convex production URL: `https://valuable-peacock-13.convex.cloud`
- Required Vercel environment variable: `NEXT_PUBLIC_CONVEX_URL`
