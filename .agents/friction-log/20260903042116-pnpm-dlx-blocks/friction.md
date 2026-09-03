---
title: 'pnpm dlx blocks Renovate validator on trust downgrade'
severity: 'minor'
target: 'pnpm/pnpm'
---

Running `pnpx --package=renovate renovate-config-validator renovate.json` failed with `ERR_PNPM_TRUST_DOWNGRADE` for `@yarnpkg/libzip@3.2.2`, even though Renovate itself was pinned. This prevents using a one-off validation CLI without weakening the trust policy. A pinned `renovate/renovate` container completed validation successfully.
