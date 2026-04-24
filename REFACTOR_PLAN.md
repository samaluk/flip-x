# Flip 7 Game Engine Refactor Plan

## Executive Summary

The codebase has **strong architectural foundations** and requires **medium-effort incremental refactoring**—not a rewrite. The central seam (`runGameCommand` in `run-command.ts`) is well-designed. The remaining work is modularization, deterministic RNG, stronger types, event hygiene, and Flip Three clarity.

**Expected duration**: 6–8 focused PRs over 2–3 weeks.  
**Risk level**: Low–Medium (tests are comprehensive, behavior should be preserved).  
**Target state**: Align with `/docs/architecture.md` and `/docs/game-rules.md`.

---

## Current Architecture Assessment

### ✅ What's Working Well

1. **Centralized command execution**: `runGameCommand` in `run-command.ts` is the single entry point for all player actions.
   - Single mutation boundary.
   - Clean abstraction: load aggregate → call engine → save result → return snapshot.
   - Deterministic seed support already in place for testing.

2. **Clean separation of concerns**:
   - `game/logic/` contains pure gameplay rules with no Convex imports.
   - `game/infrastructure/` handles persistence, normalization, and snapshots.
   - `game/application/` orchestrates commands.
   - `confect/` owns the Convex schema and function wiring.

3. **Comprehensive test coverage**:
   - Unit tests for turn resolution and scoring.
   - Deterministic replay tests with fixed decks.
   - Confect contract tests.
   - Integration tests.
   - Fixtures for scenario-based testing.

4. **Event log foundation**:
   - `RoundEvent[]` is already used throughout.
   - Events are persisted in `roundEvents` table.
   - Can be evolved into a strongly-typed discriminated union.

5. **Good domain terminology**:
   - Player round states: `waiting`, `active`, `stayed`, `busted`, `frozen`, `completed`.
   - Phases: `dealing`, `player_turns`, `resolving_action`, `scoring`, `completed`.
   - Pending actions for Freeze and Flip Three.

### ⚠️ Weak Points & Risks

1. **Monolithic `turn-resolution.ts` (903 lines)**:
   - All rules (draw, card application, action resolution, Flip Three, busting, scoring) in one file.
   - Hard to reason about edge cases (especially Flip Three).
   - Large function bodies with nested logic.
   - No clear mental model for Flip Three state machine.

2. **Weakly-typed events**:
   - `RoundEvent` uses `eventType: string` and generic `payload: Record<string, unknown>`.
   - No TypeScript exhaustiveness checking.
   - Unsafe field access in `round-event-format.ts` (defensive type coercion everywhere).
   - No schema validation on roundEvents table.

3. **Deterministic RNG is implicit**:
   - `Math.random()` is hardcoded in `card-types.ts:shuffle()`.
   - Deterministic tests must inject a full `drawPile` via `deterministicStart`.
   - No injectable RNG service; no pluggable shuffle for future production randomness or seeding.

4. **No version/idempotency tracking**:
   - Commands are not versioned or idempotency-keyed.
   - No protection against stale UI state (if client retries a command after state changed).
   - No explicit version check in mutations.

5. **Flip Three behavior ambiguity**:
   - Current implementation requires manual "hit" clicks for each draw inside Flip Three.
   - Unclear if this matches the official rule ("draw up to three cards one at a time").
   - Tests may diverge from game rules; needs clarification.
   - Deferred action card handling is complex; unclear if correct.

6. **No explicit domain errors**:
   - Errors are thrown as generic domain exceptions.
   - No typed `Either<Error, Result>` pattern (despite Effect being available).
   - Hard to distinguish recoverable from unrecoverable failures on the client.

7. **Snapshot/persistence logic is interleaved**:
   - Player state serialization is scattered across `save-command-result.ts` and `snapshot-store.ts`.
   - Normalization/denormalization happens in two places.
   - No single source of truth for field mapping.

8. **No integration tests that exercise the full Convex mutation path**:
   - Deterministic tests are unit-level (pure functions).
   - Backend tests run Convex but may not catch serialization mismatches.
   - E2E tests exist but are minimal.

---

## Target Architecture

The goal state aligns with `/docs/architecture.md`:

```
apps/web/                          # Next.js 16 client
  components/game/
  hooks/useGameCommand.ts

game/                               # Pure game logic (no Convex)
  application/
    run-command.ts                  # Single command entry point
    game-command.ts                 # Command types + schemas
  logic/
    card-types.ts                   # Card definitions + deterministic shuffle
    round-state.ts                  # RoundRuntime, PlayerRoundState types
    draw.ts                         # Draw logic
    apply-card.ts                   # Number, modifier, action card application
    action-resolution.ts            # Freeze, Second Chance resolution
    flip-three.ts                   # Flip Three state machine
    turn-order.ts                   # Active player tracking + turn advancement
    round-finalization.ts           # Scoring + round-end logic
    events.ts                       # Strongly-typed GameEvent union
    view-models.ts                  # Client snapshot projection
  infrastructure/
    load-match-aggregate.ts         # Load match + latest round + player states
    save-command-result.ts          # Persist transition atomically
    snapshot-store.ts               # Normalize/denormalize player states

confect/
  schema.ts                         # Authoritative Convex schema
  turns.impl.ts                     # Mutation implementations (thin wrappers)
  lib/                              # Session, rate limit, persistence helpers

convex/                             # Convex functions + generated code
```

Key principles:
- **Game engine is deterministic**: fixed deck + command sequence → same state always.
- **Single atomic transition**: one command → one `GameTransition` (state + events).
- **Events are strongly typed**: discriminated union, no `Record<string, unknown>`.
- **RNG is injectable**: shuffle can use a provided RNG or Math.random() by default.
- **Idempotency is explicit**: command includes `expectedVersion` + `idempotencyKey`.
- **Convex is thin**: schema validation, session auth, persistence only.
- **Turn order is clear**: only "active" players are asked for actions; frozen/stayed/busted are out.

---

## Proposed PR Sequence

### PR 1: Extract and split `turn-resolution.ts` (No Behavior Change)

**Goal**: Modularize the 903-line file into focused rule modules without altering behavior.

**Files to create**:
- `game/logic/round-state.ts` — `RoundRuntime`, `PlayerRoundState` type definitions.
- `game/logic/draw.ts` — `drawCard()`, deck/discard pile management.
- `game/logic/apply-card.ts` — `applyCardToPlayer()`, number/modifier/action card logic.
- `game/logic/action-resolution.ts` — Freeze + Second Chance resolution, `createPendingTargetAction()`.
- `game/logic/flip-three.ts` — Flip Three state machine: `isFlip3ActiveForPlayer()`, deferred card logic.
- `game/logic/turn-order.ts` — `nextActiveSeatIndex()`, active player tracking.
- `game/logic/round-finalization.ts` — `finalizeRound()`, end-of-round scoring.
- `game/logic/command-handler.ts` — `continueRound()`, `takeTurnAction()`, `resolvePendingAction()`.

**Files to modify**:
- `game/logic/turn-resolution.ts` — Become a re-export barrel; preserve all exports.
- `game/application/run-command.ts` — Update imports; no behavior change.
- `tests/unit/turn-resolution.test.ts` — Update imports; all tests should still pass.

**Test strategy**:
- Run all existing tests; must pass with zero behavior change.
- Add module-level tests as you extract (e.g., `draw.test.ts`, `action-resolution.test.ts`).

**Commands**:
```bash
pnpm lint
pnpm test
pnpm test:backend
```

**Expected changes**:
- **No** public API changes.
- **No** game behavior changes.
- **No** DB schema changes.
- Tests should all pass.

**Risks**:
- Circular dependencies if modules reference each other. Resolve by clearly modeling dependencies:
  - `draw.ts` depends on `round-state.ts` only.
  - `apply-card.ts` depends on `round-state.ts`, `draw.ts`, possibly `action-resolution.ts`.
  - `action-resolution.ts` depends on `round-state.ts`, `apply-card.ts`.
  - `flip-three.ts` is a consumer, not a dependency of `apply-card.ts`.
  - Establish a clear call hierarchy and stick to it.

**Open questions**:
- How deep should the `apply-card.ts` function be? It currently handles number, modifier, and action cards. Should it be split further (e.g., `apply-number-card.ts`, `apply-modifier-card.ts`, `apply-action-card.ts`)? **Defer to after PR 1 is merged.**

---

### PR 2: Introduce Strongly-Typed Events

**Goal**: Replace `RoundEvent { eventType: string; payload: Record<string, unknown> }` with a discriminated union.

**Current event types** (from code + usage):
```
initial_deal, hit, flip3_hit, stay, number_drawn, modifier_drawn,
second_chance_held, second_chance_passed, second_chance_discarded, second_chance_used,
duplicate_bust, flip7, freeze_applied, flip_three_targeted, flip3_completed, deferred_action,
pending_action, round_scored
```

**Target shape**:
```typescript
type GameEvent =
  | { type: "InitialDeal"; playerId: PlayerId; card: Card }
  | { type: "Hit"; playerId: PlayerId; card: Card }
  | { type: "Flip3Hit"; playerId: PlayerId; card: Card }
  | { type: "Stay"; playerId: PlayerId }
  | { type: "NumberDrawn"; playerId: PlayerId; numberValue: number }
  | { type: "ModifierDrawn"; playerId: PlayerId; modifierValue: ModifierValue }
  | { type: "SecondChanceHeld"; playerId: PlayerId }
  | { type: "SecondChancePassed"; fromPlayerId: PlayerId; toPlayerId: PlayerId }
  | { type: "SecondChanceDiscarded"; playerId: PlayerId }
  | { type: "SecondChanceUsed"; playerId: PlayerId; duplicateNumber: number }
  | { type: "DuplicateBust"; playerId: PlayerId; duplicateNumber: number }
  | { type: "Flip7"; playerId: PlayerId }
  | { type: "FreezeApplied"; sourcePlayerId: PlayerId; targetPlayerId: PlayerId }
  | { type: "Flip3Targeted"; sourcePlayerId: PlayerId; targetPlayerId: PlayerId; cardsRemaining: number }
  | { type: "Flip3Completed"; playerId: PlayerId }
  | { type: "DeferredAction"; playerId: PlayerId; actionKind: ActionKind }
  | { type: "PendingAction"; sourcePlayerId: PlayerId; actionKind: ActionKind }
  | { type: "RoundScored"; playerId: PlayerId; finalRoundScore: number }
```

**Files to create**:
- `game/logic/events.ts` — Define `GameEvent` discriminated union + validation schema.

**Files to modify**:
- `game/logic/turn-resolution.ts` (or split modules) — Use `GameEvent` instead of `RoundEvent`.
- `game/application/run-command.ts` — Handle typed events.
- `game/infrastructure/save-command-result.ts` — Serialize `GameEvent` to persisted format.
- `confect/schema.ts` — Add Effect Schema for `GameEvent` validation.
- `game/logic/round-event-format.ts` — Update formatters to use typed events (no defensive coercion).
- `tests/unit/*.test.ts` — Update event assertions.

**Confect/Convex schema migration**:
- `roundEvents` table currently stores `{ eventType: string; payload: JSON }`.
- **Option A (recommended)**: Keep the persisted format; convert at boundaries (similar to normalization).
  - Encode: `GameEvent → { eventType, payload }`.
  - Decode: `{ eventType, payload } → GameEvent` with Effect Schema validation.
  - Preserves backward compatibility; old events remain queryable.
- **Option B**: Migrate schema to store `GameEvent` directly.
  - Requires a Confect migration script.
  - Riskier; old events are hard to query.

**Recommend Option A**: encode/decode at game/infrastructure boundary.

**Test strategy**:
- All existing tests should still pass (migration is internal).
- Add new tests for event decoding/encoding round-trips.
- Event format tests in `round-event-format.ts` should have no defensive type coercion.

**Commands**:
```bash
pnpm lint
pnpm test
pnpm test:backend
```

**Expected changes**:
- **No** public API changes.
- **No** game behavior changes.
- **No** DB schema changes (internal serialization only).
- Events are now type-safe; `round-event-format.ts` is simpler.

**Risks**:
- Exhaustiveness checking will reveal untested event paths. Fix them.
- Serialization bugs if encode/decode not tested thoroughly.

**Open questions**:
- Should player IDs in events be `string` (runtime) or `Id<"players">` (persisted)? **Keep them as `string` in the domain; convert in persistence layer.**

---

### PR 3: Inject Deterministic RNG (No Behavior Change)

**Goal**: Make shuffle deterministic and injectable, removing hardcoded `Math.random()`.

**Current state**:
- `card-types.ts:shuffle()` uses `Math.random()`.
- Tests inject a pre-built `drawPile` via `deterministicStart.roundSeed.drawPile`.
- No way to seed RNG or to mock it in production.

**Target state**:
- Define `RngService` interface: `shuffle<T>(items: readonly T[]): T[]`.
- Provide `FixedRng` for tests (always returns the same shuffle).
- Provide `ProductionRng` (uses `Math.random()` by default, optionally seeded).
- Inject RNG into `createDeck()` and other shuffle operations.
- Use Effect Layers to wire services.

**Files to create**:
- `game/logic/rng.ts` — `RngService` interface + implementations (`FixedRng`, `ProductionRng`).

**Files to modify**:
- `game/logic/card-types.ts` — Accept RNG in `createDeck()`, `shuffle()`.
- `game/logic/round-state.ts` — Pass RNG to `createDeck()`.
- `game/application/run-command.ts` — Provide RNG service (or use default).
- `tests/fixtures/deterministic/*.ts` — Update to use FixedRng (no behavior change, just explicit).

**Example**:
```typescript
// game/logic/card-types.ts
export function createDeck(rng?: RngService): Card[] {
  const cards = buildOrderedDeck();
  const actualRng = rng ?? defaultRng; // defaultRng uses Math.random()
  return actualRng.shuffle(cards);
}

// In tests:
const fixedRng: RngService = {
  shuffle: (items) => items, // No-op for deterministic deck
};
const deck = createDeck(fixedRng);
```

**Test strategy**:
- All existing tests should pass with zero behavior change.
- Add tests for `FixedRng` and `ProductionRng`.
- Verify that deterministic replay tests still work (they already inject drawPile, so RNG becomes a no-op).

**Commands**:
```bash
pnpm lint
pnpm test
pnpm test:backend
```

**Expected changes**:
- **No** public API changes (RNG is optional; defaults to `Math.random()`).
- **No** game behavior changes.
- **No** DB schema changes.
- Tests can now use injectable RNG.

**Risks**:
- Low. RNG injection is internal; external tests don't care.

---

### PR 4: Add Command Versioning & Idempotency (Behavior Change: New Fields)

**Goal**: Protect against stale UI commands, duplicate clicks, and client retries.

**Target shape**:
```typescript
type GameCommand =
  | {
      type: "START_MATCH";
      expectedVersion: number;
      idempotencyKey: string;
      deterministicStart?: { roundSeed: { drawPile: Card[] } };
    }
  | {
      type: "START_NEXT_ROUND";
      expectedVersion: number;
      idempotencyKey: string;
      deterministicStart?: { roundSeed: { drawPile: Card[] } };
    }
  | {
      type: "TAKE_TURN";
      expectedVersion: number;
      idempotencyKey: string;
      action: "hit" | "stay";
    }
  | {
      type: "RESOLVE_ACTION";
      expectedVersion: number;
      idempotencyKey: string;
      targetPlayerId: string;
    };
```

**Versioning strategy**:
- Store `version: number` on the `matches` document (incremented on each transition).
- `expectedVersion` is the version the client saw when it issued the command.
- If client's `expectedVersion` doesn't match current version, throw `StaleGameState`.
- This prevents a client from acting on stale state.

**Idempotency strategy**:
- Create an `idempotencyKeys` table: `{ idempotencyKey: string; commandResult: GameTransition; expiresAt: number }`.
- On each command, check if `idempotencyKey` already exists.
- If yes, return the cached result (re-run snapshots, but don't re-execute the game engine).
- If no, execute normally, store result, and set expiration (e.g., 5 minutes).

**Files to create**:
- `confect/idempotency.ts` — Idempotency key helpers + helpers for version checks.

**Files to modify**:
- `game/application/game-command.ts` — Add `expectedVersion`, `idempotencyKey` to all commands.
- `game/application/run-command.ts` — Check version and idempotency before executing.
- `confect/schema.ts` — Add `IdempotencyKey` table; add `version` field to `Matches`.
- `confect/turns.impl.ts` (or equivalent) — Wrap command execution with idempotency check.
- Frontend client: Include `expectedVersion` and `idempotencyKey` in mutations.

**Test strategy**:
- Add tests for stale version rejection.
- Add tests for idempotent re-runs (same `idempotencyKey` returns same result).
- Ensure deterministic replay tests still work.

**Commands**:
```bash
pnpm lint
pnpm test
pnpm test:backend
```

**Expected changes**:
- Frontend code must start including `expectedVersion` and `idempotencyKey`.
- Commands will fail with `StaleGameState` if version is stale.
- Clients can safely retry without creating duplicates.
- DB schema: new `idempotencyKeys` table; new `version` field on `matches`.

**Risks**:
- Frontend must be updated to provide version + idempotency key, or commands will fail.
- Idempotency key expiration must be tuned.

**Open questions**:
- Should idempotency keys expire? **Yes, after 5 minutes (configurable).**
- How is `expectedVersion` initialized? **Match `matches.version` at load time.**

---

### PR 5: Clarify & Fix Flip Three Behavior (Possible Behavior Change)

**Goal**: Clarify whether Flip Three draws automatically (once target is chosen) or requires manual hits.

**Current implementation**:
- `pendingFlip3` is set when Flip Three is dealt.
- Player targets someone.
- Player must then **manually click "hit"** for each of the up-to-3 cards.
- Each hit decrements `cardsRemaining`.

**Official rules** (from `docs/game-rules.md`):
- "The player who is dealt Flip Three chooses any active player... That target **draws up to three cards, one at a time**."
- Implies automatic drawing (no manual hit clicks needed).
- "Every drawn card counts toward the three-card total" (modifier, action, Second Chance).
- "If the target **busts before three cards are drawn, stop immediately**."
- "If the target **flips 7 before three cards are drawn, stop immediately** and end the round."

**Question**: Does "draws one at a time" mean:
- (A) Automatic: `resolvePendingAction(targetId)` → engine draws up to 3 cards automatically, stopping on bust/flip7/complete → new phase.
- (B) Manual: `resolvePendingAction(targetId)` → set `pendingFlip3`; player must then click "hit" three times (or until bust/flip7).

**Current code implements (B)**. **Rules suggest (A)**.

**Recommendation**:
1. **Confirm the intended behavior** with product owner or game rules document.
2. **If behavior change needed**, refactor Flip Three resolver:
   - `resolvePendingAction()` with Flip Three target → automatically draw up to 3 cards → handle deferred Freeze/Flip Three → return to turn phase automatically.
   - No more manual "hit" clicks during Flip Three.
   - `pendingFlip3` state is used only for tracking, not blocking turns.

**Files to modify** (if behavior change):
- `game/logic/flip-three.ts` — New `resolveFlip3(target)` function that draws up to 3 cards in a loop.
- `game/logic/turn-resolution.ts` — Update `resolvePendingAction()` to call new resolver.
- `tests/confect/turns.test.ts` — Update Flip Three test expectations.
- `tests/fixtures/deterministic/*.ts` — Update scenario assertions.

**Test strategy**:
- If behavior changes, deterministic tests will break. Fix them to match new behavior.
- Add new tests for the three-card draw loop: bust mid-draw, flip7 mid-draw, successful draw of 3.
- Test deferred action card resolution after Flip Three completes.

**Commands**:
```bash
pnpm lint
pnpm test
pnpm test:backend
```

**Expected changes**:
- Possible: Flip Three resolves without manual hit clicks (behavior change).
- DB schema: No changes (same `pendingFlip3` structure).
- Tests: May fail if behavior changes; must be fixed.

**Risks**:
- High if behavior change is incompatible with current UI assumptions (e.g., frontend expects manual hits).
- Medium if tests rely on manual hit behavior.

**Critical: Must clarify intent before implementation.**

---

### PR 6: Improve Snapshot & Persistence Schema Clarity (No Behavior Change)

**Goal**: Consolidate serialization logic and ensure a single source of truth for field mapping.

**Current state**:
- `save-command-result.ts` has `serializeRoundRuntime()`, `persistRoundRuntime()`, `persistPlayerStates()`.
- `snapshot-store.ts` has `normalizeRoundRuntime()`, `normalizePlayerRoundState()`.
- Mapping logic is duplicated; easy to desynchronize.

**Target state**:
- Create a single `Serializers` module: define codec/adapter functions for each type.
- Use consistent bidirectional encode/decode.
- Document the mapping in one place.
- Make persistence logic in `save-command-result.ts` thinner (just call serializers).

**Files to create**:
- `game/infrastructure/serializers.ts` — Codecs for `RoundRuntime`, `PlayerRoundState`, `GameEvent`, etc.

**Files to modify**:
- `game/infrastructure/save-command-result.ts` — Use serializers from new module.
- `game/infrastructure/snapshot-store.ts` — Use serializers from new module.
- `confect/schema.ts` — Document the mapping with references to serializers.

**Test strategy**:
- Existing tests should pass.
- Add round-trip tests: serialize → deserialize → assert equality.

**Commands**:
```bash
pnpm lint
pnpm test
pnpm test:backend
```

**Expected changes**:
- **No** behavior changes.
- **No** DB schema changes.
- Code clarity and maintainability improve.

**Risks**:
- Low if serializers are tested thoroughly.

---

### PR 7: Optional – Package Extraction (Defer Until Later)

**Goal** (optional): Extract `game/` into `packages/flip7-engine` for reusability and clearer boundaries.

**Recommend deferring** until PR 1–6 are merged and boundaries are proven solid.

**When to extract**:
- If you want to:
  - Reuse the engine in another client (mobile, CLI, etc.).
  - Publish the engine as a separate package.
  - Enforce strict boundaries between engine and application code.

**How to extract** (sketch):
```bash
mkdir packages/flip7-engine
mv game/logic packages/flip7-engine/src/
mv game/application packages/flip7-engine/src/
# game/infrastructure stays in the app (tightly coupled to Convex schema)
```

Then:
- Import engine from `@flip7/engine` in the app.
- Establish a clear interface boundary (e.g., `export { runGameCommand }` from engine).

**Not recommended** for PR 7 if:
- Boundaries are still uncertain.
- The app is the only consumer.
- Engineering effort is better spent elsewhere.

---

## Testing Strategy

### Unit Tests (`tests/unit/`)
- Pure function tests: scoring, turn order, draw logic.
- Test individual rule modules in isolation.
- Use deterministic fixtures.

### Confect Contract Tests (`tests/confect/`)
- Test Convex function signatures + authorization.
- Verify idempotency and versioning.
- Test serialization round-trips.

### Backend Tests (`tests/backend/`)
- Test persistence: does state round-trip through Convex?
- Test concurrent mutations (if applicable).

### Integration Tests (`tests/integration/`)
- Test full game flows (deal, turn, action, round end).
- Verify snapshot projection.
- Test player perspective (hidden information).

### E2E Tests (if present)
- Playwright browser tests for UI + Convex mutations.
- Keep minimal; focus on happy paths.

### Deterministic Replay Tests
- **Crucial**: Given fixed deck + command sequence, verify final state matches.
- Test every edge case: Flip Three, nested Freeze, Second Chance, etc.
- These tests are your regression safety net.

---

## Verification Baseline

After each PR, run:

```bash
# Code quality
pnpm lint

# Type safety
pnpm type-check  # (if tsconfig strict is enabled)

# Unit + confect tests
pnpm test

# Backend + deterministic tests
pnpm test:backend

# Optional: E2E tests
pnpm test:e2e

# Build
pnpm build
```

All must pass before merging.

---

## Risk Mitigation

### Risk: Circular Dependencies in Modular Rules
**Mitigation**:
- Define a clear call hierarchy before extracting (see PR 1).
- Enforce it with import linting or module boundaries.
- Keep most functions pure; data flows one way.

### Risk: Event Serialization Breaks Backward Compatibility
**Mitigation**:
- Use encode/decode pattern (PR 2) to decouple domain events from persisted format.
- Keep old events in the DB; decode them on read.
- Test event round-trips thoroughly.

### Risk: Stale Version Handling Breaks the Client
**Mitigation** (PR 4):
- Client must handle `StaleGameState` error.
- Client reloads the snapshot before retrying.
- Include explicit test for stale version rejection.

### Risk: Flip Three Behavior Change Breaks UI Assumptions
**Mitigation** (PR 5):
- **Clarify intent first**. Do not code before confirmation.
- Update tests and fixtures **before** implementation.
- Consider feature flag if behavior change is risky.

### Risk: Serialization Schema Divergence
**Mitigation** (PR 6):
- Consolidate serializers early.
- Write round-trip tests.
- Add assertions in load-save tests to catch divergence.

---

## Timeline Estimate

| PR | Title | Effort | Duration |
|---|---|---|---|
| 1 | Extract turn-resolution.ts | 2–3 days | 1 week |
| 2 | Strongly-typed events | 2–3 days | 1 week |
| 3 | Inject deterministic RNG | 1 day | 2–3 days |
| 4 | Versioning & idempotency | 2–3 days | 1 week |
| 5 | Flip Three clarification + fix | 1–2 days (or 3–5 if behavior change) | 1–2 weeks |
| 6 | Snapshot/persistence consolidation | 1 day | 2–3 days |
| 7 | Package extraction (optional) | 1–2 days | 1 week |

**Total**: 6–8 weeks if all PRs are sequential. Can parallelize tests while waiting for review.

---

## Open Questions Before Implementation

1. **Flip Three behavior**: Does target draw automatically (A) or require manual hits (B)?
2. **Error handling**: Should client use `Either<Error, Result>` (Effect style) or exceptions?
3. **RNG seeding**: Should production code ever accept a seeded RNG, or only tests?
4. **Idempotency key generation**: Where is the key generated? Client or server?
5. **Feature flags**: If Flip Three behavior changes, should it be gated by a flag?
6. **Schema versioning**: Does Confect support migrations? If so, what's the process?

---

## Success Criteria

After all PRs are merged:

✅ All tests pass (unit, confect, backend, integration, e2e).
✅ Code is type-safe (no `Record<string, unknown>`; discriminated unions for events).
✅ Rules are modularized (each file ≤200 lines; single responsibility).
✅ Flip Three behavior matches official rules (or is explicitly redocumented).
✅ Commands are versioned and idempotent (client can safely retry).
✅ RNG is injectable for testing.
✅ Architecture aligns with `/docs/architecture.md`.
✅ Game rules align with `/docs/game-rules.md`.
✅ Codebase is maintainable (future rule changes are < 1 day each).
