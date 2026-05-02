# Deepen Match Snapshot Loading

## Goal

Make current match snapshot construction a deeper module with one domain-level interface for building the viewer-specific snapshot.

## Current Files

- `game/infrastructure/snapshot-store.ts`
- `game/logic/view-models.ts`
- `game/infrastructure/round-history-builder.ts`
- `confect/matches.ts`
- `tests/contract/match-snapshot-contract.test.ts`
- `tests/builders/match-snapshot.ts`

## Problem

Snapshot construction mixes loading, session lookup, normalization, latest-event selection, round history loading, and view model shaping. Callers must know whether they have a match document, a round document, a match id, or a session id, and they sometimes assemble the snapshot path themselves.

The deletion test says `snapshot-store.ts` is useful because snapshot complexity would spread across Confect entrypoints. The opportunity is to deepen its interface so callers ask for the current match snapshot for a viewer and do not know the internal loading sequence.

## Desired Shape

Create a deeper match snapshot module around one primary operation: build the current match snapshot for a viewer.

Internally, the module may still have loaders and normalizers for:

- Match document.
- Player documents.
- Latest round.
- Round player states.
- Latest event.
- Round history.
- Viewer player id.
- Runtime deserialization.
- View model assembly.

Those helpers should remain internal unless another module has a real need for the seam.

## Checklist

- [ ] Read `docs/repo-layout.md`, especially the backend command flow and snapshot store description.
- [ ] List every call site for `buildSnapshot`, `buildLatestMatchSnapshot`, `getLatestRound`, and `buildMatchSnapshot`.
- [ ] Decide whether public callers should use only `buildCurrentMatchSnapshotForViewer` or equivalent domain naming.
- [ ] Reduce caller knowledge in `confect/matches.ts` so it does not assemble match/round/session combinations.
- [ ] Keep `buildMatchSnapshot` available only if contract tests or pure view model tests need that seam.
- [ ] Move latest event and round history loading behind the snapshot module interface.
- [ ] Ensure setup-state snapshots still work when no round exists.
- [ ] Ensure viewer-specific fields like `viewerPlayerId` and `isHost` remain correct.
- [ ] Update contract tests to clarify whether they test pure view model shape or infrastructure snapshot loading.
- [ ] Run `pnpm test:contract -- tests/contract/match-snapshot-contract.test.ts`.
- [ ] Run `pnpm test`.

## Verification Questions

- [ ] Can Confect callers request a snapshot without knowing about latest round lookup?
- [ ] Is the snapshot interface small relative to the behavior it performs?
- [ ] Are normalization and round history concerns local to snapshot construction?
- [ ] Did tests become clearer about pure view model behavior versus persisted snapshot loading?

