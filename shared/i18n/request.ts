import { hasLocale } from "next-intl";
import { getRequestConfig, type RequestConfig } from "next-intl/server";
import { locale as rootLocale } from "next/root-params";

import enMessages from "../../messages/en.json";
import esMessages from "../../messages/es.json";
import { routing } from "./routing";

const messagesByLocale = {
  en: enMessages,
  es: esMessages,
};

export default getRequestConfig(async ({ requestLocale }) => {
  const paramValue = await rootLocale();
  const requested = paramValue ?? (await requestLocale);
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- JSON imports widen literals, while next-intl narrows messages from the source locale.
    messages: messagesByLocale[locale] as RequestConfig["messages"],
  };
});
