# Next.js 16.3 adoption — flip-x

## Goal

Move flip-x from **Next.js 16.3 preview** to **16.3 stable**, then adopt every remaining 16.3 feature that applies — including experimental flags — before they become defaults.

## Current state (post-pull, master)

- `next@16.3.0-preview.10` — preview, not stable (`16.3.0` is on npm `latest`).
- `typescript@7.0.2` with `experimental.useTypeScriptCli: true` in `next.config.ts` — **done**.
- React 19.2.8; AGENTS.md already documents 16.3 preview + TS7.
- No `cacheComponents`, `partialPrefetching`, `reactCompiler`, or `useOffline` flags.
- Game route has `loading.tsx` and legacy client `error.tsx`.
- Navigation is `useRouter().push` via next-intl (home → game).
- Playwright e2e exists; no `@next/playwright` `instant()` helper.
- Convex-backed dynamic match routes; `generateStaticParams` only for locales.
- **Out of scope:** `import.meta.glob` — no file-backed content routes.

## Already done (close/skip tickets)

| Feature | Status |
|---|---|
| TypeScript 7 + `useTypeScriptCli` | ✅ on master — close #480 |
| Preview line adoption | ✅ on `16.3.0-preview.10` |

## Remaining feature map

| 16.3 feature | Ticket |
|---|---|
| Preview → stable (`16.3.0`) | 01 / #479 |
| Turbopack filesystem build cache in CI | 03 / #481 |
| Zero-config wins + immutable assets | 04 / #482 |
| `catchError` error boundaries | 05 / #484 |
| Instant Navigations flags | 06 / #483 |
| Cache Components migration | 07 / #485 |
| Partial prefetch on navigations | 08 / #486 |
| `instant()` Playwright tests | 09 / #487 |
| Offline resilience (experimental) | 10 / #488 |
| Rust React Compiler eval | 11 / #489 |

Automatic wins (dev memory, prefetch inlining, native SSR streams, versioned agent docs) ship with the stable bump — verified in #482.

## Success criteria

- `next@16.3.0` (stable, not preview) with green CI.
- Game error boundary supports server retry via `catchError`.
- Instant navigation flags enabled; home→game shows instant loading shell.
- At least one `instant()` e2e test on the critical path.
- Experimental features behind flags with rollback notes in AGENTS.md.
