# Queue: implement #483

**Epic:** https://github.com/samaluk/flip-x/issues/478  
**Ticket:** https://github.com/samaluk/flip-x/issues/483  
**Local spec:** `.scratch/next-16-3/issues/05-enable-instant-navigation-flags.md`

## Spawn next thread

Requires `CURSOR_API_KEY` ([Cursor integrations](https://cursor.com/dashboard/integrations)).

```bash
export CURSOR_API_KEY="cursor_..."

pnpm --dir ~/dev/personal/cursor-thread-spawn cursor:spawn -- "Implement GitHub issue #483 for flip-x (Next.js 16.3 adoption epic #478).

Repo: /Users/smaluk/dev/personal/flip-x on branch next-16-3-preview-to-stable (#479, #481, #482 done).

Read: .scratch/next-16-3/issues/05-enable-instant-navigation-flags.md, .scratch/next-16-3/spec.md, node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md.

Enable cacheComponents and partialPrefetching in next.config.ts; document Instant Insights + Navigation Inspector in AGENTS.md; verify next dev starts cleanly.

Acceptance: flags enabled; dev guide added; migration warnings documented; pnpm lint && pnpm build pass.

When done: commit, close #483 (gh), update README.md and this QUEUE.md for #484, spawn #484 the same way (see /spawn-cursor-thread skill)."
```

Block until completion:

```bash
pnpm --dir ~/dev/personal/cursor-thread-spawn cursor:spawn -- --wait "<same task>"
```

## Frontier after #483

| Issue | Title |
|-------|-------|
| #484 | catchError game error boundary |
| #485 | Cache Components migration |
| #489 | Rust React Compiler eval |
