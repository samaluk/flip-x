# Contract: Replay Result

## Purpose

Define the stable test-facing output contract for deterministic replay execution and divergence reporting.

## Top-Level Shape

| Field | Required | Description |
| ------ | ------ | ----------- |
| `scenarioName` | Yes | Scenario identifier echoed in output |
| `scope` | Yes | `round` or `match` |
| `status` | Yes | `matched`, `diverged`, or `invalid` |
| `stepsConsumed` | Yes | Number of scripted decisions applied before completion or failure |
| `finalOutcome` | When matched | Winner and end-state summary |
| `divergence` | When diverged | First mismatch details |
| `validationError` | When invalid | Scenario validation or scripted-decision failure |

## Divergence Object

| Field | Required | Description |
| ------ | ------ | ----------- |
| `stepNumber` | Yes | First mismatched step |
| `decision` | Yes | Scripted decision being applied |
| `expectedState` | Yes | Expected canonical state after the step |
| `actualState` | Yes | Actual canonical state after the step |
| `message` | Yes | Readable summary of the mismatch |

Rules:
- Replay stops at the first divergence.
- `expectedState` and `actualState` use the same canonical shape as `expectedStates` in the scenario contract.
- Divergence output should be minimal but enough to identify the wrong decision point, prompt, event, or player state.

## Invalid Result Cases

`status: invalid` is used when replay cannot begin or continue because:

- the scenario omits required setup context
- the deck is malformed
- the script runs out before gameplay completes
- the script contains extra steps after gameplay ends
- the scripted actor or prompt does not match the current game state
- a scripted decision violates the game rules

## Success Expectations

- `matched` means all scripted decisions were consumed in order.
- `matched` also means every expected step state and the final outcome matched exactly.
- `stepsConsumed` must equal the total scripted step count for a successful replay.
