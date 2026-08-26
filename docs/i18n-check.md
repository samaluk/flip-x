# i18n workflow

flip-x uses [next-intl message extraction](https://next-intl.dev/docs/usage/extraction) for source strings and [eloqnt](https://cli.eloqnt.dev/docs) for locale validation and future translation.

## Layout

- `messages/en.po` — extracted English catalog from `useExtracted` / `t()` call sites
- `messages/es.po` — Spanish translations
- `messages/legacy/*.po` — pre-extraction game copy merged at runtime
- `messages/catalogs.ts` — generated snapshot for typing and tests (`pnpm i18n:catalog`)
- `.eloqnt/config.ts` — eloqnt project config (source paths, locales, lint rules)
- `.eloqnt/styleguides/en.md` — tone and terminology for `eloqnt translate`

## Day-to-day commands

```bash
pnpm i18n:check    # eloqnt lint — run in CI, hooks, and before PRs
pnpm i18n:catalog  # regenerate catalogs.ts and messages/.lingual snapshots
```

After adding or changing extracted strings in `app/`, `shared/`, or `game/`:

1. Run the app or `pnpm build` so next-intl writes updated `messages/en.po`.
2. Update `messages/es.po` for new keys (manually or with `eloqnt translate` when configured).
3. Run `pnpm i18n:catalog` when tests or types need the merged snapshot.
4. Run `pnpm i18n:check` to confirm catalogs and call sites stay in sync.

## Authoring rules

- Use literal English strings in `useExtracted('Namespace')` and `t('…')` — no dynamic keys or template-literal message IDs.
- Keep ICU placeholders (`{count}`, `{name}`, …) identical across locales.
- Write the product name as **flip-x** (lowercase) in source copy.
- See `.eloqnt/styleguides/en.md` for card-game terminology and voice.

## CI

CI runs `pnpm i18n:check` (eloqnt lint only). There is no auto-translate workflow in CI; translation is a local or manual step.

## References

- https://next-intl.dev/docs/usage/extraction
- https://cli.eloqnt.dev/docs
- https://cli.eloqnt.dev/docs/styleguides
