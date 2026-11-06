---
title: 'Oxlint 1.91 React immutability rejects effect-local async scheduler bindings'
severity: 'minor'
target: 'oxc-project/oxc'
---

## Expected Behavior

The dependency release notes identify newly enabled React Compiler diagnostics affecting existing effect-local scheduling code.

## Current Behavior

Updating oxlint from 1.90.0 to 1.91.0 makes `pnpm lint:core` reject `game/hooks/use-match-presence.ts`: reassignment of `timeoutId` from the async heartbeat reports `react/immutability`. Replacing that binding exposes cleanup's `ignore` reassignment as a second error.

## Possible Solution

Keep the cancellation flag and timer handle in one const effect-local lifecycle object. Full lint accepts both property assignments without suppressing rules. Preserve serial heartbeat scheduling, retry, and cleanup; regression tests cover pending timer cancellation and in-flight completion after unmount.

## Minimal Reproducible Example

On dependency PR #1068 at `9df17662c94e471f9db21c2d6a4274b3bac34e5f`, run `pnpm install --frozen-lockfile` and `pnpm lint:core`. It reports `Cannot reassign variable in async function` at `use-match-presence.ts:89`.

## Context

The dependency update failed its required static check. No lint rules or security checks needed weakening to fix it.
