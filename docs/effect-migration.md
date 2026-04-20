## Confect Migration Path

Confect adoption should stay incremental and should not begin with a schema rewrite or a gameplay rewrite. The migration order is:

1. Scaffold Confect.
2. Add one small Config-backed Confect endpoint.
3. Bridge `convex/admin.ts` into the Confect spec/impl tree using plain Convex function support.
4. Migrate one read-only match query to a true Confect function.
5. Lock the session-handling pattern for Confect functions.
6. Migrate low-risk `matches` write endpoints.
7. Migrate `rounds` before `turns`.
8. Adopt Confect client refs selectively.
9. Reassess whether Confect schema migration is worth the churn.

### Execution Rules

- Only one migration PR may be in flight at a time.
- Before starting a PR, confirm the previous PR is merged.
- After merge, update local `master` before creating the next branch.
- Keep public Convex API behavior stable unless a PR explicitly includes a client migration.
- Keep `convex/schema.ts` as-is until the final schema reassessment step.
- Keep pure game logic in `game/logic/` framework-agnostic.

### Standard PR Workflow

Use this checklist before every migration PR:

- Confirm the previous migration PR is merged.
- Run `git checkout master`.
- Run `git pull --ff-only origin master`.
- Re-read the checklist for the next PR before making changes.
- Create a new branch from updated `master`.
- Keep the PR scoped to a single migration objective.
- Run the smallest relevant verification commands for that PR.
- Open and merge the PR.
- Repeat from updated `master` for the next PR.

### PR 1 Checklist: Scaffold Confect

Goal: add Confect infrastructure with no behavior changes.

Before coding:

- Confirm no existing `confect/` directory is present.
- Confirm current Convex dev flow is working.
- Confirm this PR does not migrate any existing production endpoint.

Changes:

- Add Confect packages required for server-side adoption.
- Add `confect/schema.ts`.
- Add `confect/spec.ts`.
- Add `confect/impl.ts`.
- Add minimal codegen/dev wiring required for local generation.
- Keep the initial spec/impl surface minimal.
- Commit `confect/_generated/*` so the scaffold type-checks without taking over `convex/` yet.

Do not do in this PR:

- No schema migration.
- No client hook migration.
- No endpoint behavior changes.
- Do not let Confect codegen replace the existing hand-written `convex/` directory yet.

Verification:

- Install succeeds.
- Confect codegen runs and generates `confect/_generated/*`.
- Existing `convex/` files are restored after codegen so runtime behavior remains unchanged.
- Existing app tests still pass at the current baseline.

Merge gate:

- Confect scaffolding exists and the repo still behaves exactly as before.

After merge:

- `git checkout master`
- `git pull --ff-only origin master`

### PR 2 Checklist: Add Config Pilot Endpoint

Goal: get the first real runtime benefit from Effect + Confect.

Recommended target:

- Add a small `runtime` or `settings` query implemented in Confect.

Before coding:

- Confirm PR 1 is merged and `master` is up to date locally.
- Pick a single endpoint with a tiny return shape.
- Decide whether it is public or internal.

Changes:

- Add one Confect group spec for the endpoint.
- Add one Confect impl that reads environment/config via Effect `Config`.
- Wire the group into `confect/spec.ts` and `confect/impl.ts`.
- Add focused tests if the endpoint has behavior worth asserting.

Do not do in this PR:

- No migration of existing `matches`, `rounds`, or `turns` functions.
- No shared service/layer abstraction beyond what the endpoint needs.

Verification:

- Confect codegen runs.
- The new endpoint works locally.
- Existing tests remain green.

Merge gate:

- The repo now uses Effect `Config` in one production Confect handler.

After merge:

- `git checkout master`
- `git pull --ff-only origin master`

### PR 3 Checklist: Bridge Admin Through Confect

Goal: register existing admin Convex functions in the Confect spec/impl tree without rewriting their logic.

Before coding:

- Confirm PR 2 is merged and `master` is current.
- Re-read Confect plain Convex function support docs.
- Keep `convex/admin.ts` logic intact unless a small fix is required.

Changes:

- Add `confect/admin.spec.ts` using `FunctionSpec.convex*` constructors.
- Add `confect/admin.impl.ts` that registers the existing Convex functions.
- Wire the admin group into `confect/spec.ts` and `confect/impl.ts`.

Do not do in this PR:

- No admin behavior rewrite.
- No move of admin logic into `Effect.gen` unless strictly necessary.

Verification:

- Confect codegen runs.
- Existing backend admin test/reset flow still works.

Merge gate:

- Admin functions are represented in Confect and still behave identically.

After merge:

- `git checkout master`
- `git pull --ff-only origin master`

### PR 4 Checklist: Migrate First True Confect Read Query

Goal: convert one low-risk match query to a true Confect function with Effect schemas.

Recommended target:

- `getMatchByCode`

Before coding:

- Confirm PR 3 is merged and local `master` is current.
- Confirm the query input/output shape is stable and small.

Changes:

- Add or extend `confect/matches.spec.ts`.
- Add or extend `confect/matches.impl.ts`.
- Define Effect `Schema` for args and returns.
- Migrate only the chosen query.

Do not do in this PR:

- No session-heavy mutations.
- No start of schema/table migration.

Verification:

- Confect codegen runs.
- Query tests pass.
- Frontend callers still receive compatible data.

Merge gate:

- One business query is fully Confect-native and behavior-compatible.

After merge:

- `git checkout master`
- `git pull --ff-only origin master`

### PR 5 Checklist: Lock Session Pattern

Goal: define how Confect functions in this repo will handle `sessionId`.

Before coding:

- Confirm PR 4 is merged and `master` is current.
- Review `convex/lib/session_functions.ts` and the endpoints that depend on it.
- Pick one pattern and document it in the PR description and code.

Recommended pattern:

- Keep `sessionId` explicit in Confect args initially.

Changes:

- Add the minimal helpers or conventions needed for session-aware Confect functions.
- Migrate one small session-aware endpoint only if needed to prove the pattern.

Do not do in this PR:

- No broad migration of all session-aware functions.

Verification:

- Session-aware tests still pass for the migrated endpoint.
- The pattern is simple enough to reuse in later PRs.

Merge gate:

- There is one clear session strategy for all future Confect migrations.

After merge:

- `git checkout master`
- `git pull --ff-only origin master`

### PR 6 Checklist: Migrate Low-Risk `matches` Mutation

Goal: migrate the simplest write path in `matches`.

Recommended order:

- `joinByCode`
- then `createMatch`
- then `joinMatch`
- then `startMatch`

Before coding:

- Confirm PR 5 is merged and local `master` is up to date.
- Pick exactly one mutation from the recommended order.

Changes:

- Extend `confect/matches.spec.ts` and `confect/matches.impl.ts`.
- Migrate only the chosen mutation.
- Keep error behavior and payload shapes stable.

Do not do in this PR:

- No migration of multiple write endpoints at once.
- No gameplay orchestration changes.

Verification:

- Focused backend tests for the chosen mutation pass.
- Existing client flows remain compatible.

Merge gate:

- One low-risk `matches` write endpoint is Confect-native.

After merge:

- `git checkout master`
- `git pull --ff-only origin master`

### PR 7 Checklist: Migrate Remaining `matches` Mutations One At A Time

Goal: finish the `matches` slice before entering gameplay orchestration.

Before coding:

- Confirm the previous `matches` migration PR is merged.
- Pull latest `master`.
- Pick only the next mutation in order.

Changes:

- Migrate the next single `matches` mutation.
- Keep helper extraction minimal and local.

Special caution:

- Treat `startMatch` as the last `matches` mutation because it begins round setup orchestration.

Verification:

- Relevant backend match tests pass.
- No cross-slice changes leak into `rounds` or `turns`.

Merge gate:

- The `matches` slice is complete and stable before starting gameplay PRs.

After merge:

- `git checkout master`
- `git pull --ff-only origin master`

### PR 8 Checklist: Migrate `startNextRound`

Goal: enter gameplay through the simpler orchestration path in `convex/rounds.ts`.

Before coding:

- Confirm all intended `matches` migrations are merged.
- Pull latest `master`.
- Re-check current tests around round startup.

Changes:

- Add or extend a `rounds` Confect group.
- Migrate only `startNextRound`.
- Keep pure game logic in `game/logic/turn-resolution.ts` unchanged unless a bug fix is necessary.

Do not do in this PR:

- No `takeTurn` migration.
- No broad Effect rewrite of gameplay logic.

Verification:

- Focused round-start tests pass.
- Match progression still works locally.

Merge gate:

- Round start orchestration is Confect-native and behavior-compatible.

After merge:

- `git checkout master`
- `git pull --ff-only origin master`

### PR 9 Checklist: Migrate `resolveAction`

Goal: migrate the narrower turn mutation before `takeTurn`.

Before coding:

- Confirm PR 8 is merged and `master` is current.
- Re-read the turn-resolution boundary between Convex orchestration and pure logic.

Changes:

- Extend the Confect turn group.
- Migrate only `resolveAction`.

Do not do in this PR:

- No migration of `takeTurn` in the same PR.

Verification:

- Focused backend turn tests for action resolution pass.
- Pending-action flows remain stable.

Merge gate:

- Action resolution is Confect-native and isolated from the denser `takeTurn` flow.

After merge:

- `git checkout master`
- `git pull --ff-only origin master`

### PR 10 Checklist: Migrate `takeTurn`

Goal: finish Confect adoption for the highest-churn gameplay mutation.

Before coding:

- Confirm PR 9 is merged and `master` is current.
- Re-run the current turn and round tests before changing code.

Changes:

- Migrate only `takeTurn`.
- Keep pure gameplay helpers plain TypeScript.
- Introduce Clock/Random service seams only if they directly help this migration and stay small.

Do not do in this PR:

- No schema rewrite.
- No unrelated gameplay refactor.

Verification:

- Focused backend turn tests pass.
- Unit tests around `game/logic/turn-resolution.ts` remain green.
- Manual gameplay smoke test still works.

Merge gate:

- The most stateful mutation is migrated without changing user-visible gameplay.

After merge:

- `git checkout master`
- `git pull --ff-only origin master`

### Optional PR 11 Checklist: Adopt Confect Client Refs Selectively

Goal: use generated Confect client refs where they improve ergonomics, without a frontend rewrite.

Before coding:

- Confirm enough public functions are already Confect-native to justify client adoption.

Changes:

- Migrate one UI path to use Confect refs/hooks.
- Keep the scope limited to one feature path.

Do not do in this PR:

- No whole-app client migration.

Verification:

- The migrated UI path works locally.
- Existing data flow and loading states still behave correctly.

Merge gate:

- Client adoption proves useful without broad frontend churn.

After merge:

- `git checkout master`
- `git pull --ff-only origin master`

### Optional PR 12 Checklist: Reassess Schema Migration

Goal: decide whether to move `convex/schema.ts` to Confect-backed Effect schemas.

Before coding:

- Confirm the function migration delivered enough value to justify schema churn.
- Inventory repeated validators and shape duplication first.

Decision criteria:

- Proceed only if shared schemas now solve a concrete maintenance problem.
- Skip if the existing Convex schema remains simpler and stable.

If proceeding:

- Do the schema migration in its own PR.
- Keep it separate from business-logic migrations.

Merge gate:

- Schema migration is justified by concrete duplication or type-safety gains, not by completeness alone.
