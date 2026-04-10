# Implementation Plan: Flip 7 Web App

**Branch**: `001-flip7-webapp` | **Date**: 2026-04-10 | **Spec**: [`spec.md`](./spec.md)
**Input**: Feature specification from `/specs/001-flip7-webapp/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a real-time web app for playing Flip 7 that supports full round flow, multi-round
scorekeeping to 200 points, and transparent rule explanations. The implementation will
use a single Next.js application with Convex as the authoritative real-time game state,
shared UI primitives from shadcn/ui, and a dedicated rule engine exercised through
Vitest unit, integration, and regression coverage.

## Technical Context

**Language/Version**: TypeScript on Next.js 16.2.3  
**Primary Dependencies**: Next.js 16.2.3, React 19, Tailwind CSS v4, shadcn/ui,
Convex, Vitest, React Testing Library, Oxc  
**Storage**: Convex database for match, round, player, and event state  
**Testing**: Vitest for unit, integration, rule-regression, and UI interaction tests  
**Target Platform**: Responsive web browsers on desktop and mobile  
**Project Type**: Single-project web application with real-time backend functions  
**Performance Goals**: 95% of turn actions reflected in the UI within 1 second; match
load or restore playable within 3 seconds; support up to 8 players per match  
**Constraints**: Use pnpm for package management; use Oxc for linting and formatting;
use GitHub Actions for CI; keep game rules deterministic and server-authoritative;
preserve a single shared-table UX across screen sizes  
**Scale/Scope**: 1 shared game application, 3-8 players per match, full match flow to
200 points, no AI opponents or matchmaking in v1

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Code Quality**
  Pre-Research: Pass. The design stays minimal with one Next.js app, one Convex
  backend, and a dedicated rule engine isolated from presentation so rule complexity
  does not leak across UI code.
  Post-Design: Pass. Data boundaries are explicit across `app/`, `components/`,
  `convex/`, and `lib/game`, with contracts and state models documented.
- **Testing**
  Pre-Research: Pass. The plan includes Vitest unit tests for rule evaluation,
  integration tests for game state transitions, regression tests for edge-case card
  interactions, and component interaction tests for turn flows and score summaries.
  Failing tests will be written before implementation for rule engine and state
  transition logic.
  Post-Design: Pass. Research, data model, and contracts define concrete rule cases,
  state transitions, and interface boundaries that can be tested directly.
- **User Experience Consistency**
  Pre-Research: Pass. The app centers on one shared-table interaction model reused for
  setup, active play, round resolution, and match scoring, with explicit loading,
  empty, success, and error states.
  Post-Design: Pass. Contracts and quickstart preserve a single active-player focus,
  rule explanation affordances, and mobile-safe layouts.
- **Performance**
  Pre-Research: Pass. Convex will hold authoritative state and push updates, while the
  client keeps rendering work small through event-driven updates and a focused game
  table.
  Post-Design: Pass. The design limits write paths to discrete mutations, keeps
  derived scoring deterministic, and defines validation via Vitest timing assertions
  for pure logic plus quickstart checks for end-to-end responsiveness.
- **Exceptions**: None.

## Project Structure

### Documentation (this feature)

```text
specs/001-flip7-webapp/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── game-session-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── layout.tsx
├── page.tsx
├── game/
│   └── [matchId]/page.tsx
└── globals.css

components/
├── game/
│   ├── match-setup.tsx
│   ├── game-table.tsx
│   ├── player-lane.tsx
│   ├── turn-controls.tsx
│   └── score-summary.tsx
└── ui/

convex/
├── schema.ts
├── matches.ts
├── rounds.ts
├── turns.ts
└── lib/
   └── rule-engine.ts

lib/
├── game/
│   ├── card-types.ts
│   ├── scoring.ts
│   ├── turn-resolution.ts
│   └── view-models.ts
└── utils.ts

tests/
├── unit/
│   ├── scoring.test.ts
│   └── turn-resolution.test.ts
├── integration/
│   ├── round-flow.test.ts
│   └── match-flow.test.ts
└── contract/
   └── game-session-contract.test.ts

.github/
└── workflows/
   └── ci.yml
```

**Structure Decision**: Use a single Next.js application at repository root with App
Router for pages, `components/` for reusable UI, `convex/` for schema and backend
functions, `lib/game/` for deterministic game logic shared by UI and backend, and
`tests/` split by unit, integration, and contract concerns.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
