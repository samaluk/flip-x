# Cache Components migration tracker

Tracking breakages surfaced after enabling `cacheComponents: true` and `partialPrefetching: true` in `next.config.ts` (#483). Follow-up work lives in #487 (Playwright `instant()` tests).

Partial prefetch tuning for home → game navigation landed in #486 via `shared/i18n/match-navigation.ts`.

## Config status

| Flag | Value | Since |
|------|-------|-------|
| `cacheComponents` | `true` | #483 (`issue-483-instant-navigation-config`) |
| `partialPrefetching` | `true` | #483 (`issue-483-instant-navigation-config`) |

`partialPrefetching` requires `cacheComponents`; Next.js throws at config validation if only one is set.

Route-level Cache Components migration completed in #485 (`issue-485-cache-components-migration`).

## Dev server startup

`pnpm dev:app` starts cleanly with both flags enabled. Startup logs include:

```
- Cache Components enabled
- Partial Prefetching enabled
```

## Known breakages

### 1. Anonymous session ID blocks prerender — fixed (#483)

| | |
|---|---|
| **Route** | `/[locale]` (all locales) |
| **Message** | `blocking-prerender-crypto-client` — unstable `crypto.randomUUID()` in a Client Component |
| **Source** | `SessionProvider` from `convex-helpers/react/sessions` calls `crypto.randomUUID()` during init when `ssrFriendly` is off; `generateFlipXSessionId` reads/writes `localStorage` via the `idGenerator` prop |
| **Fix** | `SessionProvider` uses `ssrFriendly` and a local `idGenerator` that reads/writes `localStorage` in client `useEffect`; layout wraps `LanguageSwitcher` and `ConvexClientProvider` in `<Suspense>` so client hooks stream after prerender |

Previously blocked build and E2E until fixed in #483.

### 2. Route-level Cache Components work — fixed (#485)

| Route | Status | Notes |
|-------|--------|-------|
| `/[locale]` | Complete (#485) | `loading.tsx` + `HomePageLoading`; `searchParams` parse deferred into Suspense child |
| `/[locale]/game/[matchId]` | Complete (#485) | `loading.tsx` + inline Suspense; `params` await deferred into child component |
| `app/global-not-found.tsx` | OK | Added for dynamic-segment root layout (#517) |

#### `'use cache'` audit (#485)

No safe `'use cache'` targets in scope for this ticket:

- **Convex match state** — must stay live; caching would serve stale game data.
- **`getLocale()` / `getMessages()`** — request-scoped i18n; caching risks stale locale UI.

Future optimization: evaluate `'use cache'` on per-locale message bundles if i18n becomes fully static.

## Validation (#485)

Smoke checks per [`instant-navigation-devtools.md`](./instant-navigation-devtools.md):

```bash
PORTLESS=0 pnpm dev:app   # browse all routes; confirm Instant Insights stays quiet
pnpm build                # static generation for en + es locales
```

| Flow | Result |
|------|--------|
| Direct `/en` | Home shell renders; no Instant Insights blockers |
| Client nav home → game | `GamePageLoading` shell appears on client nav; create/join calls `router.prefetch(..., { kind: "full" })` before `push` (#486); locked by `e2e/instant-navigation.spec.ts` (#487) |
| Join via `?code=XXXX` | Join mode initializes after Suspense resolves |
| In-game Convex updates | Live subscriptions unchanged |

## Ticket map (epic #478)

| Issue | Depends on | Scope |
|-------|------------|-------|
| #483 | #479, #517 | Enable flags + devtool docs |
| #485 | #483 | Route Suspense / cache migration |
| #486 | #485 | Partial prefetch per-link tuning — done (#486) |
| #487 | #485 | Playwright `instant()` regression tests — done (`issue-487-instant-playwright-tests`) |
| #488 | #483, #485 | Offline resilience — in progress (`issue-488-offline-resilience`) |

## Offline resilience (#488)

`experimental.useOffline: true` queues failed soft navigations, prefetches, and Server Actions until connectivity returns. The app shows an `OfflineBanner` in the locale layout and connectivity-aware copy on route loading shells.

| Flag | Value | Since |
|------|-------|-------|
| `experimental.useOffline` | `true` | #488 |

### What Next.js retries

- Soft navigations into prefetched routes
- RSC data fetches blocked by Suspense
- Link prefetches
- Server Actions (none in flip-x today)

### What Next.js does not retry

- Convex `useMutation` / `useConfectMutation` calls (create/join/hit/stay)
- Direct `fetch()` in client components
- Full page reloads while offline (needs a service worker for that)

Gameplay mutations still fail immediately at the Convex client layer when offline. Users see existing toast/error UX for those paths; only framework navigation and RSC streaming get automatic retry.

### Rollback

If offline queuing causes confusing UX with Convex (for example stale optimistic UI while a Next.js navigation is still pending, or users assuming a gameplay mutation will retry when it will not):

1. Remove `experimental.useOffline: true` from `next.config.ts`.
2. Remove `OfflineBanner`, `OfflineLoadingStatus`, and their layout/`loading.tsx` wiring.
3. Remove the `Connectivity` namespace from `messages/en.json` and `messages/es.json`.
4. Redeploy. Pending Next.js requests will fail immediately again instead of queueing.

Validate rollback with `pnpm build` and the instant-navigation Playwright suite (`pnpm test:e2e e2e/instant-navigation.spec.ts`).

Test offline behavior with `next build && next start`; dev mode is not a reliable reference per the Next.js offline guide.
