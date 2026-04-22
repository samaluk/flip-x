# Feature Specification: Deterministic Game Test Scenarios

**Feature Branch**: `[004-deterministic-game-tests]`  
**Created**: 2026-04-21  
**Status**: Draft  
**Input**: User description: "we need a way to run deterministic integration tests, this being a card game with a shuffled deck we need to be able to setup a game with N players and a specific order and be able to reproduce a game given the same decisions from the players and the same deck"

## Clarifications

### Session 2026-04-21

- Q: How detailed must the scripted replay be? → A: The test specification must capture every decision each player actually makes under the game rules, including turn choices and target selections when action cards require a choice.
- Q: What replay scopes must deterministic scenarios support? → A: Support both round and full match scopes.
- Q: What context must a round-scope replay include? → A: Full round context.
- Q: Should the script record only player choices or also automatic rule effects? → A: Explicit player choices only.
- Q: Should target selections be scripted even when only one legal target exists? → A: Yes, because players still explicitly confirm those selections and the test definition should capture that confirmation.
- Q: How strict must replay verification be? → A: Verify every step state, not just checkpoints or the final outcome.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Configure a Controlled Game Setup (Priority: P1)

As a test author, I can define a deterministic scenario for either a single round or a full match with a chosen number of players, a fixed player order, and an exact deck order so that a test run starts from a fully controlled state instead of relying on shuffled randomness.

**Why this priority**: Controlled setup is the foundation for every deterministic integration test. Without it, later replay and debugging workflows cannot reliably reproduce game behavior.

**Independent Test**: Create a scenario for a supported player count with a named player order and explicit deck sequence, start the game twice, and confirm both runs begin with the same initial state and proceed identically when given the same decisions.

**Acceptance Scenarios**:

1. **Given** a test author defines a deterministic scenario for a supported player count, a selected scope, a fixed player order, a complete deck order, and all context required for that scope, **When** the scenario starts, **Then** the game begins with exactly that configuration and deck sequence.
2. **Given** the same controlled setup is run multiple times with the same player decisions, **When** each run completes, **Then** every run produces the same turn-by-turn progression and final result.

---

### User Story 2 - Replay a Known Game Outcome (Priority: P2)

As a developer or QA engineer, I can replay a known game using the original setup and the full ordered record of every player decision so that I can reproduce a previously observed result on demand.

**Why this priority**: Replay turns one observed failure or edge case into a repeatable scenario, which reduces time spent trying to manually recreate a shuffled game.

**Independent Test**: Capture one completed deterministic game, rerun it later using the same setup and explicit player decision sequence, and confirm the replay reaches the same winner and matching game states at each step, including target confirmations.

**Acceptance Scenarios**:

1. **Given** a saved deterministic game scenario that includes its setup and the ordered record of every player decision, **When** the scenario is replayed later, **Then** the replay matches the original step-by-step game states and final outcome.
2. **Given** a replay request is missing required setup data or player decisions, **When** the replay is started, **Then** the run is rejected before gameplay begins with a clear explanation of what is missing.

---

### User Story 3 - Diagnose Divergence Quickly (Priority: P3)

As a developer investigating a regression, I can see when and where a deterministic replay diverges from the expected game so that I can isolate the cause of the defect quickly.

**Why this priority**: Fast diagnosis shortens investigation time after a failing test and makes the deterministic system useful for day-to-day debugging rather than only for setup control.

**Independent Test**: Intentionally alter one player decision in an otherwise identical replay and confirm the resulting failure identifies the first turn or step where the replay stopped matching the expected game.

**Acceptance Scenarios**:

1. **Given** a replay uses the original setup but one decision differs from the recorded sequence, **When** the replay is executed, **Then** the result reports that the game diverged and identifies the first point of mismatch.
2. **Given** a deterministic run cannot complete because a scripted decision breaks game rules, **When** execution reaches that point, **Then** the run fails with the invalid decision called out rather than silently changing the game flow.

---

### Edge Cases

- A scenario requests fewer or more players than the game currently supports.
- A scenario declares round scope or full match scope but omits setup data required for that scope.
- A round-scope scenario omits existing match context needed to reproduce turn order, cumulative scores, dealer rotation, or other current-round conditions.
- A provided deck order is incomplete, contains duplicate cards, or contains cards that do not belong in the game.
- The scripted decision list omits a required player choice such as a turn action or an action-card target confirmation, even when only one legal target is available.
- A replay uses the same starting setup but a different decision at one step; the system must report divergence rather than claiming the game was reproduced.
- A previously saved replay no longer matches the current game rules; the system must clearly indicate that the scenario is incompatible rather than producing a misleading result.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST allow test authors to define a deterministic game scenario by specifying the number of players, the player order, and the full deck order before the first turn begins.
- **FR-001A**: The system MUST allow test authors to declare whether a deterministic scenario represents a single round or a full match.
- **FR-001B**: The system MUST require each scenario to include all starting context needed for its declared scope, including any existing match or round state required to reproduce the same decisions and outcomes.
- **FR-002**: The system MUST allow deterministic scenarios to provide an ordered sequence of every explicit player decision required by the game rules so the game can run without live input.
- **FR-003**: The system MUST execute a deterministic scenario using only the supplied setup and supplied decisions, without introducing additional random variation after the scenario starts.
- **FR-003A**: The system MUST derive automatic rule-driven effects from the supplied setup, the supplied explicit player decisions, and the current game rules rather than requiring those automatic effects to be scripted separately, except for target confirmations that players explicitly make.
- **FR-003B**: The system MUST treat every target confirmation presented to a player as an explicit scripted decision, including cases where only one legal target exists.
- **FR-004**: The system MUST allow the same deterministic scenario to be run repeatedly and produce the same visible game states and final outcome when the rules and inputs are unchanged.
- **FR-005**: The system MUST validate a deterministic scenario before execution and reject invalid player counts, invalid deck definitions, and impossible decision sequences with clear failure reasons.
- **FR-006**: Users MUST be able to save or reference enough information from a deterministic run to replay the same game later, including the initial setup, the ordered record of every player decision, and the outcome summary.
- **FR-007**: The system MUST identify the first point of divergence when a replay does not match the expected game progression or outcome.
- **FR-007A**: The system MUST compare replayed games against the expected result at each decision step rather than only at the final outcome.
- **FR-008**: The system MUST support deterministic scenarios across every player count that is valid under normal game rules.
- **FR-009**: The system MUST enforce the same game rules during deterministic runs as it does during normal gameplay.
- **FR-010**: The system MUST fail a deterministic run when a scripted decision is invalid instead of silently choosing an alternative action.

### User Experience Consistency Requirements

- **UX-001**: The feature MUST use established naming and organization patterns for test scenarios, players, and outcomes so contributors can understand deterministic runs without learning a separate vocabulary.
- **UX-002**: The feature MUST define clear success, validation failure, incomplete-input, and divergence result states for each deterministic scenario run.
- **UX-003**: When a deterministic scenario fails, the reported output MUST identify the scenario and the first turn, decision, or rule check that caused the failure.

### Performance Requirements

- **PR-001**: A deterministic scenario representing a full game with the maximum supported player count MUST complete within 10 seconds in the standard automated test environment.
- **PR-002**: Deterministic behavior MUST be validated by rerunning the same full-game scenario at least 10 times and confirming identical outcomes across all runs.
- **PR-003**: The feature MUST define timeout behavior for unusually long scenarios and treat long decision histories and large replay records as explicit performance risks to monitor.

### Key Entities _(include if feature involves data)_

- **Deterministic Game Scenario**: A reusable description of one testable game, including player count, player order, deck order, and any metadata needed to identify the scenario.
- **Scenario Scope**: The declared replay boundary identifying whether the deterministic scenario covers one round or a full multi-round match.
- **Round Context**: The preconditions required to start a round replay accurately, including the current match situation, player order, and any carry-over state that can influence the round.
- **Deck Sequence**: The complete ordered list of cards that will be drawn or revealed during a deterministic game.
- **Decision Script**: The ordered list of every explicit player choice required by the rules, including turn actions and all target confirmations triggered by action cards, even when only one legal target exists, but excluding other automatic rule-driven effects.
- **Replay Result**: The recorded outcome of a deterministic run, including the game progression summary, final result, and any divergence details.
- **Step State**: The expected game state immediately after each scripted player decision, used to verify that a replay stays identical throughout execution.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of deterministic scenarios produce the same winner and matching turn-by-turn outcomes across 10 consecutive reruns when the setup and decisions do not change.
- **SC-001A**: 100% of deterministic replays detect and report the first mismatched step when a replay diverges from the expected step-by-step states.
- **SC-002**: A test author can create and start a deterministic scenario for any supported player count and explicit deck order in under 5 minutes.
- **SC-003**: At least 95% of full-game deterministic scenarios complete within 10 seconds in the standard automated test environment.
- **SC-004**: At least 90% of game regressions discovered through automated play can be reproduced on the first retry using the saved setup and decisions from the failing run.

## Assumptions

- The current game rules and supported player counts remain unchanged; this feature only makes those games reproducible for testing.
- Test authors can provide a complete deck order when they need full determinism rather than relying on partial setup.
- A reproduced game is considered correct when the starting setup, the full ordered record of explicit player decisions, the turn-by-turn states, and the final outcome all match the original run.
- Round-scope scenarios and full-match scenarios may require different setup data, but both must be supported by the feature.
- A round replay is not limited to a fresh opening round; it may begin from a later-round situation if that context is needed to reproduce the behavior under test.
- Existing integration test workflows remain the entry point for running game simulations; this feature adds deterministic setup and replay capabilities within those workflows.
