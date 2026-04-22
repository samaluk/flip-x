# Contract: Deterministic Scenario

## Purpose

Define the stable test-facing input contract for authoring deterministic Flip7 scenarios across unit, Confect, and backend test layers.

## Top-Level Shape

| Field | Required | Description |
| ------ | ------ | ----------- |
| `scenarioName` | Yes | Readable identifier used in test names and failure output |
| `scenarioVersion` | Yes | Fixture version or rules version marker |
| `scope` | Yes | `round` or `match` |
| `players` | Yes | Ordered scenario players |
| `targetScore` | Match only | Match target score for full-match replay |
| `deckSequence` | Yes | Full ordered deck with stable card identity |
| `startContext` | Yes | Setup needed for the declared scope |
| `decisionScript` | Yes | Ordered explicit player decisions |
| `expectedStates` | Yes | Ordered canonical states after each decision |

## Player Entry

| Field | Required | Description |
| ------ | ------ | ----------- |
| `playerRef` | Yes | Stable scenario-local player identifier |
| `displayName` | Yes | Human-readable player name |
| `seatIndex` | Yes | Turn order position |
| `startingTotalScore` | Round only when needed | Carry-over match score for later-round replay |

## Start Context

| Field | Required | Description |
| ------ | ------ | ----------- |
| `currentRoundNumber` | Yes | Round number at replay start |
| `dealerSeat` | Yes | Dealer position at replay start |
| `matchStatus` | Yes | Match lifecycle state at replay start |
| `roundStatus` | Round scope | Active round phase at replay start |
| `activePlayerRef` | Round scope | Active player at replay start |
| `pendingAction` | When present | Existing Freeze or Flip Three target prompt |
| `pendingFlip3` | When present | Existing Flip Three chain state |
| `playerRoundStates` | Round scope | Per-player round state needed to continue replay |
| `discardPile` | When present | Existing discard history needed for mid-round replay |

## Decision Step Variants

### Turn Action

| Field | Required | Description |
| ------ | ------ | ----------- |
| `stepNumber` | Yes | Strictly increasing step order |
| `actorPlayerRef` | Yes | Player taking the turn |
| `decisionType` | Yes | `turn_action` |
| `choice` | Yes | `hit` or `stay` |
| `promptKind` | Optional | Guardrail that the expected prompt is a turn prompt |

### Target Confirmation

| Field | Required | Description |
| ------ | ------ | ----------- |
| `stepNumber` | Yes | Strictly increasing step order |
| `actorPlayerRef` | Yes | Player confirming the action target |
| `decisionType` | Yes | `target_confirmation` |
| `choice` | Yes | Selected `playerRef` target |
| `promptKind` | Yes | `freeze` or `flip_three` |

Rules:
- Target confirmations are always explicit script entries.
- Single-target prompts still require a scripted confirmation.
- No automatic rule effect may consume a scripted step.

## Expected Step State

| Field | Required | Description |
| ------ | ------ | ----------- |
| `stepNumber` | Yes | Matches the decision just consumed |
| `activePlayerRef` | Yes | Expected active player after resolution |
| `roundStatus` | Yes | Expected round phase |
| `pendingAction` | Optional | Expected pending target prompt |
| `pendingFlip3` | Optional | Expected Flip Three chain |
| `players` | Yes | Ordered canonical player state summaries |
| `latestEvent` | Optional | Expected latest emitted event |
| `endedBy` | Optional | Expected round end reason |

## Validation Rules

- `players` must use unique `playerRef`, `displayName`, and `seatIndex` values within the scenario.
- `deckSequence` must be a complete legal deck for the current fixture version.
- `decisionScript` must cover every explicit player decision required by the rules.
- `expectedStates` must contain exactly one canonical state for every decision step.
- Round-scope scenarios must include enough start context to replay later-round behavior exactly.
