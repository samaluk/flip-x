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

The hk v2 top-level `steps` block shares formatting, core lint, i18n, and the
staged Fallow audit across `hk check`, `hk fix`, and pre-commit. Secret scanning
runs in `check` and pre-commit; staged React Doctor runs only in pre-commit.
Pre-push keeps its own broader set of checks.

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

In [hk v2](https://hk.jdx.dev/migration-v2), `hk fix` leaves formatter changes
unstaged. Review and stage them yourself, or use `hk fix --stage` to opt into
staging. Pre-commit explicitly enables staging; check and pre-push leave the
index alone. A step's `stage` patterns only filter paths eligible for staging
and do not enable staging by themselves.

For a one-off bypass, use `HK=0 git commit` or `HK=0 git push`. Prefer fixing a
failed gate; the escape hatch is intended for diagnosing hook infrastructure.

## Recovering from a failed pre-commit

Pre-commit checks that read the Git index (`pnpm react-doctor:staged`,
`pnpm fallow:staged`, and the hook's staged lint paths) audit the **staged**
snapshot, not your full working tree. After a hook failure, fixes you make in
the editor stay unstaged until you `git add` them again. Rerunning a staged
check without restaging can therefore report findings from the older staged
content even when the worktree is already fixed.

Refresh the index from the worktree for every path that is still staged, then
rerun the hook or an individual staged check:

```bash
git add $(git diff --cached --name-only)
mise run pre-commit
```

To refresh only specific files, use `git add <path>` instead.

Intentional partial staging (different staged vs unstaged hunks in the same
file) is preserved only when you restage selectively; restaging a whole path
replaces its staged snapshot with the current worktree version.

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

## Disposable hook test repositories

For an individual step's check/fix behavior, hk provides
[step-defined tests](https://hk.jdx.dev/cli/test.html) with temporary sandboxes,
fixture inputs, and output assertions. See the
[custom-linter example](https://hk.jdx.dev/reference/examples/custom-linters.html).
The tools must be installed and available to the sandbox; the
[JavaScript guide](https://hk.jdx.dev/reference/examples/javascript-project.html)
describes exposing `node_modules/.bin` on `PATH`. Step tests do not exercise a
whole Git hook's staging behavior.

For checks that need a separate Git repository and the real `pnpm exec` commands,
give that repository its own installation. pnpm's
[project virtual store](https://pnpm.io/settings/node-modules#virtualstoredir)
cannot be shared between separate projects. Reuse packages through pnpm's store
while keeping each repository's `node_modules` and `verifyDepsBeforeRun: error`.

A temporary Git repository used to test hooks may copy `package.json`,
`pnpm-lock.yaml`, and `pnpm-workspace.yaml` from an installed checkout and symlink
that checkout's `node_modules` to reuse its tools. Even when the source install
is current, `pnpm exec oxfmt` in the fixture can fail with
`ERR_PNPM_VERIFY_DEPS_BEFORE_RUN: The workspace structure has changed since last install`.
The shared installation belongs to the source workspace; copying its files to a
different directory does not make it an installation of the relocated workspace.
Verification stops the command before the formatter runs, so this error alone
does not indicate an hk failure.

Run this example from the root of an installed checkout. The
[`--offline` install](https://pnpm.io/cli/install#--offline) reuses packages
already available in pnpm's store; `--frozen-lockfile` keeps the copied lockfile
unchanged. Copy the formatter configuration too so its behavior matches the
source checkout:

```bash
source_repo="$(git rev-parse --show-toplevel)"
fixture_repo="$(mktemp -d "${TMPDIR:-/tmp}/flip-x-hook-fixture.XXXXXX")"
cp "$source_repo/package.json" "$source_repo/pnpm-lock.yaml" \
  "$source_repo/pnpm-workspace.yaml" "$source_repo/.oxfmtrc.json" "$fixture_repo/"
git -C "$fixture_repo" init --quiet
pnpm --dir "$fixture_repo" install --offline --frozen-lockfile

printf '{"fixture":true}\n' > "$fixture_repo/fixture.json"
pnpm --dir "$fixture_repo" exec oxfmt --write fixture.json
```

If a package is missing from the store, rerun the install without `--offline`
to fetch it. Copy configuration files as regular files, and include the tool
configuration and supporting files required by any additional steps you test.
This example validates formatter execution; a full hook check also needs its
hook configuration, scripts, and other inputs.

If an existing disposable fixture already symlinks `node_modules`, remove that
symlink **before** installing so the fixture owns the resulting directory:

```bash
test -L "$fixture_repo/node_modules" &&
  unlink "$fixture_repo/node_modules" &&
  pnpm --dir "$fixture_repo" install --offline --frozen-lockfile
```

Setting `verifyDepsBeforeRun: false` only disables the check; it does not repair
the relocated installation. Keep `error` in both checkouts and use the explicit
install recovery above for an ordinary stale install. Remove the temporary
repository when finished:

```bash
rm -rf "$fixture_repo"
```
