# Testing

This repo uses multiple testing tools. Each suite has a specific scope and command.

## Fast local suites

`pnpm test` runs the fast local default:

- `pnpm test:unit`
- `pnpm test:contract`
- `pnpm test:integration`
- `pnpm test:confect`

These suites do not require a Convex preview deployment.

## Suite map

### Unit

- Command: `pnpm test:unit`
- Tool: Vitest with `jsdom`
- Scope: isolated logic and lightweight UI tests
- Paths:
  - `tests/unit/**`
  - `game/**/*.test.ts`
  - `game/**/*.test.tsx`

### Contract

- Command: `pnpm test:contract`
- Tool: Vitest with `jsdom`
- Scope: contract-level checks for stable app-facing shapes and behavior
- Paths:
  - `tests/contract/**`

### Integration

- Command: `pnpm test:integration`
- Tool: Vitest with `jsdom`
- Scope: component and app-level integration tests
- Paths:
  - `tests/integration/**`

### Confect

- Command: `pnpm test:confect`
- Tool: Vitest with `node`
- Scope: Confect-backed server-side tests
- Paths:
  - `tests/confect/**`

### Backend

- Command: `pnpm test:backend`
- Tool: Vitest with `node`
- Scope: Convex backend integration tests against a real preview deployment
- Paths:
  - `tests/backend/**`

This suite is destructive for its target deployment. It clears all app data between tests.

### Visual regression

- Command: `pnpm test:vrt`
- Update baselines: `pnpm test:vrt:update`
- Tool: Vitest browser with Playwright provider, executed in Linux Docker
- Scope: screenshot-based visual regression tests

### End-to-end

- Command: `pnpm test:e2e`
- Tool: Playwright
- Scope: full user flows against the running app and Convex preview backend
- Paths:
  - `e2e/**`

## Preview-backed suites

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

## Typical commands

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

## Deterministic tests

Deterministic tests replay a recorded game using the exact same player decisions and deck order. They verify that the game produces the same outcome from the same input without relying on randomness.

### When to use

- Reproduce a bug with a specific player order and deck sequence
- Verify scoring or winner logic for a known game outcome
- Create regression tests for rule interactions
- Document edge case behavior

### Writing a deterministic scenario

1. **Define players in seat order**: list the player names that will occupy seats 0-N.

2. **Capture the deck**: record the exact card sequence from the draw pile. Cards are identified by rank and suit (e.g., `"7♥"`, `"A♠"`).

3. **Script decisions**: for each turn that requires a player choice, record:
   - `hit` or `stay`
   - Freeze target confirmation (when the active player plays Freeze)
   - Flip Three target confirmation (when the active player plays Flip Three)

4. **Record step states**: after each decision, capture the canonical game state (active player, round status, hands, scores).

### Available helpers

Fixtures and runners are in `tests/fixtures/deterministic/`:

- `scenario-types.ts`: type definitions for deterministic scenarios
- `setup-scenarios.ts`: round and match setup fixtures
- `replay-scenarios.ts`: full replay scenarios with decisions and expected states
- `divergence-scenarios.ts`: mismatch and invalid script fixtures
- `scenario-runner.ts`: runs a deterministic scenario against a test harness
- `replay-assertions.ts`: verifies step states and reports divergence

### Running deterministic tests

```bash
pnpm test:unit
pnpm test:confect
pnpm test:contract
```

For preview-backed coverage:

```bash
CONVEX_DEPLOY_KEY=... pnpm test:backend
```

### Validating replay fidelity

Each deterministic scenario should:

- Run identically at least 10 times in a row
- Match every expected step state, not only the final result
- Stop at the first mismatch with a readable divergence report
- Fail cleanly for invalid or incomplete scripts
