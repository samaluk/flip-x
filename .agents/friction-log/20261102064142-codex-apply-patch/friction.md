---
title: 'Codex apply_patch helper is not exposed on shell PATH'
severity: 'minor'
target: 'openai/codex'
---

In this T3 Code Codex session, the available tool set has exec_command but no dedicated apply_patch tool. Running apply_patch from exec_command fails with command not found. The helper does exist as /tmp/apply_patch, a symlink to the installed Codex binary, and invoking that exact path applies the patch successfully. Expose the session helper on the execution shell PATH or provide the dedicated patch tool so agents can follow the required editing workflow without searching the host. The /tmp path is session-local, not a repository dependency.
