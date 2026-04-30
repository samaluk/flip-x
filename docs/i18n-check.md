# i18n-check notes

This repository uses `@lingual/i18n-check` for locale consistency checks and a first pass at code usage checks.

## Current command behavior

- `pnpm i18n:messages` is fully enabled (`missingKeys` + `invalidKeys`) against `messages/en.json` as the source locale.
- `pnpm i18n:usage` currently runs `undefined` checks on `app`, `shared`, and `game/cards`.

## Known parser limitations with `next-intl` (v0.9.4)

Running `i18n-check --format next-intl --unused ...` over all app sources currently has two concrete issues:

1. Parsing fails for `game/ui` and `game/screens` with:
   `Error: Can't validate translations. Check if the format is supported...`
2. `unused` detection reports all locale keys as unused in this codebase, which is a false positive.

Because of this, we are not enabling `unused` enforcement yet and we are not adding broad ignore globs that could hide real issues.
