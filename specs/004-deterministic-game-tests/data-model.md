# Data Model: Deterministic Game Test Scenarios

## Overview

This feature introduces a deterministic scenario model for tests while reusing the existing runtime game model for match, round, player, and snapshot state. The deterministic model is primarily a test-fixture contract and replay result contract, not a new product-facing domain.

## Existing Runtime Entities Reused

### Match

- Represents the overall game, including match status, target score, current round number, dealer seat, and winner.
- Source today: `matches` table and `MatchSnapshot`.
- Relevant replay fields: `status`, `targetScore`, `currentRoundNumber`, `dealerSeat`.

### Round Runtime

- Represents the active round engine state.
- Source today: `rounds` table and `RoundRuntime`.
- Relevant replay fields: `phase`, `roundNumber`, `dealerSeat`, `activePlayerId`, `drawPile`, `discardPile`, `openingSeatIndex`, `turnSeatIndex`, `endedBy`, `pendingAction`, `pendingFlip3`.

### Player Round State

- Represents one player’s state within a round.
- Source today: `roundPlayerStates` table and `PlayerRoundState`.
- Relevant replay fields: `status`, `numberCards`, `modifierCards`, `heldActionCards`, `receivedActionCards`, `roundScore`, `pointsAtRisk`, `hasFlip7`.

### Match Snapshot

- Represents the canonical app-facing state for a replay step.
- Source today: `buildMatchSnapshot()` and `confect/match-snapshot-schema.ts`.
- Relevant replay fields: `activePlayerId`, `pendingAction`, `pendingFlip3`, ordered player state, `latestEvent`, `roundStatus`, `endedBy`.

## New Fixture Entities

### Deterministic Scenario

Represents a reusable replayable test case.

Fields:
- `scenarioName`: Human-readable identifier used in test names and divergence output.
- `scenarioVersion`: Version marker for fixture compatibility across rules changes.
- `scope`: `round` or `match`.
- `players`: Ordered player definitions for the scenario.
- `targetScore`: Match target score when full-match replay is used.
- `deckSequence`: Complete ordered list of card instances used during replay.
- `startContext`: Initial state needed for the declared scope.
- `decisionScript`: Ordered explicit player decisions.
- `expectedStates`: Ordered canonical step states used for verification.

Validation rules:
- `scope` must be either `round` or `match`.
- `players` must match a supported player count and have unique seats and names within the scenario.
- `deckSequence` must preserve full card identity and legal card counts for the current rules version.
- `decisionScript` and `expectedStates` must use strictly increasing step numbers.

Relationships:
- Has one `startContext`.
- Has many `decisionScript` entries.
- Has many `expectedStates` entries.

### Scenario Player

Defines a player in scenario order.

Fields:
- `playerRef`: Stable scenario-local identifier.
- `displayName`: Name used in snapshots and readable failure output.
- `seatIndex`: Turn order index.
- `startingTotalScore`: Needed for later-round and full-match replay.

Validation rules:
- `seatIndex` must be unique.
- `playerRef` must be unique.

### Start Context

Defines the starting conditions for replay.

Fields:
- `scope`: `round` or `match`.
- `currentRoundNumber`: Round number at replay start.
- `dealerSeat`: Dealer position at replay start.
- `matchStatus`: Usually `in_progress` for replay scenarios.
- `roundStatus`: Phase at replay start when round scope is used.
- `activePlayerRef`: Active player at replay start.
- `pendingAction`: Existing target prompt, if any.
- `pendingFlip3`: Existing Flip Three chain, if any.
- `playerRoundStates`: Per-player round state at replay start.
- `discardPile`: Needed when reproducing mid-round behavior.

Validation rules:
- Match scope may start from match setup or the first round boundary.
- Round scope must include enough context to reproduce later-round behavior, including scores, dealer rotation, and unresolved action state.

### Decision Step

Represents one explicit player choice.

Fields:
- `stepNumber`: Ordered replay step.
- `actorPlayerRef`: Player making the decision.
- `decisionType`: `turn_action` or `target_confirmation`.
- `choice`: Concrete choice value such as `hit`, `stay`, or a selected player reference.
- `promptKind`: Optional guardrail describing the prompt that should be active when the decision is consumed.
- `notes`: Optional readable explanation for debugging.

Validation rules:
- Every required explicit player choice must have exactly one step.
- Target confirmations are required even when only one legal target exists.
- No step may be consumed when the active player or pending action does not match the scripted actor.

### Expected Step State

Represents the canonical state immediately after a decision step resolves.

Fields:
- `stepNumber`: Matches a `Decision Step`.
- `activePlayerRef`: Expected active player after resolution.
- `roundStatus`: Expected phase after resolution.
- `pendingAction`: Expected target prompt state, if any.
- `pendingFlip3`: Expected Flip Three state, if any.
- `players`: Expected ordered player summaries.
- `latestEvent`: Expected latest emitted event.
- `endedBy`: Expected round end reason, if any.

Validation rules:
- One expected state per scripted decision step.
- Canonical ordering must be stable so repeated runs compare equal.

### Replay Result

Represents the outcome of running a scenario.

Fields:
- `status`: `matched`, `diverged`, or `invalid`.
- `stepsConsumed`: Count of scripted decisions successfully applied.
- `divergenceStep`: First mismatched step, if any.
- `expectedState`: Expected canonical step state at divergence.
- `actualState`: Actual canonical step state at divergence.
- `message`: Readable summary for test failure output.

Validation rules:
- `matched` requires all scripted steps to be consumed and all expected states to match.
- `diverged` requires `divergenceStep`, `expectedState`, and `actualState`.
- `invalid` is used for malformed scenarios or impossible scripted decisions.

## Relationships

- One `Deterministic Scenario` has many `Scenario Player` records.
- One `Deterministic Scenario` has one `Start Context`.
- One `Deterministic Scenario` has many ordered `Decision Step` records.
- One `Deterministic Scenario` has many ordered `Expected Step State` records.
- One replay execution produces one `Replay Result`.

## State Transitions

### Scenario Validation Lifecycle

1. `draft`: Scenario exists but has not been validated.
2. `ready`: Deck, context, decisions, and expected states are internally consistent.
3. `invalid`: Validation fails before replay begins.

### Replay Execution Lifecycle

1. `ready` -> `running`: Replay starts with the declared setup.
2. `running` -> `matched`: All steps and expected states match.
3. `running` -> `diverged`: First step mismatch is detected.
4. `running` -> `invalid`: Script exhausts early, contains surplus input, or violates game rules.
