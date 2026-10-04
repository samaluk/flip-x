---
title: 'Fallow duplication defaults miss Convex and Confect generated directories'
severity: 'minor'
target: 'fallow-rs/fallow'
---

## Expected Behavior

Fallow's built-in generated-file duplication ignores should recognize Convex and Confect `_generated` directories.

## Current Behavior

PR #887 received four code-duplication findings for two clone groups in `confect/_generated/services.ts` (`dup:b2493499` and `dup:efc1bb81`). These blocks export distinct service values and types; extracting a shared runtime function is inappropriate. The repo already excludes both generated directories through `ignoreFindings`, but that option only filters dead-code findings and does not affect duplication analysis.

## Possible Solution

Add `convex/_generated/**` and `confect/_generated/**` to built-in duplication ignores. The project workaround is `duplicates.ignore` with those two globs, preserving generated files in the module graph and keeping hand-written code subject to duplication checks.

## Minimal Reproducible Example

At commit `c74f38d`, run `pnpm exec fallow dupes --trace dup:b2493499 --format json --quiet`. The clone locations are `confect/_generated/services.ts:27-45` and `:65-88`. A trace for `dup:efc1bb81` reports `:39-69` and `:71-105`. Adding `duplicates.ignore` removes both generated groups; the hand-written `GroupImpl` wiring groups remain visible.

## Context

Verified while addressing Fallow review comments on https://github.com/samaluk/flip-x/pull/887. The missing generated-directory exclusion sent reviewers toward refactoring code owned by Confect's generator.
