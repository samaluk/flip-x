import type { Translate } from "@/game/logic/round-event-format";

/**
 * next-intl `useTranslations` returns strict key types; some UI uses composed keys.
 */
export function toLooseTranslate(t: { (key: never, values?: never): string }): Translate {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- next-intl `useTranslations` is stricter than our `Translate` string keys
  const loose = t as unknown as Translate;
  return (key: string, values?: Record<string, string | number>) => loose(key, values);
}
