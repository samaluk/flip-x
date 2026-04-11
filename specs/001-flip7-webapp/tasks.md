---
description: "Task list for implementing the Flip 7 web app"
---

# Tasks: Flip 7 Web App

**Input**: Design documents from `/specs/001-flip7-webapp/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Test tasks are REQUIRED for every material behavior change. Include unit,
integration, contract, and regression coverage according to the risk described in the
plan.

**Organization**: Tasks are grouped by user story to enable independent implementation
and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Application routes live in `app/`
- Reusable UI lives in `components/`
- Convex schema and functions live in `convex/`
- Shared deterministic game logic lives in `lib/game/`
- Automated tests live in `tests/unit/`, `tests/integration/`, and `tests/contract/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the Next.js, Convex, testing, styling, and CI foundation.

- [x] T001 Initialize the pnpm workspace and root app configuration in `package.json`, `pnpm-workspace.yaml`, and `tsconfig.json`
- [x] T002 Create the Next.js 16.2.3 app shell in `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `next.config.ts`, and `next-env.d.ts`
- [x] T003 [P] Configure Oxc linting and formatting in `.oxlintrc.json` and `.editorconfig`
- [x] T004 [P] Configure Tailwind CSS v4 styling foundation in `app/globals.css` and `postcss.config.mjs`
- [x] T005 [P] Configure Vitest and shared test setup in `vitest.config.ts` and `tests/setup.ts`
- [x] T006 [P] Configure shadcn/ui project settings in `components.json`
- [x] T007 Configure GitHub Actions CI in `.github/workflows/ci.yml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the shared game model, backend contracts, and layout primitives that all user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create the Convex schema for matches, players, rounds, events, and score breakdowns in `convex/schema.ts`
- [x] T009 [P] Implement core card definitions and deck construction in `lib/game/card-types.ts`
- [x] T010 [P] Implement deterministic scoring helpers in `lib/game/scoring.ts`
- [x] T011 [P] Implement deterministic turn and action resolution helpers in `lib/game/turn-resolution.ts`
- [x] T012 [P] Implement match snapshot and UI mapping helpers in `lib/game/view-models.ts`
- [x] T013 Implement shared Convex match queries and setup mutations in `convex/matches.ts`
- [x] T014 Implement shared Convex round lifecycle and turn mutations in `convex/rounds.ts` and `convex/turns.ts`
- [x] T015 [P] Create shared UI primitives for app shell, cards, dialogs, and buttons in `components/ui/`
- [x] T016 [P] Create the game route shell and loading or error boundaries in `app/game/[matchId]/page.tsx`, `app/game/[matchId]/loading.tsx`, and `app/game/[matchId]/error.tsx`
- [x] T017 [P] Add foundational rule-engine unit coverage in `tests/unit/scoring.test.ts` and `tests/unit/turn-resolution.test.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Play a Round of Flip 7 (Priority: P1) 🎯 MVP

**Goal**: Let players create a match, start a round, resolve Hit or Stay turns, enforce core Flip 7 rules, and score the round correctly.

**Independent Test**: Start a 3-player match, play through number cards, a duplicate-number bust, an action card, and a modifier card, then verify the round ends with the correct score totals.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T018 [P] [US1] Add contract tests for `createMatch`, `startMatch`, and `takeTurnAction` in `tests/contract/game-session-contract.test.ts`
- [x] T019 [P] [US1] Add integration tests for initial dealing, Hit or Stay flow, and duplicate bust handling in `tests/integration/round-flow.test.tsx`
- [x] T020 [P] [US1] Add regression tests for Flip Three, Freeze, Second Chance, and modifier ordering in `tests/unit/turn-resolution.test.ts`

### Implementation for User Story 1

- [x] T021 [P] [US1] Implement match setup form and player-name validation in `components/game/match-setup.tsx`
- [x] T022 [P] [US1] Implement active round table rendering in `components/game/game-table.tsx`
- [x] T023 [P] [US1] Implement per-player lane rendering for cards, status, and points-at-risk in `components/game/player-lane.tsx`
- [x] T024 [P] [US1] Implement turn action controls for Hit, Stay, and forced action targeting in `components/game/turn-controls.tsx`
- [x] T025 [US1] Implement match creation and initial round start wiring in `app/page.tsx` and `convex/matches.ts`
- [x] T026 [US1] Implement round progression, action-card resolution, and bust handling mutations in `convex/rounds.ts` and `convex/turns.ts`
- [x] T027 [US1] Implement authoritative round scoring and Flip 7 round-end handling in `convex/lib/ruleEngine.ts` and `lib/game/scoring.ts`
- [x] T028 [US1] Connect the game page to live match snapshots and round controls in `app/game/[matchId]/page.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Complete a Full Match to 200 Points (Priority: P2)

**Goal**: Preserve scores across rounds, rotate the dealer, restore in-progress sessions, and declare the correct winner at the end of the deciding round.

**Independent Test**: Complete multiple rounds, confirm cumulative scores persist and dealer order rotates, refresh the browser during an active round, and verify the match ends with the correct winner after a player reaches 200 points.

### Tests for User Story 2 ⚠️

- [x] T029 [P] [US2] Add contract tests for `getMatchSnapshot` and `startNextRound` in `tests/contract/game-session-contract.test.ts`
- [x] T030 [P] [US2] Add integration tests for multi-round score carryover, dealer rotation, and winner determination in `tests/integration/match-flow.test.tsx`
- [x] T031 [P] [US2] Add integration tests for refresh and reconnect restoration in `tests/integration/match-flow.test.tsx`

### Implementation for User Story 2

- [x] T032 [P] [US2] Extend match and player persistence for cumulative scoring and winner state in `convex/schema.ts` and `convex/matches.ts`
- [x] T033 [P] [US2] Persist round event history and score breakdown records for restoration in `convex/schema.ts` and `convex/rounds.ts`
- [x] T034 [US2] Implement next-round creation, dealer rotation, and draw-pile reshuffle behavior in `convex/rounds.ts`
- [x] T035 [US2] Implement restore-from-snapshot loading on the game route in `app/game/[matchId]/page.tsx` and `lib/game/view-models.ts`
- [x] T036 [US2] Implement cumulative scoreboard and completed-match winner presentation in `components/game/game-table.tsx` and `components/game/player-lane.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Understand Why the App Made a Game Decision (Priority: P3)

**Goal**: Explain active choices, card effects, recent game events, and score breakdowns so players can trust the app's decisions.

**Independent Test**: During a round with action cards and modifiers, inspect the active-player guidance and end-of-round summary, then verify the UI explains both the latest effect and the final score breakdown.

### Tests for User Story 3 ⚠️

- [x] T037 [P] [US3] Add component interaction tests for active-turn guidance and rule help in `tests/integration/round-flow.test.tsx`
- [x] T038 [P] [US3] Add integration tests for score breakdown summaries and recent-event explanations in `tests/integration/match-flow.test.tsx`

### Implementation for User Story 3

- [x] T039 [P] [US3] Implement score breakdown presentation in `components/game/score-summary.tsx`
- [x] T040 [P] [US3] Implement recent-event and card-effect summary UI in `components/game/game-table.tsx`
- [x] T041 [P] [US3] Implement inline rules help and card reference content in `components/game/match-setup.tsx` and `components/game/player-lane.tsx`
- [x] T042 [US3] Expose explanation-ready event summaries and score breakdown view models in `convex/rounds.ts` and `lib/game/view-models.ts`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate quality, UX consistency, and performance across the completed experience.

- [x] T043 [P] Document setup and local development steps in `README.md`
- [x] T044 Refine shared table responsiveness and accessibility states across `components/game/*.tsx` and `app/**/*.tsx`
- [x] T045 [P] Add performance-focused rule and snapshot regression coverage in `tests/unit/scoring.test.ts` and `tests/integration/match-flow.test.tsx`
- [x] T046 [P] Validate quickstart flows and update `specs/001-flip7-webapp/quickstart.md`
- [x] T047 Run the full quality gate and fix remaining issues using `pnpm lint`, `pnpm test`, and `pnpm build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel when staffing allows
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational and delivers the MVP
- **User Story 2 (P2)**: Depends on the round engine from US1 but remains independently testable as multi-round progression
- **User Story 3 (P3)**: Depends on the game state and scoring outputs from US1 and US2 but remains independently testable as explanation and transparency work

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Shared state and models before Convex mutations
- Convex mutations before route wiring
- Route wiring before UI polish in that story
- Story complete before moving to the next priority when following MVP-first delivery

### Parallel Opportunities

- T003-T006 can run in parallel after T001-T002
- T009-T012 and T015-T017 can run in parallel in Foundational once file scaffolding exists
- T018-T020 can run in parallel for US1
- T021-T024 can run in parallel for US1 UI work
- T029-T031 can run in parallel for US2
- T032-T033 can run in parallel for US2 backend persistence work
- T037-T038 and T039-T041 can run in parallel for US3
- T043, T045, and T046 can run in parallel in Polish

---

## Parallel Example: User Story 1

```bash
# Launch User Story 1 test work together:
Task: "T018 Add contract tests for createMatch, startMatch, and takeTurnAction in tests/contract/game-session-contract.test.ts"
Task: "T019 Add integration tests for initial dealing, Hit/Stay flow, and duplicate bust handling in tests/integration/round-flow.test.ts"
Task: "T020 Add regression tests for Flip Three, Freeze, Second Chance, and modifier ordering in tests/unit/turn-resolution.test.ts"

# Launch User Story 1 UI work together:
Task: "T021 Implement match setup form and player-name validation in components/game/match-setup.tsx"
Task: "T022 Implement active round table rendering in components/game/game-table.tsx"
Task: "T023 Implement per-player lane rendering in components/game/player-lane.tsx"
Task: "T024 Implement turn action controls in components/game/turn-controls.tsx"
```

## Parallel Example: User Story 2

```bash
# Launch User Story 2 test work together:
Task: "T029 Add contract tests for getMatchSnapshot and startNextRound in tests/contract/game-session-contract.test.ts"
Task: "T030 Add integration tests for multi-round score carryover, dealer rotation, and winner determination in tests/integration/match-flow.test.ts"
Task: "T031 Add integration tests for refresh and reconnect restoration in tests/integration/match-flow.test.ts"

# Launch User Story 2 backend work together:
Task: "T032 Extend match and player persistence for cumulative scoring and winner state in convex/schema.ts and convex/matches.ts"
Task: "T033 Persist round event history and score breakdown records for restoration in convex/schema.ts and convex/rounds.ts"
```

## Parallel Example: User Story 3

```bash
# Launch User Story 3 test work together:
Task: "T037 Add component interaction tests for active-turn guidance and rule help in tests/integration/round-flow.test.ts"
Task: "T038 Add integration tests for score breakdown summaries and recent-event explanations in tests/integration/match-flow.test.ts"

# Launch User Story 3 UI work together:
Task: "T039 Implement score breakdown presentation in components/game/score-summary.tsx"
Task: "T040 Implement recent-event and card-effect summary UI in components/game/game-table.tsx"
Task: "T041 Implement inline rules help and card reference content in components/game/match-setup.tsx and components/game/player-lane.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Stop and validate the independent test for US1
5. Demo the round-play MVP before expanding scope

### Incremental Delivery

1. Deliver Setup + Foundational to establish the real-time game platform
2. Deliver US1 for playable round flow and rule-correct scoring
3. Deliver US2 for full match continuity to 200 points
4. Deliver US3 for rule transparency and score explainability
5. Finish with Polish and full quality validation

### Parallel Team Strategy

1. One engineer completes setup and foundational backend schema or rule work
2. A second engineer can prepare story tests while foundational work finishes
3. After Foundational, split across:
   - Engineer A: Convex mutations and rule engine behavior
   - Engineer B: Game table UI and interaction components
   - Engineer C: Contract, integration, and explanation-focused tests

---

## Notes

- [P] tasks = different files or isolated work with no dependency on incomplete tasks
- [Story] labels map each task to a single independently testable user story
- Every user story phase includes tests, implementation, and a checkpoint
- All tasks include explicit file paths and are immediately executable by an LLM
- Suggested MVP scope: Phase 1 + Phase 2 + Phase 3 (User Story 1)
