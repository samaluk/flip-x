---
title: 'Pre-commit hook audits stale staged content after failed commit'
severity: 'minor'
---

## Expected Behavior
After a failed commit hook, rerunning staged checks should clearly reflect the current intended staged slice.

## Current Behavior
The hook can audit a partially staged index while edits remain unstaged in the worktree, producing findings for stale content. The issue is resolved by manually restaging all affected files.

## Possible Solution
Document or provide a staged-worktree refresh step in the hook workflow after a failed commit.

## Minimal Reproducible Example
1. Stage a partial refactor.
2. Run a commit and let a staged quality hook fail.
3. Edit the files to fix the reported issue.
4. Rerun No staged source files found. without restaging every affected file.

## Context
Encountered while implementing flip-x#600. The code was correct in the worktree, but React Doctor continued reporting findings from the older staged version until  was rerun.
