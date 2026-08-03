# 02 — Tune CI for Turbopack filesystem build cache

**What to build:** CI builds benefit from Next 16.3's default Turbopack disk cache for `next build`, with cache paths and keys aligned to the new `.next` artifact layout so repeat PR builds are measurably faster.

**Blocked by:** 01 — Move from 16.3 preview to 16.3 stable

**Status:** ready-for-agent

- [ ] `turbopackFileSystemCache` (or post-upgrade default) understood and documented for this repo
- [ ] `.github/workflows/ci.yml` cache step reviewed — keep, extend, or replace the existing `actions/cache` on `.next/cache`
- [ ] At least one CI build log confirms cache hits on a no-op follow-up build (or documented why not applicable)
- [ ] No regression in build reliability on clean cache
