# Git hooks

Flip-x uses [`hk`](https://hk.jdx.dev/) to run local quality gates. The pinned
version and automatic hook installation live in [`mise.toml`](../mise.toml),
while [`hk.pkl`](../hk.pkl) defines the checks.

## Setup

Install [mise](https://mise.jdx.dev/installing-mise.html), then run:

```bash
mise install
pnpm install
```

`mise install` installs the pinned `hk` binary and registers this repository's
hooks. The hook commands run through `mise x`, so the pinned tool is available
even when mise has not been activated in the current shell. If `hk` is already
[installed globally](https://hk.jdx.dev/getting_started.html#install-hooks-recommended-global),
the repository install detects and reuses that setup rather than registering the
same event twice.

Clones that previously used `.githooks` may still have its path in local Git
configuration. Remove it once before installing `hk`:

```bash
git config --unset core.hooksPath
mise install
```

## Hook behavior

Pre-commit uses `hk`'s fix mode and safe unstaged-change stashing. It formats
staged files, stages formatter changes, and runs the core lint, i18n, and staged
React Doctor checks. Independent read-only checks run concurrently; formatting
uses `hk`'s file locks when it needs to write.

Pre-push is check-only and runs the broader lint, i18n, Fallow, and fast Vitest
suites in parallel. The design-system lint runs when `DESIGN.md` is part of the
pushed changes. `hk` derives the relevant files from the refs supplied by Git's
[pre-push event](https://hk.jdx.dev/cli/run/pre-push.html).

Run or inspect hooks directly with:

```bash
mise run pre-commit
mise run pre-push
hk run pre-commit --plan
hk run pre-push --plan
```

For a one-off bypass, use `HK=0 git commit` or `HK=0 git push`. Prefer fixing a
failed gate; the escape hatch is intended for diagnosing hook infrastructure.

## Dependency sync and `verifyDepsBeforeRun`

`pnpm-workspace.yaml` sets `verifyDepsBeforeRun: error` so every `pnpm run` /
`pnpm exec` step (which is every `hk` step via `pnpm exec` / `pnpm run`) fails
fast when `node_modules` is out of sync with `pnpm-lock.yaml` or
`pnpm-workspace.yaml`. This avoids the non-interactive auto-install path that
would otherwise abort with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` when a
store/layout change requires purging `node_modules` and there is no TTY to
confirm.

When a hook fails with `ERR_PNPM_VERIFY_DEPS_BEFORE_RUN` (or, on an older
checkout without this setting, with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`),
recover with an explicit install outside the hook:

```bash
pnpm install
```

If that install itself needs to purge an incompatible `node_modules` (for example
after pulling a `packageManager` pnpm bump) and you are in a non-interactive
agent shell with no TTY, re-run it non-interactively:

```bash
CI=1 pnpm install
```

Then re-run the commit. See `pnpm`'s [`verifyDepsBeforeRun`](https://pnpm.io/settings/build#verifydepsbeforerun) and the
`confirmModulesPurge` / `CI` handling in `validateModules`.

The configuration pins both the executable and Pkl imports because they are
separate compatibility boundaries. `min_hk_version` makes an older executable
fail clearly instead of interpreting a newer config. See `hk`'s official
[configuration reference](https://hk.jdx.dev/configuration.html) and
[mise integration guide](https://hk.jdx.dev/mise_integration.html) for the
underlying behavior.
