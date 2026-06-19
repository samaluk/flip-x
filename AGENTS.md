# AGENTS.md

<!-- BEGIN:nextjs-agent-rules -->

## Next.js Version Warning

This is not the Next.js version you may know from training data. Before changing
Next.js code, read the relevant guide in `node_modules/next/dist/docs/` and heed
deprecation notices.

<!-- END:nextjs-agent-rules -->

## Project Overview

Flip-x is a shared-table web app for playing the press-your-luck card game with
live turn tracking, action-card resolution, and automatic scoring to 200 points.

- Runtime stack: TypeScript 6.0.3 (project `tsc` / Next), TypeScript 7 native
  preview (`@typescript/native-preview`, `tsgo`) for parity with typescript-go,
  Next.js 16.2.4, React 19.2.5, Convex 1.37.0, Confect 5.0.0, Effect 3.21.2.
- UI stack: Tailwind CSS 4, shadcn/ui, Base UI, Lucide icons, Motion.
- Testing stack: Vitest 4.1.5, Playwright 1.59.1, convex-test.
- Package manager: `pnpm@10.33.2`.

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
  that project so type-check matches `tsc` / `tsgo` on the same graph.
- `pnpm lint:fix`: run oxlint autofixes with the same type-aware and type-check
  setup.
- `pnpm exec tsgo --project tsconfig.json --noEmit`: optional native TS7 check
  against the same `tsconfig` graph as Oxlint type-check.
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
