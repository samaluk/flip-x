# Queue: implement #481

**Epic:** https://github.com/samaluk/flip-x/issues/478  
**Ticket:** https://github.com/samaluk/flip-x/issues/481  
**Local spec:** `.scratch/next-16-3/issues/02-turbopack-build-cache-ci.md`

## Prompt (paste into a fresh agent thread)

```
Implement GitHub issue #481 for flip-x (Next.js 16.3 adoption epic #478).

Read:
- .scratch/next-16-3/issues/02-turbopack-build-cache-ci.md
- .scratch/next-16-3/spec.md
- node_modules/next/dist/docs/ for turbopackFileSystemCache

Tune CI for Turbopack filesystem build cache: review `.github/workflows/ci.yml` cache step against Next 16.3 defaults, document behavior, confirm cache hits on repeat builds.

When done: close #481, commit on a branch, and enqueue the next frontier ticket (#482 zero-config wins) the same way — write `.scratch/next-16-3/QUEUE.md` and open the automation handoff.
```

## Frontier after #481

| Issue | Title |
|-------|-------|
| #482 | Zero-config wins + immutable assets |
| #484 | catchError game error boundary |
| #483 | Instant Navigation flags |
| #489 | Rust React Compiler eval |
