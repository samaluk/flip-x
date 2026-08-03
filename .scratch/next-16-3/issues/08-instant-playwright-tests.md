# 08 — Add `instant()` Playwright regression tests

**What to build:** E2E tests lock in which UI must appear immediately during home→game navigation, failing if a refactor moves a blocking boundary into the instant shell.

**Blocked by:** 06 — Migrate routes to Cache Components

**Status:** ready-for-agent

- [ ] `@next/playwright` added; `instant` helper wired into existing Playwright config
- [ ] At least one test covers create/join → game navigation instant shell (e.g. loading skeleton or game chrome)
- [ ] Test passes in CI e2e job (or documented skip if e2e is manual-only)
- [ ] Test names describe user-visible instant content, not implementation
