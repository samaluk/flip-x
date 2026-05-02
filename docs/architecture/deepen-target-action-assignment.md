# Deepen Target Action Assignment

## Goal

Make Freeze and Flip Three assignment a deeper module so callers do not need to know the full target-action protocol.

## Current Files

- `game/logic/action-resolution.ts`
- `game/logic/apply-card.ts`
- `game/logic/command-handler.ts`
- `game/logic/turn-order.ts`
- `tests/unit/engine/turn-actions.test.ts`
- `tests/unit/engine/opening-deal.test.ts`
- `tests/fixtures/deterministic/replay-scenarios.ts`

## Problem

Freeze and Flip Three assignment rules leak through several modules. Eligibility differs between dealing and turns, one eligible target auto-resolves, multiple targets create `pendingAction`, resolving an action mutates held and received cards, and resolution may alter phase or pending Flip Three state.

The existing seam is real because target action behavior is used from card application and pending action resolution. The module is still too shallow because its callers must pass broad mutable state and then remember follow-up phase and turn advancement behavior.

## Desired Shape

Create a deeper target action module around the domain operation of offering or applying a target action. Its implementation should own:

- Eligibility for dealing and turns.
- Auto-targeting when only one eligible target exists.
- Creating the pending target prompt when multiple targets are eligible.
- Moving held action cards to received action cards.
- Applying Freeze.
- Starting Flip Three.
- Emitting target action events.
- Reporting whether command handling should continue dealing, continue turns, or wait for user input.

The interface should be smaller than the implementation it hides. Avoid creating abstract adapters unless there are two real target-action implementations.

## Checklist

- [ ] Read `docs/game-rules.md`, especially Freeze, Flip Three, opening deal, and active player rules.
- [ ] List all current target-action behaviors in `action-resolution.ts`.
- [ ] List all caller responsibilities in `apply-card.ts` and `command-handler.ts`.
- [ ] Define the target action module around domain language, not storage or UI language.
- [ ] Move eligibility calculation into the target action module.
- [ ] Move held/received action card transfer into the target action module.
- [ ] Move pending prompt creation and auto-target behavior into the target action module.
- [ ] Simplify command handling so it only commits the chosen target and asks the module for the result.
- [ ] Update opening deal and turn action tests for the new interface.
- [ ] Run `pnpm test:unit -- tests/unit/engine/opening-deal.test.ts tests/unit/engine/turn-actions.test.ts`.
- [ ] Run `pnpm test`.

## Verification Questions

- [ ] Can a caller apply Freeze or Flip Three without knowing eligibility details?
- [ ] Are dealing and turns handled through the same target action interface?
- [ ] Did phase transitions become more local to the target action module?
- [ ] Did the tests become less dependent on intermediate mutation order?

