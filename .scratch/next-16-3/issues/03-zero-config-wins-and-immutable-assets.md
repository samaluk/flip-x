# 03 — Verify zero-config wins and immutable static assets

**What to build:** Automatic 16.3 improvements (dev memory, prefetch inlining, native SSR streams, versioned agent docs) are confirmed working; immutable static asset caching is enabled for production deploys where supported.

**Blocked by:** 01 — Move from 16.3 preview to 16.3 stable

**Status:** ready-for-agent

- [ ] Run `next dev` once and verify the version-matched `AGENTS.md` docs block is written/updated
- [ ] Confirm prefetch inlining and dev memory improvements need no app code (note in AGENTS.md or deploy docs)
- [ ] If deployed on Vercel: configure immutable static assets adapter per bundled docs; otherwise document why deferred
- [ ] No user-facing behaviour change required for automatic wins
