# Research: Deterministic Game Test Scenarios

**Date**: 2026-04-21

## Decision 1: Inject explicit deck order at round creation

- **Decision**: Make deterministic deck order a test input at round creation, with the full ordered draw pile supplied for deterministic scenarios and the existing shuffled deck path preserved as the default for normal gameplay.
- **Rationale**: `game/logic/card-types.ts` currently creates and shuffles the deck inside `createDeck()`, while `game/logic/turn-resolution.ts` consumes `drawPile` from `RoundRuntime`. Injecting the ordered draw pile at round creation is the smallest seam that makes tests reproducible without changing downstream turn logic.
- **Alternatives considered**: Seed-only shuffling was rejected because shuffle implementation or call-order changes would still break reproducibility. Overriding the deck later in persistence was rejected because it spreads deterministic setup across more layers.

## Decision 2: Reuse existing turn and action boundaries for scripted replay

- **Decision**: Represent replay as an ordered script of explicit player decisions and execute it through the existing `takeTurn` and `resolveAction` boundaries rather than introducing a separate replay-specific rules path.
- **Rationale**: `confect/turns.ts` already separates turn actions (`hit`, `stay`) from target confirmations (`resolveAction`) and persists the resulting state through the normal backend path. Reusing these boundaries keeps replay honest and minimizes duplicated gameplay logic.
- **Alternatives considered**: A custom replay interpreter that calls internal engine helpers directly was rejected because it would bypass the real backend boundary and lower confidence. UI-level replay through Playwright was rejected because it is slower and too noisy for broad deterministic coverage.

## Decision 3: Support both round and full-match scopes with full round context

- **Decision**: Use one scenario format that supports two entry scopes: full match from match setup and single round from a fully specified round context that can represent later-round conditions.
- **Rationale**: The spec requires both scopes, and current gameplay behavior depends on more than deck order. Dealer seat rotation, cumulative scores, pending actions, and carry-over round state can all affect later-round reproduction, so round-scope replay must carry full context instead of assuming a fresh opening round.
- **Alternatives considered**: Limiting support to full matches was rejected because it makes targeted defect reproduction slower. Limiting support to fresh rounds was rejected because it cannot reproduce later-round scoring and turn-order bugs.

## Decision 4: Verify replay fidelity step-by-step with canonical state

- **Decision**: Compare replayed games against expected canonical step states after each scripted decision and stop at the first mismatch with a targeted divergence report.
- **Rationale**: Final-outcome-only checks are too weak for debugging a turn-based card game. The existing snapshot-building seam in `confect/lib/store.ts` and `game/logic/view-models.ts` provides a natural foundation for canonical replay assertions, and the event stream in `roundEvents` can support precise step-level diagnostics.
- **Alternatives considered**: Final-outcome-only verification was rejected because it hides the first causal error. Comparing every internal engine field was rejected because it would overspecify hidden mechanics and make tests brittle.

## Decision 5: Keep most deterministic breadth in unit and Confect tests

- **Decision**: Put the broadest deterministic scenario matrix in `tests/unit` and `tests/confect`, then keep `tests/backend` limited to a smaller set of confidence scenarios proving the same hooks work against a real preview deployment.
- **Rationale**: The repo’s testing guidance treats `test:backend` as destructive and slower, while unit and Confect suites are the fast local default. This feature needs many precise replay cases, so the majority should live in the faster layers where iteration is cheaper.
- **Alternatives considered**: Concentrating all deterministic coverage in backend tests was rejected because it would slow feedback and increase preview deployment dependence. Using only unit tests was rejected because it would miss persisted-state and snapshot-boundary behavior.

## Decision 6: Preserve full card identity and version replay fixtures

- **Decision**: Deterministic scenarios should store full card identity in the deck sequence and include a rules or fixture version marker so older scenarios can be intentionally updated when game behavior changes.
- **Rationale**: Flip7 intentionally contains duplicate card labels and values, so replay cannot rely on labels alone. The current deck model already uses stable per-card ids, and fixture versioning provides a clear escape hatch when rules evolve.
- **Alternatives considered**: Label-only deck entries were rejected because duplicates would be ambiguous. Unversioned fixtures were rejected because they make it harder to distinguish intended rules changes from regressions.
