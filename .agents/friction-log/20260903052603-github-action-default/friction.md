---
title: 'GitHub Action default node-version 24 can be older than package.json engines'
severity: 'minor'
target: 'millionco/react-doctor'
---

## What happened

`millionco/react-doctor` defaults `node-version` to `24`. On ubuntu-latest that resolved to Node 24.19.0 while this repo's `devEngines.runtime.version` / `engines.node` were `24.20.0`. Installing the CLI then failed with `EBADDEVENGINES` (`Invalid semver version "24.20.0" does not match "v24.19.0"`), so the PR gate reported "Scan could not complete" instead of findings.

## Workaround

Pass the project's exact Node version into the Action (`node-version:` from `engines.node`) instead of relying on the major-only default.
