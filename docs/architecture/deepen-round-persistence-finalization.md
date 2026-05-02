# Deepen Round Persistence Finalization

## Goal

Separate round completion semantics from Convex write mechanics so persistence writes a complete outcome instead of deciding game outcome rules.

## Current Files

- `game/application/run-command.ts`
- `game/infrastructure/save-command-result.ts`
- `game/logic/round-finalization.ts`
- `game/infrastructure/round-history-builder.ts`
- `tests/unit/infrastructure/run-command-program.test.ts`
- `tests/confect/command-finalization.test.ts`
- `tests/backend/turns.test.ts`

## Problem

A completed round spans two concepts: gameplay finalization and database finalization. `run-command.ts` decides when to finalize a round, while `save-command-result.ts` decides how finalized data affects score breakdowns, player totals, match completion, winner flags, versioning, and round persistence.

That makes the persistence module carry game outcome rules like winner selection. The deletion test suggests the persistence module is earning its keep as a Convex adapter, but its interface is not deep enough because domain completion rules live inside the adapter.

## Desired Shape

Create a deeper round completion module that produces a complete round completion outcome before persistence. The persistence implementation should write that outcome, not decide it.

The outcome should describe:

- Final round runtime.
- Final player round states.
- Final round events.
- Score breakdowns.
- Score carry-forward for players.
- Whether the match is completed.
- Winner state, if any.
- Match patch data such as status, current round number, dealer seat, version, and updated time.

## Checklist

- [x] Read `docs/game-rules.md`, especially round end, scoring, target score, and winner rules.
- [x] Map every match completion rule currently inside `save-command-result.ts`.
- [x] Decide which rules belong in gameplay finalization versus persistence.
- [x] Create a domain-level completion outcome type.
- [x] Have `run-command.ts` or a nearby application module build the completion outcome.
- [x] Narrow `save-command-result.ts` so it writes the outcome and handles Convex document mechanics.
- [x] Keep score breakdown calculation out of Convex write code if it is part of the domain outcome.
- [x] Ensure version increments remain exactly once per accepted command.
- [x] Update unit tests to verify winner and score carry-forward without a Convex persistence fixture when possible.
- [x] Keep backend tests for persistence correctness.
- [x] Run `pnpm test:unit -- tests/unit/infrastructure/run-command-program.test.ts`.
- [x] Run `pnpm test:confect`.
- [x] Run `pnpm test`.

## Verification Questions

- [x] Can match completion be tested without inspecting Convex writes?
- [x] Does persistence still contain only adapter logic and write ordering?
- [x] Are winner and score carry-forward rules local to a domain/application module?
- [x] Did the persistence interface gain leverage by hiding more write details behind a smaller input?

## Progress Notes

- Match completion rules moved from `game/infrastructure/save-command-result.ts` into `game/application/round-completion.ts`: score breakdown calculation, player total carry-forward, target-score completion, unique winner selection, winner flags, and match completion patch data.
- Persistence now writes the completion outcome and still owns Convex mechanics: round creation/update, player state upserts, event sequencing, score breakdown rewrites, player document patches, match document patch, and ID mapping.
- Winner selection now follows `docs/game-rules.md`: the match completes only when there is one unique high scorer at or above the target. A high-score tie keeps the match in progress with no `hasWon` flags.
- The documented `pnpm test:unit -- tests/unit/infrastructure/run-command-program.test.ts` script is stale in this checkout (`test:unit` is not present). Equivalent focused verification was run with `pnpm exec vitest run --project infrastructure tests/unit/infrastructure/round-completion.test.ts tests/unit/infrastructure/run-command-program.test.ts`.
- `pnpm test:backend` could not run locally because `CONVEX_DEPLOY_KEY` is not available; local unit, Confect, full Vitest, and lint checks passed.
