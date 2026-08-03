# 05 — Enable Instant Navigation config flags

**What to build:** `cacheComponents` and `partialPrefetching` are enabled in `next.config.ts` behind a deliberate opt-in, with devs able to use Instant Insights and the Navigation Inspector to validate loading shells.

**Blocked by:** 01 — Move from 16.3 preview to 16.3 stable

**Status:** ready-for-agent

- [ ] `cacheComponents: true` and `partialPrefetching: true` added to `next.config.ts`
- [ ] `next dev` starts cleanly; migration warnings documented
- [ ] Short dev guide added (AGENTS.md or docs): use Instant Insights + Navigation Inspector during navigation work
- [ ] Known breakages from enabling flags filed or fixed in ticket 07
