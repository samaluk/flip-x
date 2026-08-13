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

export default getRequestConfig(async () => {
  // oxlint-disable-next-line typescript/no-unsafe-assignment, typescript/no-unsafe-call
  const paramValue = await rootLocale();
  const locale = hasLocale(routing.locales, paramValue) ? paramValue : routing.defaultLocale;

  return {
    locale,
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion,typescript/no-unnecessary-type-assertion,typescript/consistent-type-assertions -- JSON imports widen literals, while next-intl narrows messages from the source locale. React Doctor's type graph lacks the generated per-locale declarations and so flags the cast as unnecessary, but it is required. Pinning the base in CI reproduces this when typegen hasn't run first.
    messages: messagesByLocale[locale] as RequestConfig["messages"],
  };
});
