# Repository layout (vertical slices)

This app follows a domain-first layout inspired by [The Vertical Codebase](https://tkdodo.eu/blog/the-vertical-codebase).

## `game/` — Flip 7 product vertical

- `game/logic/` — Pure gameplay core shared by the UI and backend (scoring, turn resolution, card types, view models, round event copy).
- `game/application/` — Command orchestration for gameplay mutations. `run-command.ts` is the single execution path for `START_MATCH`, `START_NEXT_ROUND`, `TAKE_TURN`, and `RESOLVE_ACTION`.
- `game/infrastructure/` — Backend-facing persistence helpers for loading aggregates, saving command results, and building snapshots from Convex documents.
- `game/cards/` — Card rendering (frames, palettes, per-type content).
- `game/ui/` — Composed game UI (table lanes, turn controls, `Flip7Card`, colocated VRT assets).
- `game/screens/` — Flow-level screens (match setup, join, lobby code, game page shell, table orchestration).
- `game/hooks/` — Game-specific hooks (e.g. match presence).

## `shared/` — Cross-cutting app shell

- `shared/ui/` — Design-system primitives (shadcn-style components).
- `shared/i18n/` — Locale routing and next-intl request config.
- `shared/providers/` — App-wide providers (e.g. Convex client + session).
- `shared/lib/` — Small shared helpers (`cn`, Convex error translation).

Routes under `app/[locale]/` stay thin and compose from `game/` and `shared/`.

## `convex/` — Backend

Convex stays at the repo root for a single deployment root. Backend modules import shared rules from `game/logic/` via relative paths.

## `confect/` — Authored backend surface

Confect owns the authored backend contract, schema, and function wiring.

- `confect/*.ts` — Public queries and mutations plus thin session-aware wrappers.
- `confect/*.impl.ts` — Confect framework passthroughs and implementation wiring.
- `confect/lib/` — Backend-specific helpers such as rate limiting and session storage.

Gameplay mutations intentionally stay thin in `confect/`:

1. Validate request arguments and session context.
2. Delegate gameplay execution to `game/application/run-command.ts`.
3. Return the rebuilt match snapshot.

That split keeps Convex and Confect concerns at the edge while the game command flow stays centralized.

## Backend command flow

The gameplay backend now follows a three-layer shape:

1. `confect/` entrypoints accept requests and translate them into a `GameCommand`.
2. `game/application/run-command.ts` loads state, enforces invariants and authorization, dispatches to pure game logic, finalizes rounds when needed, and coordinates persistence.
3. `game/infrastructure/` reads and writes Convex documents:
   - `load-match-aggregate.ts` loads the match, players, latest round, player states, and viewer identity.
   - `save-command-result.ts` persists rounds, player states, events, score breakdowns, and match completion state.
   - `snapshot-store.ts` normalizes Convex documents and rebuilds match snapshots for queries and mutation responses.

This replaces the previous pattern where each gameplay entrypoint duplicated its own load, execute, persist, and snapshot logic.

## Future: monorepo (optional)

If the app grows, `game/` and `shared/` are natural candidates to extract into pnpm workspace packages (e.g. `@flip7/game`, `@flip7/ui`) with Turborepo task graphs and `package.json` `exports` for explicit public APIs.
