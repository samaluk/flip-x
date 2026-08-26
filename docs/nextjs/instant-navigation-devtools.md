# Instant Navigation devtools

Flip-x enables [Instant Navigation](https://nextjs.org/docs/app/guides/instant-navigation) via `cacheComponents` and `partialPrefetching` in `next.config.ts` (#483). With those flags on, the Next.js DevTools add two panels for validating loading shells during development.

## Prerequisites

Start the app with Cache Components enabled:

```bash
pnpm dev:stack
# or, without portless:
PORTLESS=0 pnpm dev:app
```

On startup you should see:

```
- Cache Components enabled
- Partial Prefetching enabled
```

## Instant Insights

**Instant Insights** surfaces navigations that are not instant. Next.js validates Page and Default segments in development and shows a dev overlay when a route would block instead of showing a loading shell.

### What to look for

1. Browse the app normally (`/`, `/en`, `/en/game/<matchId>`, locale switches).
2. When a navigation blocks, the overlay shows a **blocking-route** insight naming the component and suggested fixes (Stream, Cache, Block cards).
3. Each card links to patterns in the [Instant Navigation guide](https://nextjs.org/docs/app/guides/instant-navigation#fixing-a-navigation-that-blocks). Use **Copy prompt** to hand a fix to an agent.

Validation runs against real requests, so dynamic params like `[matchId]` are checked with the values you actually visit.

### Flip-x smoke checks

| Flow | What to verify |
|------|----------------|
| Direct visit `/en` | Home shell appears; overlay should not report new blockers after #485 is fixed |
| Client nav home → game | Instant Insights should stay quiet once routes expose Suspense shells (#485) |
| Locale switch | `/en` ↔ `/es` should not regress shell coverage |

Track open blockers in [`cache-components-migration.md`](./cache-components-migration.md).

## Navigation Inspector

The **Navigation Inspector** freezes the page at its initial loading state so you can inspect what the user sees before dynamic content streams in.

### Workflow

1. Open the **Next.js DevTools** overlay (bottom-left in development).
2. Select **Navigation Inspector**.
3. Toggle **Pause on navigations** on. The panel shows **Awaiting navigation…**
4. Trigger a navigation:
   - **Page load**: refresh the current URL. The inspector labels the shell **Page load** with the target URL.
   - **Client nav**: click an in-app `<Link>`. The inspector labels the shell **Client nav** with source and target URLs.
5. Inspect fallbacks and cached shell content in the frozen UI.
6. Click **Resume** to complete the navigation, or toggle **Pause on navigations** off when finished.

Pair the inspector with the React DevTools **Suspense** panel to see which boundary covers each part of the tree.

### Flip-x routes to inspect

| Route | Expected shell notes |
|-------|----------------------|
| `/[locale]` (home) | Header + form chrome from layout; match setup streams in client components |
| `/[locale]/game/[matchId]` | `loading.tsx` supplies the game shell on client nav; Convex data streams after |

Client navigations only re-render below the shared `/[locale]` layout, so root-level Suspense boundaries do not cover home → game transitions. Inspect those navigations explicitly.

## Related docs

- [Cache Components migration tracker](./cache-components-migration.md) — known breakages and follow-up tickets
- [Instant Navigation guide](https://nextjs.org/docs/app/guides/instant-navigation) — upstream patterns and Playwright `instant()` tests (#487)
- [Partial Prefetching guide](https://nextjs.org/docs/app/guides/adopting-partial-prefetching) — per-link `prefetch` behavior (home → game uses `router.prefetch` with `kind: "full"` in #486)
