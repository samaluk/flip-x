---
title: 'pr-cockpit edit-body fails on Bash 3.2 with an empty positional array'
severity: 'minor'
issue: 'samaluk/flip-x#730'
---

## Expected Behavior

`pr-cockpit edit-body REF --body-file FILE` submits the body mutation.

## Current Behavior

Under macOS Bash 3.2 and `set -u`, the command fails while expanding an empty `positionals` array before sending the mutation. `edit-title`, which has a positional title, works.

## Possible Solution

Use a Bash 3.2-safe expansion when forwarding optional positional arguments.

## Minimal Reproducible Example

Run `pr-cockpit edit-body samaluk/flip-x#724 --body-file /tmp/body.md` on macOS with the bundled Bash 3.2.

## Context

This prevented updating a PR description after successfully rewriting its branch and title.
