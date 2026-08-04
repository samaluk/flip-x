# Queue: implement #482

**Epic:** https://github.com/samaluk/flip-x/issues/478  
**Ticket:** https://github.com/samaluk/flip-x/issues/482  
**Local spec:** `.scratch/next-16-3/issues/03-zero-config-wins-and-immutable-assets.md`

## Spawn next thread

Requires `CURSOR_API_KEY` ([Cursor integrations](https://cursor.com/dashboard/integrations)).

```bash
export CURSOR_API_KEY="cursor_..."

pnpm --dir ~/dev/personal/cursor-thread-spawn cursor:spawn -- "Implement GitHub issue #482 for flip-x (Next.js 16.3 adoption epic #478).

Repo: /Users/smaluk/dev/personal/flip-x on branch next-16-3-preview-to-stable (#479, #481 done).

Read: .scratch/next-16-3/issues/03-zero-config-wins-and-immutable-assets.md, .scratch/next-16-3/spec.md, node_modules/next/dist/docs/ for immutable static assets and versioned agent docs.

Verify zero-config 16.3 wins and immutable static asset caching: confirm AGENTS.md docs block, prefetch inlining/dev memory need no app code, configure Vercel immutable assets if applicable.

Acceptance: automatic wins documented; immutable assets configured or deferral noted; pnpm lint && pnpm build pass.

When done: commit, close #482 (gh), update README.md and this QUEUE.md for #484, spawn #484 the same way (see /spawn-cursor-thread skill)."
```

Block until completion:

```bash
pnpm --dir ~/dev/personal/cursor-thread-spawn cursor:spawn -- --wait "<same task>"
```

## Frontier after #482

| Issue | Title |
|-------|-------|
| #484 | catchError game error boundary |
| #483 | Instant Navigation flags |
| #489 | Rust React Compiler eval |
