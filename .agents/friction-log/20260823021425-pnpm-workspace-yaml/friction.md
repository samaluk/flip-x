---
title: 'pnpm-workspace.yaml rejects unquoted @-prefixed scalars (YAML reserved indicator)'
severity: 'minor'
target: 'pnpm/pnpm'
---

Setting `minimumReleaseAgeExclude` entries programmatically stripped the quotes from `@scope/name@version` selectors and pnpm's YAML parser then failed with a misleading `bad indentation of a sequence entry` pointing at the list item, even though the bytes were column-correct. `@` is a reserved YAML indicator, so scalars starting with it must be quoted.

Recovery: always emit exclude entries as quoted strings (`"@oxfmt/binding-darwin-arm64@0.64.0"`).

Related: `minimumReleaseAgeExclude` accepts either name patterns (`@myorg/*`) or exact `name@version` selectors, but never a pattern combined with a version (`@myorg/*@1.2.3` → ERR_PNPM_INVALID_MINIMUM_RELEASE_AGE_EXCLUDE). Since pnpm 11.22, `minimumReleaseAgeExcludePrune: true` auto-deletes exact-version exclude lines once the lockfile stops resolving them.
