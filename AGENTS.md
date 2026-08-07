# AGENTS.md

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project Overview

Flip-x is a shared-table web app for playing the press-your-luck card game with
live turn tracking, action-card resolution, and automatic scoring to 200 points.

- Runtime stack: TypeScript 7.0.2 (Next `experimental.useTypeScriptCli`),
  Next.js 16.3, React 19.2.8, Convex, Confect, Effect.
- UI stack: Tailwind CSS 4, shadcn/ui, Base UI, Lucide icons, Motion.
- Testing stack: Vitest 4.1.5, Playwright 1.59.1, convex-test.
- Package manager: `pnpm@11.13.1`.

Architecture references:

- `docs/repo-layout.md` describes the repository layout.
- Gameplay mutations flow through thin `confect/` entrypoints into
  `game/application/run-command.ts`.
- Pure rules live in `game/logic/`.
- Convex document loading, persistence, and snapshot rebuilding live in
  `game/infrastructure/`.

## Required Reading

- For UI changes, read `DESIGN.md` before editing. Use only its colors,
  typography, spacing, radii, and component patterns unless the user explicitly
  asks to deviate. Follow its `## Do's and Don'ts` section.
- For Convex changes, read `convex/_generated/ai/guidelines.md` before editing
  Convex code. Those rules override general Convex knowledge.
- For Next.js changes, read the relevant docs under `node_modules/next/dist/docs/`
  before editing.

If `DESIGN.md` changes, run `pnpm design:lint` before finishing.

## Development Workflow

Install dependencies:

```bash
pnpm install
```

Start local Convex sync, which refreshes `.env.local`:

```bash
npx convex dev
```

Start the Next.js dev server through portless:

```bash
pnpm dev
```

The app runs at `https://flip-x.localhost`. In git worktrees, portless prepends
the branch name, for example `https://<branch>.flip-x.localhost`.

Useful development commands:

- `pnpm dev:stack`: start Convex and the app together.
- `pnpm convex:dev`: start Convex development sync.
- `pnpm dev:app`: run `next dev` directly.
- `PORTLESS=0 pnpm dev`: bypass portless and use direct localhost serving.
- `pnpm confect:codegen`: regenerate Confect types and bindings.
- `pnpm confect:dev`: run Confect development tooling.

## Quality Checks

- `pnpm lint`: run oxlint with `oxlint-tsgolint` type-aware rules and
  `--type-check` (typescript-go compiler diagnostics). Production sources use
  [tsconfig.json](tsconfig.json); tests and `*.test.*` files are excluded from
  that project so type-check matches `tsc` on the same graph.
- `pnpm lint:fix`: run oxlint autofixes with the same type-aware and type-check
  setup.
- `pnpm exec tsc --project tsconfig.json --noEmit`: TypeScript 7 check against
  the same `tsconfig` graph as Oxlint type-check. `next build` uses the same
  CLI via `experimental.useTypeScriptCli`.
- `OXC_LOG=debug pnpm lint`: diagnose slow or memory-heavy type-aware runs.
- `pnpm format:check`: check formatting with oxfmt.
- `pnpm format`: write formatting changes with oxfmt.
- `pnpm i18n:check`: validate locale messages and usage.
- `pnpm design:lint`: validate `DESIGN.md`.
- `pnpm build`: run the Next.js production build.

Run the narrowest meaningful checks while working, then broaden before handing
off changes that touch shared behavior.

## Testing

Detailed reference: `docs/testing.md`.

- `pnpm test`: fast local default; runs Vitest `engine`, `infrastructure`,
  `contract`, `ui`, and `confect` projects.
- `pnpm test:engine`: pure gameplay logic tests.
- `pnpm test:infra`: infrastructure tests.
- `pnpm test:contract`: contract tests.
- `pnpm test:ui`: UI tests.
- `pnpm test:confect`: Confect tests.
- `pnpm test:backend`: Convex backend smoke tests.
- `pnpm test:e2e`: Playwright end-to-end tests.
- `pnpm test:vrt`: visual regression tests in Linux Docker.
- `pnpm test:vrt:update`: refresh visual regression baselines.

Backend and E2E tests use a local Convex deployment by default. For CI-style
cloud previews, set `CONVEX_TEST_USE_PREVIEW=1` and provide `CONVEX_DEPLOY_KEY`
from the environment or `.env.local`.

The backend and E2E wrappers clear all app data in the target deployment before
running tests. Do not point them at a shared production deployment.

## Commit Planning

Before making non-trivial edits, plan the work as a sequence of commits. Each
planned commit must be auto-sustentable: it should build on its own, pass the
relevant checks for the touched area, and leave the repository in a coherent
state without relying on a later commit for correctness.

Use this planning rule to shape the implementation:

- Keep unrelated concerns in separate commits.
- Put required schema, type, and generated-code updates in the same commit as
  the behavior that needs them.
- Include tests with the commit that changes the behavior being tested.
- Avoid temporary broken states, feature stubs, or half-migrations unless they
  are deliberately hidden and safe.
- When a change cannot be split into independently valid commits, keep it as one
  commit and explain why.

## Code Style

- Prefer existing project patterns over new abstractions.
- Keep pure gameplay rules in `game/logic/`; do not mix Convex persistence into
  rule code.
- Keep backend contract and implementation wiring aligned with Confect patterns.
- Use Effect where the existing boundary already uses Effect; do not introduce
  Effect into plain gameplay rules without a clear architectural reason.
- Use Lucide icons for UI iconography when a matching icon exists.
- Preserve i18n patterns for user-facing text and run `pnpm i18n:check` when
  changing messages or message usage.
- Do not commit `.env.local`; it is git-ignored and generated by Convex for
  local development.

## Build And Deployment

- Production build: `pnpm build`.
- Production start after build: `pnpm start`.
- **Turbopack filesystem cache (Next 16.3):** `turbopackFileSystemCacheForBuild`
  and `turbopackFileSystemCacheForDev` default to `true`; no `next.config.ts`
  flags are required. Build output is stored under `.next/cache/turbopack` (dev
  uses `.next/dev/cache/turbopack`). Warm builds reuse prior compilation work
  when `.next/cache` is preserved. CI caches `.next/cache` in
  `.github/workflows/ci.yml` with a lockfile + source hash key and a lockfile
  restore key so repeat PR builds get partial hits after source-only changes.
  See `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/turbopackFileSystemCache.md`.
- Required Vercel environment variable: `NEXT_PUBLIC_CONVEX_URL` (your production Convex deployment URL).
- Convex backend env vars are managed in the Convex dashboard or via `npx convex env set`.

## Troubleshooting

- `pnpm-workspace.yaml` lists `sharp` and `unrs-resolver` under
  `ignoredBuiltDependencies`. After `pnpm install`, build scripts for `esbuild`,
  `@swc/core`, `@parcel/watcher`, and `msw` may be blocked. Prefer
  `pnpm rebuild esbuild @swc/core @parcel/watcher msw`; if you temporarily add
  packages to `onlyBuiltDependencies`, revert that workspace-file change before
  finishing.
- Preview mode is enabled by `CI`, `GITHUB_ACTIONS`, or
  `CONVEX_TEST_USE_PREVIEW=1` and requires `CONVEX_DEPLOY_KEY`.
- Local backend and E2E smoke tests do not need `CONVEX_DEPLOY_KEY`.

## Agent skills

Engineering workflow skills from [mattpocock/skills](https://github.com/mattpocock/skills)
are installed project-locally under `.agents/skills/` via the
[skills CLI](https://github.com/vercel-labs/skills) and pinned in
[`skills-lock.json`](skills-lock.json). Prefer `/ask-matt` to route; the
main build path is `/grill-with-docs` → `/to-spec` → `/to-tickets` →
`/implement` (with `/tdd` + `/code-review`). On-ramps include `/triage`,
`/diagnosing-bugs`, and `/wayfinder`. Restore with
`npx skills experimental_install` when needed.

### Issue tracker

Issues and PRDs for this repo live in GitHub Issues, managed with `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: root `CONTEXT.md` plus `docs/adr/`; read relevant docs when exploring. See `docs/agents/domain.md`.

### Agent learning loop

- Before substantial work, run `pnpx frog list`. When tooling, docs, APIs, tests, or conventions cost you time, run `pnpx frog log` before finishing the turn and commit the entry with the work that exposed it.
- Frog's project-local `frog-*` skills live under `.agents/skills/`; restore them with `pnpx frog skills add --no-global` and keep Frog out of `package.json`.
- Keep only verified durable discoveries in temporary [`LESSONS.md`](LESSONS.md), then promote them with [the shared learning-loop skill](.agents/skills/lessons-to-config/SKILL.md) and remove them from the inbox. See [`docs/agents/learning-loop.md`](docs/agents/learning-loop.md).
