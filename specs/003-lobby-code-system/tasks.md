# Tasks: Lobby Code System

**Input**: Design documents from `/specs/003-lobby-code-system/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are REQUIRED for every material behavior change. Include unit,
integration, and regression coverage according to the risk described in the plan.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure - NOT NEEDED (existing project)

The project already exists with Next.js + Convex stack. Skip setup phase.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data model changes that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T001 Add lobbyCode and hostSessionId fields to matches table in convex/schema.ts
- [ ] T002 [P] Add index on lobbyCode for fast code lookups in convex/schema.ts
- [ ] T003 Update createMatch mutation to generate lobby code and store hostSessionId in convex/matches.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Create a New Game Lobby (Priority: P1) 🎯 MVP

**Goal**: User can create a game lobby with a unique shareable code

**Independent Test**: Click "Create Game", enter player names, receive lobby code, verify code is displayed and copyable

### Implementation for User Story 1

- [ ] T004 [P] [US1] Implement lobby code generation utility (4-char alphanumeric) in convex/lib/lobby-code.ts
- [ ] T005 [US1] Refactor app/page.tsx to show Create Game and Join Lobby options in app/page.tsx
- [ ] T006 [P] [US1] Update MatchSetup component flow (remove auto-start) in components/game/match-setup.tsx
- [ ] T007 [US1] Add LobbyCodeDisplay component showing lobby code with copy button in components/game/lobby-code-display.tsx
- [ ] T008 [US1] Update game page to show lobby code in setup state in app/game/[matchId]/page.tsx
- [ ] T009 [US1] Update getMatchSnapshot to include lobbyCode in response in convex/matches.ts

**Checkpoint**: At this point, User Story 1 should be fully functional

---

## Phase 4: User Story 2 - Join an Existing Game via Code (Priority: P1)

**Goal**: User can enter a lobby code on homepage to join an existing game

**Independent Test**: Enter valid code on homepage, redirected to lobby with correct players

### Implementation for User Story 2

- [ ] T010 [P] [US2] Add joinByCode mutation in convex/matches.ts
- [ ] T011 [P] [US2] Create JoinLobbyDialog component with code input in components/game/join-lobby-dialog.tsx
- [ ] T012 [US2] Add Join Lobby button to homepage in app/page.tsx
- [ ] T013 [US2] Handle URL query parameter for lobby code (e.g., ?code=ABCD) in app/page.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Host Starts the Game (Priority: P1)

**Goal**: Only the host can explicitly start the game after players join

**Independent Test**: Host clicks "Start Game" with 3+ players, game begins. Non-host cannot start.

### Implementation for User Story 3

- [ ] T014 [P] [US3] Add startMatchByHost mutation with host validation in convex/matches.ts
- [ ] T015 [P] [US3] Add startMatch mutation for non-host players (reject with error) in convex/matches.ts
- [ ] T016 [US3] Add StartGameButton component visible only to host in components/game/start-game-button.tsx
- [ ] T017 [US3] Update game page to show StartGameButton in setup state only in app/game/[matchId]/page.tsx

**Checkpoint**: All core P1 user stories complete

---

## Phase 6: User Story 4 - Share Lobby with Others (Priority: P2)

**Goal**: User can copy invite link or lobby code to share with others

**Independent Test**: Click copy button, link is in clipboard. Open link, code is pre-filled.

### Implementation for User Story 4

- [ ] T018 [P] [US4] Update copy invite link functionality in game page in app/game/[matchId]/page.tsx
- [ ] T019 [US4] Handle URL parameter parsing for lobby code in game page in app/game/[matchId]/page.tsx

**Checkpoint**: All user stories complete

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T020 [P] Add error handling for invalid lobby codes in JoinLobbyDialog
- [ ] T021 [P] Add loading states during lobby creation and code validation
- [ ] T022 Run quickstart.md validation
- [ ] T023 Run lint, format check, and tests

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: Must complete before any user stories - BLOCKS all stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P1)**: Depends on US1 (needs lobbyCode in snapshot)
- **User Story 4 (P2)**: Can start after Foundational - shares components with US1

### Within Each User Story

- Schema changes before mutations
- Mutations before UI component
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- Phase 2 tasks T001, T002 can run in parallel (schema + index)
- User Story 1: T004, T005, T006, T008 can run in parallel
- User Story 2: T010, T011 can run in parallel
- User Story 4: T018, T019 can run in parallel

---

## Parallel Example: User Story 1

```bash
# These can run in parallel:
Task: "Implement lobby code generation utility in convex/lib/lobby-code.ts"
Task: "Refactor app/page.tsx to show Create Game and Join Lobby options"
Task: "Add LobbyCodeDisplay component in components/game/lobby-code-display.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 2: Foundational
2. Complete Phase 3: User Story 1
3. **STOP and VALIDATE**: Test User Story 1 independently
4. Add Phase 4: User Story 2
5. Add Phase 5: User Story 3
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Include explicit tasks for UX validation when applicable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently