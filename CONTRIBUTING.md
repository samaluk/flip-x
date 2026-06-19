# Contributing

Thanks for your interest in contributing.

## Getting started

1. Read [`AGENTS.md`](./AGENTS.md) for architecture, tooling, and workflow expectations.
2. Install dependencies: `pnpm install`
3. Start Convex sync: `npx convex dev`
4. Start the app: `pnpm dev` (opens at `https://flip7.localhost` via portless)

## Before opening a pull request

Run the checks that match your change:

```bash
pnpm ci:local
```

For narrower iteration, see the command reference in `AGENTS.md` and [`docs/testing.md`](./docs/testing.md).

## Pull requests

- Keep commits focused; unrelated changes belong in separate PRs.
- Include tests with behavior changes when practical.
- Run `pnpm i18n:check` when changing user-facing messages.

## Security

See [`SECURITY.md`](./SECURITY.md).
