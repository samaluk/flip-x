# Repository layout (vertical slices)

This app follows a domain-first layout inspired by [The Vertical Codebase](https://tkdodo.eu/blog/the-vertical-codebase).

## `game/` — Flip 7 product vertical

- `game/logic/` — Pure gameplay core shared by the UI and Convex (scoring, turn resolution, card types, view models, round event copy).
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

## Future: monorepo (optional)

If the app grows, `game/` and `shared/` are natural candidates to extract into pnpm workspace packages (e.g. `@flip7/game`, `@flip7/ui`) with Turborepo task graphs and `package.json` `exports` for explicit public APIs.
