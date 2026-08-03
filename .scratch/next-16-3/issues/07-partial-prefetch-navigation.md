# 07 — Add partial prefetch to critical navigations

**What to build:** The main user path (home lobby setup → game table) prefetches the right amount of target-route UI — not zero, not full aggressive prefetch — using 16.3 partial prefetch controls on next-intl navigation.

**Blocked by:** 06 — Migrate routes to Cache Components

**Status:** ready-for-agent

- [ ] Home create/join → `push(/game/[matchId])` uses partial prefetch API on the navigation primitive (Link or router wrapper)
- [ ] Language switcher navigation reviewed for prefetch behaviour
- [ ] No measurable regression in Convex bandwidth or over-prefetch of dynamic match data
- [ ] Instant Insights reports home→game as instant after changes
