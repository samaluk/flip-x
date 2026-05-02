# Quickstart: Deterministic Game Test Scenarios

## Goal

Author a deterministic Flip7 scenario that can run in fast local tests and, for a smaller confidence slice, against the real Convex-backed smoke deployment (local backend by default).

## 1. Choose the replay scope

- Use `round` scope for targeted rule interactions or later-round bug reproduction.
- Use `match` scope for end-to-end scoring and winner reproduction.

## 2. Define the scenario input

Create a scenario fixture with:

- ordered players and seat indexes
- target score when replaying a full match
- full ordered deck sequence with stable card identity
- full start context for the chosen scope
- ordered explicit player decisions
- ordered expected step states

Minimum decision coverage:

- every `hit` or `stay`
- every Freeze target confirmation
- every Flip Three target confirmation
- target confirmations even when only one legal target exists

## 3. Add the scenario to the right test layer

- `tests/unit`: rules-engine edge cases and small deterministic sequences
- `tests/confect`: app-backend behavior, persisted state, and reusable scenario runner coverage
- `tests/backend`: a smaller confidence slice proving the deterministic path works against a real deployed Convex backend (local by default; see `docs/testing.md`)
- `tests/contract`: snapshot or replay-result shape checks if the contract changes

## 4. Run the fast local coverage first

```bash
pnpm test:unit
pnpm test:confect
pnpm test:contract
```

## 5. Run selective deployed-backend coverage

Default (local Convex — no deploy key):

```bash
pnpm test:backend
```

CI-style cloud preview (requires `CONVEX_DEPLOY_KEY`):

```bash
CONVEX_TEST_USE_PREVIEW=1 CONVEX_DEPLOY_KEY=... pnpm test:backend
```

## 6. Validate replay fidelity

For each deterministic scenario, confirm that:

- the same scenario reruns identically at least 10 times
- the replay matches every expected step state, not only the final result
- the first mismatch stops execution and produces a readable divergence report
- invalid or incomplete scripts fail before silently changing the game flow

## Example Authoring Checklist

1. Pick `round` or `match` scope.
2. Name players in seat order.
3. Capture the exact deck sequence.
4. Include later-round score and action context when replaying a mid-match round.
5. List every explicit player decision in order.
6. Record the canonical state after each decision.
7. Run the fast test layers before adding deployed-backend coverage.
