---
title: 'Fallow ordinal clone fingerprints remap when ignoredClones changes'
severity: 'minor'
target: 'fallow-rs/fallow'
---

Reproduction in flip-x with Fallow 3.17.0: run semantic+near dupes with the existing ignoredClones set, then add the newly reported clone fingerprints without changing source. The same source ranges receive different dup:c77b3abb6f87acd9-N fingerprints because clone-family ordinal numbering changes with the suppression set. Exact fingerprint/count suppression therefore cannot reach a stable fixed point for these groups; this required documenting the limitation and using the exact measured duplication bound.
