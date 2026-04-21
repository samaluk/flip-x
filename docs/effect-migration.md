## Confect Full Integration Plan

This document replaces the earlier low-risk incremental migration plan.

The current state of the repo is already beyond the initial scaffold and endpoint-by-endpoint pilot phase. The remaining work is to make the codebase maximally Confect while preserving product behavior and keeping each PR mergeable.

## End State

The target architecture is:

1. `confect/` is the authored backend source of truth.
2. `confect/schema.ts` owns the real database schema.
3. `confect/spec.ts` and group specs own the backend function contract.
4. `confect/impl.ts` and group impls own backend implementation wiring.
5. `confect/_generated/refs.ts` is the public function reference surface for frontend code.
6. Frontend app code uses `@confect/react` and app-local session-aware Confect hooks.
7. `convex/` is treated as Confect codegen output and Convex runtime plumbing, not as the primary home for authored business logic.

## Allowed Convex Exceptions

This plan is intentionally maximal Confect, not zero Convex.

The following exceptions are expected and allowed:

1. `convex/convex.config.ts` remains authored Convex configuration for component registration.
2. Presence remains a sanctioned Convex component island.
3. Presence functions may still be plain Convex functions, but should be represented in the Confect spec/impl tree using the plain-function pattern described in the Confect docs.
4. During the transition, generated wrapper files in `convex/*.ts` continue to exist as the deployable surface produced by Confect codegen.

## Non-Goals

The plan is not trying to:

1. Rewrite pure gameplay logic into Effect for its own sake.
2. Replace `convex-helpers` anonymous sessions.
3. Eliminate every Convex API concept from the repo.
4. Land a flag-day backend and frontend rewrite in one PR.

## Stable Design Decisions

These choices are locked unless a later PR explicitly revisits them:

1. Anonymous sessions remain based on `convex-helpers`.
2. Frontend session behavior is wrapped behind app-local Confect hooks rather than duplicated in every component.
3. Pure game logic under `game/logic/` remains plain TypeScript.
4. Frontend migration ends in a fully Confect client model, but proceeds incrementally through mergeable PRs.
5. Presence is the one explicit component-driven island.

## Current State

The main migration goals in this plan are now complete.

The following groups are represented in Confect:

1. `admin`
2. `matches`
3. `migrations`
4. `presence`
5. `rounds`
6. `settings`
7. `turns`

The following architecture goals are now true:

1. `confect/schema.ts` is the authored schema source of truth.
2. Authored helper logic has been moved out of `convex/lib/*`.
3. Frontend feature flows use Confect refs and app-local session-aware Confect hooks.
4. `@confect/react` is adopted for frontend feature usage.
5. Confect-native refs-based backend tests exist alongside a narrower live Convex smoke layer.

The remaining intentional exceptions are:

1. `convex/convex.config.ts` for component registration.
2. Generated wrapper files in `convex/*.ts`.
3. Presence's component subscription hook on the client, which still uses the Convex component API while routing sync mutations through Confect refs.

## Execution Rules

Use these rules for every remaining migration PR:

1. Only one migration PR may be in flight at a time.
2. Before starting a PR, confirm the previous PR is merged.
3. After merge, update local `master` before creating the next branch.
4. Keep each PR scoped to one migration objective.
5. Preserve current product behavior and payload shapes unless the PR explicitly changes the client contract.
6. Treat `confect:codegen` as owning `convex/`.
7. If codegen removes untouched handwritten files that still matter during the transition, restore them before continuing.
8. If CI or local verification fails, try one targeted fix. If the pipeline fails again, stop and debug before proceeding.

## Standard Verification Pattern

Unless a PR explicitly needs more or less, use this verification baseline:

1. `pnpm confect:codegen`
2. restore untouched handwritten `convex/*` files that codegen removed during the transition
3. `pnpm lint`
4. `pnpm test`
5. `pnpm build`
6. focused local smoke test for the feature path being changed

## PR Sequence

### PR 1: Architecture Lock

Goal: document the final maximal-Confect target and the sanctioned Convex exceptions.

Changes:

1. Rewrite this migration document around the new end-state.
2. Replace the earlier “selective refs, schema maybe later” framing.
3. Explicitly document Presence and `convex/convex.config.ts` as deliberate exceptions.
4. Explicitly document the session-wrapper strategy for frontend Confect hooks.

Merge gate:

1. The repo has a clear target architecture.
2. The remaining PR sequence is documented.

### PR 2: Confect Schema Foundation

Goal: make `confect/schema.ts` the real schema source of truth.

Changes:

1. Port the full schema from `convex/schema.ts` into Confect form.
2. Preserve all table names, field semantics, and indexes.
3. Regenerate Confect services against the real schema.

Do not do in this PR:

1. No frontend migration.
2. No helper relocation.
3. No gameplay behavior changes.

Merge gate:

1. `confect/schema.ts` fully models the current app schema.
2. Generated Confect services reflect the real data model.

### PR 3: Backend Helper Relocation

Goal: move authored helper ownership out of `convex/lib/*`.

Changes:

1. Move pure helpers into `shared/` or `game/`.
2. Move backend orchestration helpers into `confect/`.
3. Reduce imports from `../convex/lib/*` in Confect-authored files.

Merge gate:

1. Authored app helper logic is no longer centered in `convex/lib/*`.

### PR 4: Confect Services Adoption

Goal: make Confect impls use more of the real Confect service model.

Changes:

1. Adopt generated services like `DatabaseReader`, `DatabaseWriter`, and runners where that improves ownership and clarity.
2. Reduce purely mechanical dependence on raw Convex ctx access.

Merge gate:

1. Backend Confect code is more service-native, without behavior changes.

### PR 5: Presence Backend Integration

Goal: bring Presence into the Confect spec/impl tree while keeping it a sanctioned component island.

Changes:

1. Add a Confect `presence` group.
2. Use plain Convex function support where required by the Presence component.
3. Keep `convex/convex.config.ts` as the component registration home.

Merge gate:

1. Presence is represented in Confect.
2. Presence behavior is unchanged.

### PR 6: Admin and Migrations Integration Cleanup

Goal: reduce remaining Convex-only operational seams.

Changes:

1. Refine `admin` and migration-related integration so remaining direct Convex internals are deliberate and minimal.
2. Keep any required component-oriented plumbing explicit.

Merge gate:

1. Admin and migration wiring matches the final Confect-first architecture.

### PR 7: Frontend Confect Foundation

Goal: prepare the client for Confect refs without rewriting all feature paths yet.

Changes:

1. Add `@confect/react`.
2. Keep `ConvexProvider` and `ConvexReactClient`.
3. Keep anonymous sessions backed by `convex-helpers`.
4. Add app-local session-aware Confect hooks that inject `sessionId` automatically.

Merge gate:

1. Frontend has a stable Confect hook layer.
2. Anonymous session behavior is unchanged.

### PR 8: Frontend Migration - Lobby Flow

Goal: migrate the create/join/lookup lobby flow to Confect refs.

Merge gate:

1. Lobby lookup, create, and join flows work through Confect hooks.

### PR 9: Frontend Migration - Match Page Data

Goal: migrate the main match page query and join flow to Confect refs.

Merge gate:

1. Match page data flow is Confect-native and behavior-compatible.

### PR 10: Frontend Migration - Gameplay Controls

Goal: migrate gameplay action hooks to Confect refs.

Merge gate:

1. Gameplay controls use Confect refs and session wrappers end-to-end.

### PR 11: Presence Frontend Alignment

Goal: make Presence the only intentional client-side special case.

Merge gate:

1. Presence still works.
2. Presence is the only expected component-driven exception on the client.

### PR 12: Confect Test Foundation

Goal: add a Confect-native refs-first testing path.

Changes:

1. Add `@confect/test` and related test dependencies.
2. Add a reusable `TestConfect` harness.

Merge gate:

1. At least one backend suite runs through Confect refs and decoded schemas.

### PR 13: Test Migration

Goal: migrate core backend behavior tests toward the Confect-native test model.

Merge gate:

1. Core backend behavior is covered by Confect-native tests.
2. A narrow live Convex smoke layer still exists for runtime realism.

### PR 14: Cleanup and Enforcement

Goal: make the final architecture true in practice.

Changes:

1. Remove remaining feature-code imports from `convex/_generated/api`.
2. Remove obsolete Convex-first helpers.
3. Reduce authored code in `convex/` to generated/runtime plumbing and sanctioned exceptions.

Merge gate:

1. Backend authored source of truth is Confect.
2. Frontend feature code is Confect-driven.
3. Presence remains the one explicit island.

## Final Success Criteria

This migration is complete when:

1. `confect/schema.ts` is authoritative.
2. App backend features are authored in Confect.
3. Frontend features use `@confect/react` and Confect refs.
4. Anonymous sessions still work, but only through app-local Confect wrappers.
5. Presence remains operational through the documented plain-Convex component pattern.
6. `convex/` is no longer the primary home for authored business logic.

## Completion Status

This plan's intended end-state has been reached, with Presence preserved as the single sanctioned component-driven exception.
