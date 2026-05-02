# Deepen Flip Three Module

## Goal

Make Flip Three progression a deeper module so callers do not need to coordinate deferred action cards, card countdown, abort conditions, completion events, and nested target action rules.

## Current Files

- `game/logic/command-handler.ts`
- `game/logic/apply-card.ts`
- `game/logic/flip-three.ts`
- `game/logic/action-resolution.ts`
- `tests/unit/engine/flip-three.test.ts`
- `tests/fixtures/deterministic/replay-scenarios.ts`

## Problem

Flip Three is a central game concept, but its implementation is split across turn execution, card application, deferred action handling, and target action resolution. The current modules are somewhat shallow: callers still need to know when Flip Three is active, when to decrement cards, when to discard deferred cards, when nested action cards resolve, and when turn advancement is allowed.

The deletion test points to real complexity: deleting `flip-three.ts` would not remove complexity; it would spread those rules back into command handling and card application.

## Desired Shape

Create a deeper Flip Three module whose interface represents the domain operation of advancing a pending Flip Three sequence. Its implementation should own:

- Detecting whether the current hit belongs to Flip Three.
- Counting drawn cards.
- Deferring Freeze and Flip Three cards drawn during the sequence.
- Keeping Second Chance behavior compatible with Flip Three rules.
- Discarding deferred cards when the target busts or flips 7.
- Resolving deferred Freeze and Flip Three cards in draw order when the sequence completes.
- Returning the next round/player state and emitted events.

Do not introduce a new seam with multiple adapters unless something actually varies. This can be a deeper module with internal helper functions.

## Checklist

- [x] Read `docs/game-rules.md`, especially the Flip Three section and edge cases.
- [x] Map every current Flip Three rule across `command-handler.ts`, `apply-card.ts`, `flip-three.ts`, and `action-resolution.ts`.
- [x] Identify the smallest interface that lets command handling say "advance this hit" without knowing deferred-card internals.
- [x] Move Flip Three progression logic behind that interface.
- [x] Keep card application responsible only for applying a drawn card to a player, unless the chosen interface deliberately includes card application.
- [x] Remove duplicated `isTargetActionCard` logic if the new module can own it cleanly.
- [x] Update unit tests to target the new module interface where useful.
- [x] Keep deterministic replay tests passing.
- [x] Run `pnpm exec vitest run --project engine tests/unit/engine/flip-three.test.ts`.
- [x] Run `pnpm test`.

## Verification Questions

- [x] Can a reader understand Flip Three behavior mostly from one module?
- [x] Can tests exercise Flip Three without manually coordinating `pendingFlip3` internals across multiple modules?
- [x] Does the module hide implementation details while preserving the existing game rules exactly?
- [x] Did locality improve for future Flip Three bug fixes?

## Progress Notes

- `pnpm test:unit -- tests/unit/engine/flip-three.test.ts` is stale in the current `package.json`; the focused equivalent is `pnpm exec vitest run --project engine tests/unit/engine/flip-three.test.ts`.
- Flip Three progression now lives behind `advanceFlip3Hit` in `game/logic/flip-three.ts`. `command-handler.ts` still owns drawing the card and turn advancement, while `apply-card.ts` still owns applying card effects; the Flip Three module owns countdown, abort cleanup, completion, deferred target-action tracking, and deferred action replay.
