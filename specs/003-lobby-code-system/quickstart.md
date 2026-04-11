# Quickstart: Lobby Code System

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

   ```bash
   CONVEX_AGENT_MODE=anonymous npx convex dev
   pnpm dev
   ```

3. Open the local app URL in at least two browser windows or devices.

## Core Validation Flow

### Create Game Flow

1. On the homepage, click "Create Game".
2. Enter 3-8 player names and claim your seat.
3. Verify a 4-character lobby code is displayed prominently.
4. Copy the lobby code or share the invite link.
5. Open the app in a new browser/device and verify you can:
   - Enter the code manually on the homepage to join, OR
   - Open the shared link and be taken directly to the lobby

### Join Lobby Flow

1. On the homepage, click "Join Lobby".
2. Enter the 4-character code.
3. Verify you are taken to the lobby with the code displayed.
4. Claim an available seat.

### Host Start Game Flow

1. As the host (the user who created the game), verify the "Start Game" button is visible.
2. Try clicking "Start Game" with fewer than 3 players - verify error message.
3. With at least 3 players, click "Start Game".
4. Verify the game transitions to in_progress and the first round begins.
5. Verify the "Start Game" button is no longer visible after game starts.

## Automated Checks

Run the local quality gates before opening a pull request:

```bash
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

## Performance Validation

1. Create a new game and verify the lobby code appears within 1 second.
2. Join a game by code and verify you reach the lobby within 1 second.
3. Start the game with 8 players and verify no additional loading delays.

## CI Expectation

GitHub Actions must pass install, lint, test, and build checks before the feature is
considered ready for review.