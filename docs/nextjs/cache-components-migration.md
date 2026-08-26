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

### 1. Anonymous session ID blocks prerender — #485

| | |
|---|---|
| **Route** | `/[locale]` (all locales) |
| **Message** | `blocking-prerender-crypto-client` — unstable `crypto.randomUUID()` in a Client Component |
| **Source** | `shared/providers/convex-client-provider.tsx` — `SessionProvider` from `convex-helpers/react/sessions` |
| **Dev** | Instant Insights overlay on first visit to `/` or `/en` |
| **Build** | `next build` fails prerendering `/en` (`Export encountered an error on /[locale]/page`) |
| **Fix direction** | Wrap `ConvexClientProvider` in `<Suspense>` or defer session ID generation to `useEffect` (see [Next.js docs](https://nextjs.org/docs/messages/blocking-prerender-crypto-client)) |

This is the only blocker observed after #517 (root layout under `app/[locale]/`). Game routes inherit the layout failure until the session provider is fixed.

### 2. Route-level Cache Components work — #485 (scope)

| Route | Status | Notes |
|-------|--------|-------|
| `/[locale]` | Blocked | Session provider prerender error |
| `/[locale]/game/[matchId]` | Pending audit | Has `loading.tsx`; needs Suspense / `'use cache'` audit once #485 unblocks build |
| `app/global-not-found.tsx` | OK | Added for dynamic-segment root layout (#517) |

## Migration warnings (expected)

With flags enabled but before #485 lands, expect:

1. **Instant Insights overlay** on home — `crypto.randomUUID()` validation error (see above).
2. **`pnpm build` failure** during static generation of locale home pages — same root cause.
3. **No config validation errors** — flags are recognized on Next.js 16.3.2.

After fixing #485, re-run:

```bash
PORTLESS=0 pnpm dev:app   # browse all routes; confirm Instant Insights stays quiet
pnpm build                # should complete static generation
```

Use [`instant-navigation-devtools.md`](./instant-navigation-devtools.md) to validate shells with Navigation Inspector before closing #485.

## Ticket map (epic #478)

| Issue | Depends on | Scope |
|-------|------------|-------|
| #483 | #479, #517 | Enable flags + devtool docs (this change) |
| #485 | #483 | Fix session provider + route Suspense / cache migration |
| #486 | #485 | Partial prefetch per-link tuning |
| #487 | #485 | Playwright `instant()` regression tests |
