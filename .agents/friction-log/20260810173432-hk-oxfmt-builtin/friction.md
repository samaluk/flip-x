---
title: 'hk oxfmt builtin treats list-different output as successful'
severity: 'minor'
target: 'jdx/hk'
---

## What happened

With hk 1.54.1 and oxfmt 0.62.0, `Builtins.oxfmt` runs `oxfmt --list-different` as `check_list_files`. oxfmt exits 0 while printing a differently formatted TOML path, so hk warns that the probe returned files on success and does not enter the fix path.

## Expected

The builtin should reliably detect differing files and run its fix command in pre-commit fix mode.

## Workaround

Override `check_list_files = null` so hk uses the builtin check command, then falls back to its fix command when the check exits non-zero.

## Versions

- hk 1.54.1
- oxfmt 0.62.0
