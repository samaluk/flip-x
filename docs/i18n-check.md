# i18n workflow

flip-x uses [next-intl message extraction](https://next-intl.dev/docs/usage/extraction) for source strings and [eloqnt](https://cli.eloqnt.dev/docs) for locale validation and future translation.

## Layout

- `messages/en.po` — extracted English catalog from `useExtracted` / `t()` call sites (runtime source of truth)
- `messages/es.po` — Spanish translations
- `.eloqnt/config.ts` — eloqnt project config (source paths, locales, lint rules)
- `.eloqnt/styleguides/en.md` — tone and terminology for `eloqnt translate`

## Day-to-day commands

```bash
pnpm i18n:check   # eloqnt lint — run in CI, hooks, and before PRs
```

After adding or changing extracted strings in `app/`, `shared/`, or `game/`:

1. Run the app or `pnpm build` so next-intl writes updated `messages/en.po`.
2. Update `messages/es.po` for new keys (manually or with `eloqnt translate` when configured).
3. Run `pnpm i18n:check` to confirm catalogs and call sites stay in sync.

## Runtime vs tests

- **Runtime:** `shared/i18n/request.ts` loads `messages/${locale}.po` via the next-intl PO loader.
- **Tests:** `tests/test-intl.tsx` wraps components in `NextIntlClientProvider`; `useExtracted` uses inline source strings without loading PO (see [next-intl extraction docs](https://next-intl.dev/docs/usage/extraction#optional-compilation)).

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
