# 09 — Add experimental offline resilience

**What to build:** Brief connectivity drops during soft navigation or Server Actions do not hard-fail the app; users see an offline banner and pending work retries when the network returns.

**Blocked by:** 05 — Enable Instant Navigation config flags; 06 — Migrate routes to Cache Components

**Status:** ready-for-agent

- [ ] `experimental.useOffline: true` enabled in `next.config.ts`
- [ ] `OfflineBanner` (or equivalent) uses `useOffline` from `next/offline`
- [ ] Prefetched route shells still render offline; data streams after reconnect
- [ ] i18n strings for offline state
- [ ] Rollback documented if Convex mutations conflict with pending-retry semantics
