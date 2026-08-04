# Queue: implement #481

**Epic:** https://github.com/samaluk/flip-x/issues/478  
**Ticket:** https://github.com/samaluk/flip-x/issues/481  
**Local spec:** `.scratch/next-16-3/issues/02-turbopack-build-cache-ci.md`

## Spawn next thread

Requires `CURSOR_API_KEY` ([Cursor integrations](https://cursor.com/dashboard/integrations)).

```bash
export CURSOR_API_KEY="cursor_..."

pnpm --dir ~/dev/personal/cursor-thread-spawn cursor:spawn -- "Implement GitHub issue #481 for flip-x (Next.js 16.3 adoption epic #478).

Repo: /Users/smaluk/dev/personal/flip-x on branch next-16-3-preview-to-stable (next@16.3.0 stable, #479 done).

Read: .scratch/next-16-3/issues/02-turbopack-build-cache-ci.md, .scratch/next-16-3/spec.md, node_modules/next/dist/docs/ for turbopackFileSystemCache.

Tune CI for Turbopack filesystem build cache: review .github/workflows/ci.yml against Next 16.3 defaults; align cache paths/keys; document in AGENTS.md.

Acceptance: turbopackFileSystemCache documented; CI cache step updated; pnpm lint && pnpm build pass.

When done: commit, close #481 (gh), update README.md and this QUEUE.md for #482, spawn #482 the same way (see /spawn-cursor-thread skill)."
```

Block until completion:

```bash
pnpm --dir ~/dev/personal/cursor-thread-spawn cursor:spawn -- --wait "<same task>"
```

## Frontier after #481

| Issue | Title |
|-------|-------|
| #482 | Zero-config wins + immutable assets |
| #484 | catchError game error boundary |
| #483 | Instant Navigation flags |
| #489 | Rust React Compiler eval |
