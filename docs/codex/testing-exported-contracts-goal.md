# Codex Goal: Improve Tests for Exported Contracts

## Objective

Improve the Flip7 test suite so important exported contracts are protected without making implementation refactors painful.

Many functions are exported and imported across files, so other code depends on their behavior. However, not every export should be treated as a stable public API. Codex should classify exports by contract strength, then add or improve tests only where the behavior is meaningful.

## Core Principle

Do not blindly unit test every exported function. Test the behavior that other code, users, or game rules depend on.

Classify exports into four categories:

1. **Stable domain/game-rule contracts**
   - Need direct unit tests or deterministic scenario tests.
   - Examples: card/deck rules, scoring, turn order, action card behavior, pending action resolution, Flip Three behavior, bust/stay/hit behavior, round finalization, settings validation and normalization.

2. **Application/orchestration contracts**
   - Need behavior tests using fake services or controlled setup.
   - Examples: command execution, idempotency, stale version handling, match-not-found handling, saving command results, rebuilding snapshots, Effect service orchestration.

3. **UI contracts**
   - Should be tested through rendered behavior rather than implementation details.
   - Examples: visible game state, enabled/disabled actions, settings controls, player-visible errors.

4. **Weak/internal exports**
   - Usually should not get direct tests unless they encode a meaningful rule.
   - Examples: type-only exports, Effect service tags, trivial constants, framework wiring, implementation helpers exported only because of file structure.

## Scope to Inspect

Prioritize exported functions and symbols under:

- `game/logic/**`
- `game/application/**`
- `game/infrastructure/**`
- `confect/**`
- existing tests under `tests/**`

Build an internal coverage map while working:

- export name
- file
- category
- current coverage status
- recommended test level: unit, deterministic scenario, infrastructure, contract, UI, or no direct test

The map does not need to be committed unless it is useful as durable documentation.

## Work Order

Prioritize work in this order:

1. Pure deterministic game rules under `game/logic/**`.
2. Deterministic command/scenario tests using fixed players, fixed deck, and fixed commands.
3. Application orchestration tests under `game/application/**`.
4. Infrastructure/contract tests where persistence or Convex behavior matters.
5. UI behavior tests only for important player-visible behavior.

## Test Style

Write tests that read like game rules or application contracts.

Good examples:

- `normalizes missing settings to defaults`
- `rejects odd max number card values`
- `locks points at risk when a player stays`
- `busts when a duplicate number card is drawn`
- `returns cached idempotent result without loading aggregate`
- `rejects commands with stale expected version`
- `resolves pending action only for eligible targets`

Avoid brittle tests:

- Do not test that helper A calls helper B.
- Do not snapshot huge internal objects unless the snapshot itself is the contract.
- Do not assert implementation order unless that order is observable game behavior.
- Do not add direct tests for types, service tags, or wiring-only exports.
- Do not weaken existing meaningful tests just to make the suite pass.

## Deterministic Scenario Helpers

When useful, create reusable helpers for deterministic game scenarios:

- fixed player setup
- fixed seat order
- fixed draw pile/deck
- fixed idempotency keys
- fixed expected version
- command sequence runner
- expected round phase, scores, player states, events, and snapshot assertions

The long-term goal is for game tests to be reproducible and readable: when a test fails, it should clearly identify the broken Flip7 rule or application contract.

## Refactoring Rules

Refactor only when it improves testability without changing behavior.

Acceptable refactors:

- Extract a pure function when a game rule is hidden inside orchestration code.
- Create clear test builders or fixtures to reduce noisy setup.
- Move tests to the correct Vitest project if they currently sit at the wrong level.
- Test through a higher-level public behavior instead of exporting a helper only for tests.

Do not rewrite large areas of the codebase just to satisfy this goal. Keep production behavior unchanged unless a new test exposes a real bug.

## Validation Commands

Run the smallest relevant test command after each focused change:

- game logic: `pnpm test:engine`
- application/infrastructure: `pnpm test:infra`
- public contracts: `pnpm test:contract`
- UI behavior: `pnpm test:ui`
- Confect integration: `pnpm test:confect`

When the touched area passes, also run:

- `pnpm lint`
- `pnpm format:check`

Before declaring the goal complete, run:

- `pnpm test`
- `pnpm lint`
- `pnpm format:check`

## Done Definition

The goal is complete only when all of these are true:

1. Important exported contracts in `game/logic/**` have direct or deterministic scenario-level tests.
2. Important exported contracts in `game/application/**` have orchestration tests where fake services or deterministic inputs verify observable behavior.
3. Existing tests are stronger and protect gameplay/application behavior, not implementation details.
4. There is no obvious high-risk exported domain function left untested.
5. The full test suite, lint, and format checks pass.
6. Any remaining untested exports are intentionally left untested because they are type-only, wiring-only, trivial, or covered through a higher-level test.

## Final Report

When done, summarize:

- contracts classified as important
- tests added or improved
- files changed
- commands run
- any intentionally untested exports and why
