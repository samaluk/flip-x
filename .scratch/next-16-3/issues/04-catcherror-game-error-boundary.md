# 04 — Migrate game error boundary to `catchError`

**What to build:** When the game route fails during server rendering, players see the existing error UI and can retry in a way that re-fetches server components — without the boundary swallowing `notFound` or `redirect`.

**Blocked by:** 01 — Move from 16.3 preview to 16.3 stable

**Status:** ready-for-agent

- [ ] Game route error handling uses `catchError` from `next/error` per 16.3 API
- [ ] Retry triggers a server re-render of failed segments, not just client state reset
- [ ] PostHog exception capture and i18n copy preserved
- [ ] UI test or manual verification that `notFound` / `redirect` on sibling routes still work
