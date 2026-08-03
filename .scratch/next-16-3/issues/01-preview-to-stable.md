# 01 — Move from 16.3 preview to 16.3 stable

**What to build:** flip-x pins `next@16.3.0` (npm `latest`), dropping the `16.3.0-preview.10` line, with a green lint/test/build chain and AGENTS.md updated to say stable.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `next` bumped from `16.3.0-preview.10` to `16.3.0` (stable)
- [ ] Lockfile updated; no accidental preview/canary resolution
- [ ] `pnpm ci:local` passes
- [ ] AGENTS.md says "Next.js 16.3" (stable), not preview
- [ ] Release notes diff skimmed for preview→stable breaking changes
