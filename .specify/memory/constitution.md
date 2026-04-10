<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Placeholder principles replaced with concrete principles for code quality, testing,
  user experience consistency, and performance requirements
Added sections:
- Operational Standards
- Delivery Workflow
Removed sections:
- None
Templates requiring updates:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
- ✅ .specify/templates/commands/*.md (no files present)
Follow-up TODOs:
- None
-->

# Flip7 Constitution

## Core Principles

### I. Code Quality Is a Release Gate

All production code MUST be readable, intentionally scoped, and maintainable by a
teammate without tribal knowledge. Changes MUST prefer the smallest correct design,
use clear naming, remove dead paths rather than layering around them, and keep modules
cohesive. Reviews MUST reject undocumented complexity, speculative abstractions, and
partially finished refactors. Rationale: long-term delivery speed depends on code that
is easy to reason about and safe to change.

### II. Tests Prove Behavior

Every material behavior change MUST include tests that fail before the change and pass
after it. The test mix MUST match the risk: unit tests for local logic, integration
tests for cross-component behavior, and regression tests for fixed defects. Features
MUST NOT be merged when required tests are missing, flaky, or bypassed. Rationale:
test evidence is the primary proof that code works and keeps working.

### III. User Experience Must Be Consistent

User-facing changes MUST follow established interaction patterns, terminology,
accessibility expectations, and visual conventions already present in the product
unless a deliberate product-wide change is approved. New flows MUST define their
empty, loading, success, and error states. Specifications and reviews MUST evaluate
consistency across desktop and mobile contexts when applicable. Rationale: predictable
interfaces reduce user error and support burden.

### IV. Performance Is a Defined Requirement

Performance-sensitive work MUST declare measurable targets before implementation and
verify them before release. Every feature plan MUST document latency, throughput,
rendering, or resource constraints relevant to the change, along with the intended
measurement method. Changes that risk regressions MUST include profiling, benchmarks,
or production-safe instrumentation sufficient to show compliance. Rationale:
performance is a product requirement, not a late optimization pass.

## Operational Standards

- Plans MUST state the affected code paths, testing scope, user-visible impact, and
  performance expectations before implementation begins.
- Specifications MUST include measurable acceptance criteria for both behavior and
  user experience, not only functional output.
- Pull requests MUST summarize the risk area, evidence used to validate the change,
  and any follow-up work intentionally deferred.
- If a requirement cannot be satisfied in the current change, the gap MUST be called
  out explicitly with rationale and a tracked follow-up.

## Delivery Workflow

- The Constitution Check in each implementation plan MUST confirm compliance with all
  four core principles before design and again before delivery.
- Task lists MUST include the tests, UX validation steps, and performance validation
  work needed to satisfy the plan; these are mandatory deliverables, not optional
  polish.
- Reviewers MUST block changes that lack adequate test evidence, introduce avoidable
  UX inconsistency, or modify critical paths without performance validation.
- Releases and handoffs MUST include enough verification detail for another engineer
  to reproduce the result.

## Governance

This constitution overrides conflicting local habits or undocumented process.
Amendments require the constitution file to be updated together with any affected
templates or workflow documents in the same change.

Versioning follows semantic versioning for governance documents:
- MAJOR for removed or fundamentally redefined principles or governance rules.
- MINOR for new principles, new mandatory sections, or materially expanded guidance.
- PATCH for clarifications, wording improvements, or non-semantic fixes.

Compliance review is mandatory for every plan, specification, task list, and pull
request. Violations MUST be corrected before approval unless the exception is
documented in the relevant artifact with rationale, impact, and explicit approval.

**Version**: 1.0.0 | **Ratified**: 2026-04-10 | **Last Amended**: 2026-04-10
