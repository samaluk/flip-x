---
title: 'Frog skills sync writes agent-tool symlink dirs outside .agents/skills'
severity: 'minor'
issue: 'samaluk/flip-x#512'
---

## Expected Behavior

`pnpx frog skills add --no-global` adds Frog skills under `.agents/skills/` without touching other agent-tool directories.

### Current Behavior

It also creates `.claude/skills`, `.continue/skills`, and similar symlinks for each `frog-*` skill, leaving generated directories untracked in the repository. The skills are also not represented in `skills-lock.json`, so the existing `npx skills experimental_install` restore flow does not bring them back.

### Possible Solution

Either track Frog skills in the skills lockfile, or keep the documented `pnpx frog skills add --no-global` restore path and remove the generated symlink dirs after syncing.

### Minimal Reproducible Example

Run `pnpx frog skills add --no-global` in this repository, then check `git status` for `.claude/` and other agent-tool symlink directories.

### Context

I hit this while adding Frog agent skills; I removed the generated symlink dirs and documented the restore command.
