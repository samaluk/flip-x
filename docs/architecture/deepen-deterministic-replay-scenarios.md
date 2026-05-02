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

- [x] Read `docs/testing.md` and `specs/004-deterministic-game-tests/spec.md`.
- [x] List the current facts every replay scenario must repeat.
- [x] Separate game-language expectation fields from snapshot implementation fields.
- [x] Design a compact scenario expectation shape for only meaningful game facts.
- [x] Keep canonical snapshot conversion internal to the replay module.
- [x] Hide session and command metadata in the harness implementation.
- [x] Preserve existing divergence reporting quality.
- [x] Convert one existing replay scenario as a spike.
- [x] Convert the remaining replay scenarios only after the spike proves the interface is deeper.
- [x] Update unit tests for invalid/diverged/matched replay results.
- [x] Run `pnpm test:engine -- tests/unit/engine/deterministic-replay.test.ts`.
- [x] Run `pnpm test:confect -- tests/confect/deterministic-replay.test.ts tests/confect/deterministic-divergence.test.ts`.
- [x] Run `pnpm test`.

## Verification Questions

- [x] Can a new deterministic case be written without knowing `MatchSnapshot` structure?
- [x] Can a snapshot shape change be handled mostly inside replay assertions?
- [x] Does the replay module provide leverage for both unit and Confect tests?
- [x] Did scenario files become more focused on Flip 7 rules than backend mechanics?

## Progress Notes

- Replay scenarios previously repeated snapshot implementation facts such as `status`, `dealerSeat`, empty action-card arrays, modifier arrays, player seat metadata, and null pending fields. Scenarios now declare only the game facts each step cares about, keyed by player display name.
- `pnpm test:unit` is stale for the current package scripts. The equivalent focused command is `pnpm test:engine -- tests/unit/engine/deterministic-replay.test.ts`.
