# Agent learning loop

Flip-x uses three distinct homes for development knowledge:

- Frog records unresolved development friction: a recurring papercut in tooling, docs, APIs, tests, or conventions that still needs an owner or fix.
- [`LESSONS.md`](../../LESSONS.md) is a temporary inbox for verified, durable, non-obvious discoveries made while resolving work.
- The shared [`lessons-to-config` skill](../../.agents/skills/lessons-to-config/SKILL.md) promotes an accepted lesson into its narrowest durable repository form and removes it from the inbox.

## Frog

Use the repository's Action-only setup. It uses the repository `GITHUB_TOKEN`, has inbound reporting disabled, does not report across repositories, and has no `pull_request` or `pull_request_target` trigger. Do not install the Frog App or add Frog to project dependencies; `pnpx` serves interactive agents, and the Action installs its own pinned copy in the runner.

Before substantial work, run `pnpx frog list`. When unresolved development friction is hit, record it with `pnpx frog log` in the same turn and commit the entry with the work that exposed it. Do not use Frog for game defects, feature requests, secrets, or global/system friction. The workflow owns the recurring `frog/sync` pull request; do not hand-edit that generated branch.

Frog ships project-local agent skills under `.agents/skills/frog-*` for `init`, `list`, `log`, `publish`, `sync`, and `targets`. They are synced with the pinned `pnpx frog@1.0.15 skills add --no-global` and are not tracked by `skills-lock.json`, so restore them with that command rather than the skills CLI lockfile. The sync also writes symlink dirs for other agent tools, such as `.claude/skills` and `.continue/skills`; remove those generated dirs after syncing so the working tree stays clean.

## LESSONS.md

Add a lesson only after the discovery has been verified against current code, tests, documentation, generated artifacts, or a deterministic local command. A useful entry explains:

1. what was observed;
2. the invariant that remains true;
3. the evidence that verifies it; and
4. the smallest durable destination to consider.

Do not add scoring bugs, feature ideas, task notes, speculative architecture, transient test output, stale workarounds, or secrets. If the underlying behavior is fixed and no durable invariant remains, delete the lesson without promoting it.

## Promotion routing

Use [`lessons-to-config`](../../.agents/skills/lessons-to-config/SKILL.md) to validate and route each inbox entry. Prefer, in order:

- gameplay regression tests for pure rules and deterministic state;
- contract tests for public snapshot, replay, and generated-contract shapes;
- infrastructure tests for persistence and serialization boundaries;
- type or package boundaries for unsupported imports and public surfaces;
- deterministic validation scripts and isolated environment commands for repeatable setup or harness behavior;
- ADRs for durable architectural boundaries and tradeoffs;
- scoped agent rules for subtree-only constraints;
- reusable diagnostic skills for repeatable multi-step investigations.

Keep Flip-x architecture knowledge in the relevant code, tests, docs, ADRs, scripts, or scoped rules. Root `AGENTS.md` should contain only short rules that apply globally. After promotion, remove the full lesson from `LESSONS.md`; do not preserve a workaround after its cause disappears.
