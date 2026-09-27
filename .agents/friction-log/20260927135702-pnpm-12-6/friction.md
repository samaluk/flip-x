---
title: 'pnpm 12.6 isolates Playwright webServer children and hangs teardown'
severity: 'major'
target: 'pnpm/pnpm'
---

### Expected Behavior

Playwright should stop its web server and exit after the E2E tests finish.

### Current Behavior

With pnpm 12.6.0, a Playwright webServer command that runs through pnpm leaves the server in a separate process group after Playwright sends SIGKILL. The orphan holds stdout/stderr open, so Playwright hangs in teardown. PR #838's CI hit its one-hour job timeout on repeated attempts. The GitHub reporter did not print passing tests, obscuring that this was teardown.

### Possible Solution

Launch the dedicated Next.js E2E server directly with Node. Upstream issue: https://github.com/pnpm/pnpm/issues/15555; fix: https://github.com/pnpm/pnpm/pull/15564 (merged but absent from 12.6.0). Keep per-test CI progress and a step timeout.

### Minimal Reproducible Example

Configure Playwright with a passing, browser-free test and a webServer command of `pnpm exec node server.cjs`, where server.cjs starts a Node HTTP server. Under pnpm 12.6.0, the assertion completes in 2 ms but the process remains alive beyond 15 seconds. Killing the HTTP server lets Playwright finish. Change only the command to `node server.cjs`: the same invocation exits successfully in 1.5 seconds. The project's real Next.js webServer command is also checked with a browser-free test before CI validation.

### Context

Diagnosing and fixing the pnpm 12.6.0 update in https://github.com/samaluk/flip-x/pull/838. Worker startup and project fixture imports passed independently; the hang is in server teardown, not test execution or Convex deployment.
