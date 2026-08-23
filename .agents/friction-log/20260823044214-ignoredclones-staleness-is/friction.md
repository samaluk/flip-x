---
title: '`ignoredClones` staleness is undecidable from default output; suppressed groups are invisible'
severity: 'minor'
target: 'fallow-rs/fallow'
---

Auditing the duplication ignore list in flip-x, a naive fingerprint set-diff (config entries vs `fallow dupes --format json` groups) reported 14 of 20 `ignoredClones` entries as stale. That conclusion was wrong: clone groups that an entry currently suppresses do not appear in the default output at all, so their fingerprints can never match by construction. The only reliable staleness check is diffing the shipped config against an **empty-ignore** run (`ignoredClones: []`) — in this repo: 37 groups / 7.3% with ignores vs 24 groups / 5.19% without, proving the "stale-looking" entries suppress 13 live groups and are load-bearing for the configured `duplicates.threshold` gate.

Request: expose ignored-clone state in machine-readable output, e.g. a `suppressedBy` field per group or a `--show-ignored` flag listing entries matched/unmatched, so suppression audits don't require a config-mutation round-trip (and can't mislead agents into deleting active entries, which here would have flipped the gate red).
