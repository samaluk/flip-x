# Deepen Deterministic Replay Scenarios

## Goal

Make deterministic replay scenarios easier to write and maintain by hiding session plumbing, backend command details, and snapshot-shape coupling behind a deeper replay module.

## Current Files

- `tests/fixtures/deterministic/scenario-runner.ts`
- `tests/fixtures/deterministic/replay-harness-factory.ts`
- `tests/fixtures/deterministic/scenario-types.ts`
- `tests/fixtures/deterministic/replay-scenarios.ts`
- `tests/fixtures/deterministic/replay-assertions.ts`
- `tests/confect/deterministic-replay.test.ts`
- `tests/unit/engine/deterministic-replay.test.ts`

## Problem

The replay tests are valuable, but their interface is close to the implementation. Expected states duplicate much of `MatchSnapshot`, decisions reference sessions indirectly, and scenario setup knows about backend start and round advancement mechanics.

That reduces locality when snapshot shape changes. It also makes adding new game-rule cases more expensive because authors must understand replay harness internals before writing a scenario.

## Desired Shape

Create a deeper deterministic replay module around game-language steps and expectations.

Its interface should let a scenario describe:

- Players.
- Starting deck or round deck.
- Decisions such as hit, stay, choose Freeze target, choose Flip Three target.
- Expected game facts after each step.

Its implementation should hide:

- Session ids.
- Idempotency keys.
- Expected version wiring.
- Backend command refs.
- Player id lookup.
- Canonical snapshot conversion.
- Round-boundary advancement.

## Checklist

- [ ] Read `docs/testing.md` and `specs/004-deterministic-game-tests/spec.md`.
- [ ] List the current facts every replay scenario must repeat.
- [ ] Separate game-language expectation fields from snapshot implementation fields.
- [ ] Design a compact scenario expectation shape for only meaningful game facts.
- [ ] Keep canonical snapshot conversion internal to the replay module.
- [ ] Hide session and command metadata in the harness implementation.
- [ ] Preserve existing divergence reporting quality.
- [ ] Convert one existing replay scenario as a spike.
- [ ] Convert the remaining replay scenarios only after the spike proves the interface is deeper.
- [ ] Update unit tests for invalid/diverged/matched replay results.
- [ ] Run `pnpm test:unit -- tests/unit/engine/deterministic-replay.test.ts`.
- [ ] Run `pnpm test:confect -- tests/confect/deterministic-replay.test.ts tests/confect/deterministic-divergence.test.ts`.
- [ ] Run `pnpm test`.

## Verification Questions

- [ ] Can a new deterministic case be written without knowing `MatchSnapshot` structure?
- [ ] Can a snapshot shape change be handled mostly inside replay assertions?
- [ ] Does the replay module provide leverage for both unit and Confect tests?
- [ ] Did scenario files become more focused on Flip 7 rules than backend mechanics?

