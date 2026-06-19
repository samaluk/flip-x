# Implementation Plan: Deterministic Game Test Scenarios

**Branch**: `[004-deterministic-game-tests]` | **Date**: 2026-04-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-deterministic-game-tests/spec.md`

## Summary

Add deterministic scenario coverage for Flip7 by letting tests start from a fully controlled match or round context, inject an exact deck sequence, replay the full ordered record of explicit player decisions, and verify canonical step states until the first divergence. Keep the production gameplay flow unchanged by adding deterministic seams at round creation and reusing the existing turn and action resolution boundaries for scripted replay.

## Technical Context

**Language/Version**: TypeScript 6.0.3 on Node test runtimes, Next.js 16.2.4, React 19.2.5  
**Primary Dependencies**: Next.js, Convex 1.35.1, Confect 5.0.0, Effect 3.21.1, Vitest 4.1.4, Playwright 1.59.1  
**Storage**: Convex tables for matches, players, rounds, round player states, round events, and score breakdowns; repo fixtures for deterministic scenarios  
**Testing**: `pnpm test:unit`, `pnpm test:contract`, `pnpm test:confect`, selective `CONVEX_DEPLOY_KEY=... pnpm test:backend`  
**Target Platform**: Shared-table web app with Convex backend, local Node-based test runners, Linux/macOS CI environments  
**Project Type**: Web application with shared game engine logic and a serverless backend  
**Performance Goals**: Full-match deterministic replay completes within 10 seconds in the standard backend test environment; 10 reruns of the same scenario produce identical step states and outcomes; local deterministic unit and Confect tests remain suitable for the fast default suite  
**Constraints**: Preserve existing gameplay behavior for non-test flows; support both round and full-match replay scopes; require explicit scripted target confirmations even for single legal targets; preserve full card identity for deterministic decks; stop replay at the first divergence with a useful diff  
**Scale/Scope**: Current Flip7 rules for all supported player counts, including hit/stay turns, Freeze and Flip Three target confirmations, cumulative match scoring to 200, and later-round replay setup

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Code Quality**: Pass. The simplest viable design keeps `game/logic/turn-resolution.ts` as the core rules engine, adds deterministic setup inputs at round creation, and layers scenario authoring and replay helpers around existing boundaries in `confect/matches.ts`, `confect/rounds.ts`, `confect/turns.ts`, and `tests/**`. Avoid new gameplay-only abstractions unless a shared deterministic helper clearly reduces duplication across test layers.
- **Testing**: Pass. Add focused engine coverage in `tests/unit/turn-resolution.test.ts`, reusable scenario coverage in `tests/confect/**`, contract coverage if snapshot or replay result shapes change in `tests/contract/**`, and a smaller confidence slice in `tests/backend/**`. Failing behavior will be observed by adding deterministic scenario tests that initially fail against the current random round setup and missing replay support.
- **User Experience Consistency**: Pass. No end-user gameplay flow changes are planned. Developer-facing scenario names, replay results, and divergence messages should reuse existing match, round, player, and event terminology from snapshots and current test output. Success, validation failure, incomplete-input, and divergence result states are required for the test-facing scenario runner.
- **Performance**: Pass. Validate replay determinism by rerunning identical scenarios 10 times and confirming matching step states and final outcomes, while keeping a full-match backend replay under 10 seconds. Regression risk is low on production gameplay because deterministic setup remains opt-in for tests and keeps the normal shuffled path as the default.
- **Exceptions**: No constitution violations identified.

**Post-Design Re-Check**: Pass. The research, data model, contracts, and quickstart artifacts keep the design minimal, test-first, terminology-consistent, and aligned with the declared replay performance targets.

## Project Structure

### Documentation (this feature)

```text
specs/004-deterministic-game-tests/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── deterministic-scenario.md
│   └── replay-result.md
└── tasks.md
```

### Source Code (repository root)

```text
confect/
├── lib/
│   └── store.ts
├── match-snapshot-schema.ts
├── matches.ts
├── rounds.ts
└── turns.ts

convex/
└── schema.ts

game/
├── logic/
│   ├── card-types.ts
│   ├── turn-resolution.ts
│   └── view-models.ts
└── ui/

tests/
├── backend/
│   ├── convex-test-helper.ts
│   └── *.test.ts
├── confect/
│   ├── helpers.ts
│   └── *.test.ts
├── contract/
│   └── *.test.ts
└── unit/
    └── turn-resolution.test.ts
```

**Structure Decision**: Keep deterministic scenario authoring and replay support centered on the existing game engine and Confect boundaries. The primary implementation work should touch `game/logic/*` for deterministic round inputs and canonical replay state, `confect/*` for persisted setup and snapshot assembly, and `tests/*` for layered deterministic coverage.

## Complexity Tracking

No constitution violations identified.
