---
name: complete-architecture-checklist
description: Take one Flip 7 architecture checklist document in docs/architecture/ from plan to completion. Use when the user asks an agent to implement, complete, work through, or finish one of the deepening opportunity docs, especially files such as deepen-flip-three-module.md, deepen-target-action-assignment.md, deepen-round-persistence-finalization.md, deepen-match-snapshot-loading.md, or deepen-deterministic-replay-scenarios.md.
---

# Complete Architecture Checklist

## Purpose

Use this skill to complete exactly one `docs/architecture/*.md` checklist end to end. Treat the checklist as the local source of truth, but verify every claim against the current code before editing.

## Required Reading

Before changing code:

1. Read the selected architecture checklist doc.
2. Read `AGENTS.md`.
3. Read `docs/game-rules.md` when gameplay behavior is involved.
4. Read `docs/repo-layout.md` to preserve the intended vertical-slice shape.
5. Read `convex/_generated/ai/guidelines.md` before editing anything under `convex/`, `confect/`, or backend-facing game infrastructure.
6. Read `DESIGN.md` before editing UI.

If the selected checklist references tests, read those tests before changing implementation.

## Workflow

### 1. Select One Checklist

If the user names a file, use that file. If they only ask to "take the next one", inspect `docs/architecture/*.md` and pick the first checklist with meaningful unchecked implementation work. Do not work multiple checklists in one pass unless the user explicitly asks.

Announce the chosen file and the first implementation slice.

### 2. Rebuild Context

Use `rg` and targeted file reads to answer:

- Which modules currently own the behavior?
- Which interface is currently shallow?
- Where should locality improve?
- Which tests already cover the behavior?
- Which checklist items are stale because the code changed?

Do not assume the checklist is current. Update stale checklist wording before or alongside implementation if needed.

### 3. Plan The Slice

Create a short plan with 3-6 steps. Keep the plan tied to checklist items. Prefer the smallest slice that moves the module toward greater depth while preserving behavior.

Use the architecture vocabulary from the checklist:

- Module
- Interface
- Implementation
- Depth
- Seam
- Adapter
- Leverage
- Locality

Avoid introducing a new seam unless there are two real adapters or a concrete variation point.

### 4. Implement

Make scoped code changes that complete checklist items. Preserve existing domain behavior unless the checklist explicitly calls for a behavior change.

Follow these rules:

- Keep public interfaces smaller than the implementation they hide.
- Prefer deepening existing modules over adding pass-through modules.
- Keep Convex and Confect concerns at the edge; gameplay rules belong in `game/`.
- Keep persistence adapters focused on storage mechanics.
- Keep tests at the same seam callers use; avoid testing through private implementation details.
- Update the checklist file as items become complete. Leave partially complete items unchecked and add a short note under the checklist if useful.

### 5. Test

Run the focused tests named in the checklist first. Then run the broader command the checklist asks for when feasible.

If a command cannot run because credentials or external services are missing, report that explicitly and run the closest local substitute.

### 6. Finish The Doc

Before final response:

- Mark completed checklist items with `[x]`.
- Keep incomplete items as `[ ]`.
- Add a short `## Progress Notes` section only when there are important constraints, follow-up work, or verification gaps.
- Do not mark the whole checklist complete unless implementation and verification are actually done.

## Completion Criteria

The task is complete only when:

- The selected checklist has been updated to reflect reality.
- The code changes are scoped to that checklist.
- Focused tests pass, or any inability to run them is explained.
- The final response lists changed files and verification results.

If the work uncovers a load-bearing architectural decision that contradicts the checklist, stop before forcing the refactor. Explain the conflict and ask whether to update the checklist or record an ADR.

