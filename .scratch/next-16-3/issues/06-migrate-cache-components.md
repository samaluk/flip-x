# 06 — Migrate routes to Cache Components

**What to build:** Home and game routes expose instant loading shells on client navigation — via inline Suspense and/or `'use cache'` where safe — so match setup and game table UI feel SPA-snappy without breaking Convex live updates.

**Blocked by:** 05 — Enable Instant Navigation config flags

**Status:** ready-for-agent

- [ ] Follow bundled guide: migrating to cache components
- [ ] Audit `loading.tsx` usage vs inline Suspense / `'use cache'` per route
- [ ] Home → game navigation shows an instant shell (validate with Navigation Inspector)
- [ ] Convex subscriptions and session-scoped data remain correct — no stale match state from over-caching
- [ ] Locale `generateStaticParams` path still works
