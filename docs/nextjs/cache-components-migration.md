# Cache Components migration tracker

Tracking breakages surfaced after enabling `cacheComponents: true` and `partialPrefetching: true` in `next.config.ts` (#483). Follow-up work lives in #485 (route migration) and #486 (partial prefetch tuning).

## Config status

| Flag | Value | Since |
|------|-------|-------|
| `cacheComponents` | `true` | #483 |
| `partialPrefetching` | `true` | #483 |

`partialPrefetching` requires `cacheComponents`; Next.js throws at config validation if only one is set.

## Dev server startup

`pnpm dev:app` starts cleanly with both flags enabled. Startup logs include:

```
- Cache Components enabled
- Partial Prefetching enabled
```

## Known breakages

### 1. Anonymous session ID blocks prerender — fixed (minimal)

| | |
|---|---|
| **Route** | `/[locale]` (all locales) |
| **Message** | `blocking-prerender-crypto-client` — unstable `crypto.randomUUID()` in a Client Component |
| **Source** | `SessionProvider` from `convex-helpers/react/sessions` calls `crypto.randomUUID()` during init when `ssrFriendly` is off; `generateFlipXSessionId` reads/writes `localStorage` via the `idGenerator` prop |
| **Fix** | `SessionProvider` uses `ssrFriendly` and a local `idGenerator` that reads/writes `localStorage` in client `useEffect`; layout wraps `LanguageSwitcher` and `ConvexClientProvider` in `<Suspense>` so client hooks stream after prerender |
| **Remaining (#485)** | Route-level Suspense / `'use cache'` audit, Navigation Inspector validation for home → game |

Previously blocked build and E2E until fixed; the full Cache Components route migration remains in #485.

### 2. Route-level Cache Components work — #485 (scope)

| Route | Status | Notes |
|-------|--------|-------|
| `/[locale]` | Build unblocked | Session provider uses `ssrFriendly`; route cache audit remains in #485 |
| `/[locale]/game/[matchId]` | Pending audit | Has `loading.tsx`; needs Suspense / `'use cache'` audit in #485 |
| `app/global-not-found.tsx` | OK | Added for dynamic-segment root layout (#517) |

## Migration warnings (expected)

With flags enabled, Instant Insights may still report route-level blockers until #485 lands (Suspense boundaries, `'use cache'` on safe fetches). Re-run after #485:

```bash
PORTLESS=0 pnpm dev:app   # browse all routes; confirm Instant Insights stays quiet
pnpm build                # should complete static generation
```

## Ticket map (epic #478)

| Issue | Depends on | Scope |
|-------|------------|-------|
| #483 | #479, #517 | Enable flags + devtool docs (this change) |
| #485 | #483 | Fix session provider + route Suspense / cache migration |
| #486 | #485 | Partial prefetch per-link tuning |
| #487 | #485 | Playwright `instant()` regression tests |
