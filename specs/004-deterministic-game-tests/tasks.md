# Tasks: Deterministic Game Test Scenarios

**Input**: Design documents from `/specs/004-deterministic-game-tests/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Test tasks are required for this feature because the change introduces new game behavior guarantees for deterministic setup, replay, and divergence reporting.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g. `US1`, `US2`, `US3`)
- Every task includes exact file paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish deterministic fixture modules shared by all stories.

- [X] T001 Create shared deterministic scenario types and exports in `tests/fixtures/deterministic/scenario-types.ts` and `tests/fixtures/deterministic/index.ts`
- [X] T002 [P] Create replay assertion helper scaffold in `tests/fixtures/deterministic/replay-assertions.ts`
- [X] T003 [P] Create deterministic scenario runner scaffold in `tests/fixtures/deterministic/scenario-runner.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core deterministic seams and canonical replay state that all user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Update deterministic deck builders and ordered-deck helpers in `game/logic/card-types.ts`
- [X] T005 Update round runtime inputs for injected draw piles and replay start context in `game/logic/turn-resolution.ts`
- [X] T006 [P] Add canonical replay snapshot and step-state normalization in `game/logic/view-models.ts`, `confect/lib/store.ts`, and `confect/match-snapshot-schema.ts`
- [X] T007 [P] Extend shared test helpers for scripted turn and target execution in `tests/confect/helpers.ts` and `tests/backend/convex-test-helper.ts`
- [X] T008 Refresh generated Confect bindings in `confect/_generated/`

**Checkpoint**: Foundation ready; deterministic setup, scripted execution seams, and canonical state extraction are available to all stories.

---

## Phase 3: User Story 1 - Configure a Controlled Game Setup (Priority: P1) 🎯 MVP

**Goal**: Let tests start a match or round from a fully controlled player order, deck order, and scope-specific starting context.

**Independent Test**: Run the same round-scope and match-scope setup twice with the same players, order, deck, and decisions, and confirm both runs start identically and progress identically.

### Tests for User Story 1 ⚠️

- [X] T009 [P] [US1] Add unit coverage for explicit deck injection and repeated setup in `tests/unit/turn-resolution.test.ts`
- [X] T010 [P] [US1] Add Confect coverage for controlled round and match setup in `tests/confect/deterministic-scenarios.test.ts`
- [X] T011 [P] [US1] Add preview-backed backend regression coverage for controlled setup in `tests/backend/deterministic-scenarios.test.ts`

### Implementation for User Story 1

- [X] T012 [P] [US1] Add deterministic setup fixtures for round-scope and match-scope scenarios in `tests/fixtures/deterministic/setup-scenarios.ts`
- [X] T013 [US1] Implement deterministic start options for initial match setup in `confect/matches.spec.ts`, `confect/matches.impl.ts`, and `confect/matches.ts`
- [X] T014 [US1] Implement deterministic start options for later-round setup in `confect/rounds.spec.ts`, `confect/rounds.impl.ts`, and `confect/rounds.ts`
- [X] T015 [US1] Wire deterministic setup fixtures through shared Confect and backend helpers in `tests/confect/helpers.ts` and `tests/backend/convex-test-helper.ts`

**Checkpoint**: User Story 1 is complete when deterministic round and match setup can be authored and rerun from fixed player order and deck order without relying on shuffle randomness.

---

## Phase 4: User Story 2 - Replay a Known Game Outcome (Priority: P2)

**Goal**: Replay a saved deterministic round or full match by consuming the full ordered record of explicit player decisions and matching expected step states.

**Independent Test**: Execute a saved deterministic replay fixture for both round and match scope, consume every scripted player choice through the existing turn and target boundaries, and confirm every expected step state and final outcome matches.

### Tests for User Story 2 ⚠️

- [X] T016 [P] [US2] Add contract coverage for replay step-state and replay result shapes in `tests/contract/deterministic-replay-contract.test.ts`
- [X] T017 [P] [US2] Add Confect coverage for scripted round and full-match replay in `tests/confect/deterministic-replay.test.ts`
- [X] T018 [P] [US2] Add preview-backed backend regression coverage for scripted replay in `tests/backend/deterministic-replay.test.ts`

### Implementation for User Story 2

- [X] T019 [P] [US2] Add replay fixtures with full decision scripts and expected step states in `tests/fixtures/deterministic/replay-scenarios.ts`
- [X] T020 [US2] Implement deterministic scenario validation and scripted replay execution in `tests/fixtures/deterministic/scenario-runner.ts`
- [X] T021 [US2] Persist and assert canonical step states for replay verification in `tests/fixtures/deterministic/replay-assertions.ts`, `game/logic/view-models.ts`, and `confect/lib/store.ts`
- [X] T022 [US2] Integrate the replay runner with existing turn and target boundaries in `tests/confect/helpers.ts` and `tests/backend/convex-test-helper.ts`

**Checkpoint**: User Story 2 is complete when a known game can be replayed from saved setup plus explicit decisions and verified step-by-step through to the same final outcome.

---

## Phase 5: User Story 3 - Diagnose Divergence Quickly (Priority: P3)

**Goal**: Stop deterministic replay at the first mismatch and produce readable divergence output for invalid or changed gameplay behavior.

**Independent Test**: Change one scripted decision or expected step state in an otherwise valid replay and confirm the run fails at the first mismatched step with a readable explanation of the expected versus actual state.

### Tests for User Story 3 ⚠️

- [X] T023 [P] [US3] Add unit coverage for first-mismatch and invalid-script failures in `tests/unit/deterministic-replay.test.ts`
- [X] T024 [P] [US3] Add Confect regression coverage for divergence reporting and invalid inputs in `tests/confect/deterministic-divergence.test.ts`

### Implementation for User Story 3

- [X] T025 [P] [US3] Add divergence and invalid-script fixtures in `tests/fixtures/deterministic/divergence-scenarios.ts`
- [X] T026 [US3] Implement first-divergence diff reporting and script exhaustion handling in `tests/fixtures/deterministic/replay-assertions.ts` and `tests/fixtures/deterministic/scenario-runner.ts`
- [X] T027 [US3] Surface readable divergence summaries in `tests/confect/helpers.ts` and `tests/backend/convex-test-helper.ts`

**Checkpoint**: User Story 3 is complete when the runner stops at the first bad step and explains the mismatch instead of continuing through misleading downstream failures.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finish documentation, repeatability validation, and cross-story regression coverage.

- [X] T028 [P] Update deterministic test authoring guidance in `docs/testing.md` and `specs/004-deterministic-game-tests/quickstart.md`
- [X] T029 Add repeatability and performance assertions for 10 deterministic reruns in `tests/confect/deterministic-replay.test.ts` and `tests/backend/deterministic-replay.test.ts`
- [X] T030 [P] Align final contract and snapshot regression coverage in `tests/contract/deterministic-replay-contract.test.ts`, `tests/contract/game-session-contract.test.ts`, and `tests/unit/turn-resolution.test.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup**: No dependencies; can start immediately.
- **Phase 2: Foundational**: Depends on Phase 1; blocks all story work.
- **Phase 3: US1**: Depends on Phase 2; defines the MVP deterministic setup path.
- **Phase 4: US2**: Depends on Phase 2 and builds on the deterministic setup path from US1.
- **Phase 5: US3**: Depends on Phase 4 because divergence reporting extends the replay runner.
- **Phase 6: Polish**: Depends on the stories you intend to ship.

### User Story Dependencies

- **US1**: No dependency on other user stories after Foundational.
- **US2**: Uses deterministic setup fixtures and hooks delivered by US1.
- **US3**: Uses the replay runner and canonical state verification delivered by US2.

### Within Each User Story

- Tests should be added first and confirmed failing before implementation is finished.
- Fixture definitions should land before runner and helper wiring.
- Backend interface changes should be completed before helper integration.
- Story checkpoints should be validated before moving to the next story.

### Parallel Opportunities

- `T002` and `T003` can run in parallel after `T001`.
- `T006` and `T007` can run in parallel after `T005`.
- In US1, `T009`, `T010`, `T011`, and `T012` can run in parallel.
- In US2, `T016`, `T017`, `T018`, and `T019` can run in parallel.
- In US3, `T023`, `T024`, and `T025` can run in parallel.
- In Polish, `T028` and `T030` can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Launch US1 tests together
Task: "Add unit coverage for explicit deck injection and repeated setup in tests/unit/turn-resolution.test.ts"
Task: "Add Confect coverage for controlled round and match setup in tests/confect/deterministic-scenarios.test.ts"
Task: "Add preview-backed backend regression coverage for controlled setup in tests/backend/deterministic-scenarios.test.ts"

# Launch US1 fixture work in parallel with tests
Task: "Add deterministic setup fixtures for round-scope and match-scope scenarios in tests/fixtures/deterministic/setup-scenarios.ts"
```

## Parallel Example: User Story 2

```bash
# Launch US2 test coverage together
Task: "Add contract coverage for replay step-state and replay result shapes in tests/contract/deterministic-replay-contract.test.ts"
Task: "Add Confect coverage for scripted round and full-match replay in tests/confect/deterministic-replay.test.ts"
Task: "Add preview-backed backend regression coverage for scripted replay in tests/backend/deterministic-replay.test.ts"

# Build replay fixtures in parallel
Task: "Add replay fixtures with full decision scripts and expected step states in tests/fixtures/deterministic/replay-scenarios.ts"
```

## Parallel Example: User Story 3

```bash
# Launch US3 failure-path coverage together
Task: "Add unit coverage for first-mismatch and invalid-script failures in tests/unit/deterministic-replay.test.ts"
Task: "Add Confect regression coverage for divergence reporting and invalid inputs in tests/confect/deterministic-divergence.test.ts"

# Build divergence fixtures in parallel
Task: "Add divergence and invalid-script fixtures in tests/fixtures/deterministic/divergence-scenarios.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Stop and validate deterministic round and match setup independently.

### Incremental Delivery

1. Complete Setup + Foundational to establish deterministic seams.
2. Deliver US1 for controlled setup.
3. Deliver US2 for scripted replay and step-state verification.
4. Deliver US3 for first-divergence diagnostics.
5. Finish with Polish for repeatability, documentation, and cross-story regression coverage.

### Parallel Team Strategy

1. One engineer completes Phase 1 and coordinates Phase 2 shared seams.
2. Once Phase 2 is complete:
3. Engineer A takes US1 deterministic setup.
4. Engineer B takes US2 replay fixtures and runner.
5. Engineer C takes US3 divergence fixtures and reporting after the US2 runner lands.

---

## Notes

- `[P]` tasks touch separate files and can be run in parallel.
- `US1` is the suggested MVP scope.
- Every story has independent tests and a checkpoint before the next phase.
- The task list intentionally keeps most coverage in `tests/unit` and `tests/confect`, with selective confidence coverage in `tests/backend`.
