import { hasLocale } from "next-intl";
import { getRequestConfig, type RequestConfig } from "next-intl/server";
import { locale as rootLocale } from "next/root-params";

import { routing } from "./routing";

export default getRequestConfig(async () => {
  // oxlint-disable-next-line typescript/no-unsafe-assignment, typescript/no-unsafe-call
  const paramValue = await rootLocale();
  const locale = hasLocale(routing.locales, paramValue) ? paramValue : routing.defaultLocale;

  return {
    locale,
    // oxlint-disable-next-line typescript/no-unsafe-member-access,typescript/no-unsafe-type-assertion,typescript/no-unnecessary-type-assertion,typescript/consistent-type-assertions -- PO loader returns a plain object; next-intl narrows messages from the source locale.
    messages: (await import(`../../messages/${locale}.po`)).default as RequestConfig["messages"],
  };
});
