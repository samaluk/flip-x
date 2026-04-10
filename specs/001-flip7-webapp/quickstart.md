# Quickstart: Flip 7 Web App

## Prerequisites

- pnpm installed locally
- Convex project configured for development
- Environment values required by Next.js and Convex available locally

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start the Next.js app and Convex development environment in separate terminals.

3. Open the local app URL in at least two browser windows or devices to simulate a
   shared table.

## Core Validation Flow

1. Create a new match with 3 players.
2. Start the match and confirm the initial deal is visible to all participants.
3. Play until one player hits an action card and verify the UI explains the forced
   effect before the next player acts.
4. Continue until one player busts on a duplicate number and verify they are removed
   from active play for the round.
5. Complete the round and verify the score summary shows:
   - number-card total
   - multiplier effect when present
   - additive modifier bonuses
   - Flip 7 bonus when earned
6. Start the next round and confirm cumulative scores persist and dealer order rotates.
7. Refresh one browser window during a round and verify the latest committed state is
   restored without manual correction.

## Automated Checks

Run the local quality gates before opening a pull request:

```bash
pnpm lint
pnpm test
pnpm build
```

## Performance Validation

1. During local multi-player play, confirm normal Hit and Stay actions are reflected in
   the UI quickly enough to feel immediate to players.
2. Restore an existing match and confirm the app becomes playable without a long blank
   state.
3. Repeat a full round with 8 players and confirm score calculation and turn advancement
   remain clear and stable.

## CI Expectation

GitHub Actions must pass install, lint, test, and build checks before the feature is
considered ready for review.
