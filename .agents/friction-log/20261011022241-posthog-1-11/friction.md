---
title: 'PostHog 1.11.2 skips ID injection for Turbopack server chunks'
severity: 'major'
target: '@posthog/nextjs-config'
---

Production builds using Next.js 16.4 Turbopack began failing after @posthog/nextjs-config 1.11.1 → 1.11.2. The new default event release mode enables native debug IDs and switches the compilation hook from sourcemap process to sourcemap upload, but SSR chunks can lack a chunk ID. The CLI then aborts with "Chunk ID not found" after compilation. Reproduced with the actual project config and PostHog CLI against a one-chunk fixture and loopback mock API in tests/unit/shared/posthog-source-maps.test.ts. Explicit sourcemaps.releaseMode: "symbol-set" restores injection, upload preparation, and map cleanup. CI builds without PostHog credentials miss this failure path. No production credentials or writes are needed to reproduce.
