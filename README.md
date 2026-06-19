# flip-x

**flip-x** is an unofficial fan-made spinoff of press-your-luck card games. It is not
affiliated with, endorsed by, or sponsored by any card-game publisher. Names and
mechanics are used for homage and gameplay only.

flip-x is a shared-table web app with live turn tracking, action-card resolution, and
automatic scoring to 200 points.

## Stack

- Next.js 16
- Tailwind CSS v4, shadcn/ui
- Convex + Confect
- Effect-TS at service boundaries
- Vitest, Playwright, GitHub Actions

See [`AGENTS.md`](./AGENTS.md) for architecture and development workflow.

## Local development

```bash
pnpm install
npx convex dev   # separate terminal
pnpm dev         # https://flip-x.localhost via portless
```

Use `PORTLESS=0 pnpm dev` for plain `http://localhost:3000`.

## Testing

See [`docs/testing.md`](./docs/testing.md). Quick commands:

```bash
pnpm test              # engine, infra, contract, ui, confect
pnpm test:backend      # Convex smoke (local deployment by default)
pnpm test:e2e          # Playwright
pnpm ci:local          # pre-PR check
```

## Deployment

Configure in your Convex and Vercel dashboards:

- **Vercel:** `NEXT_PUBLIC_CONVEX_URL` (production Convex deployment URL)
- **Convex:** `POSTHOG_PROJECT_TOKEN` and other backend env vars via `npx convex env set`
- **PostHog (optional):** `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, build-time source map vars

## License

MIT — see [`LICENSE`](./LICENSE).
