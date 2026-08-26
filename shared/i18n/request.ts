import { hasLocale } from "next-intl";
import { getRequestConfig, type RequestConfig } from "next-intl/server";
import { locale as rootLocale } from "next/root-params";

import { routing } from "./routing";

export default getRequestConfig(async () => {
  // oxlint-disable-next-line typescript/no-unsafe-assignment, typescript/no-unsafe-call
  const paramValue = await rootLocale();
  const locale = hasLocale(routing.locales, paramValue) ? paramValue : routing.defaultLocale;

  // oxlint-disable-next-line typescript/no-unsafe-assignment -- dynamic PO imports return plain objects from the next-intl loader.
  const [legacyMessages, extractedMessages] = await Promise.all([
    import(`../../messages/legacy/${locale}.po`),
    import(`../../messages/${locale}.po`),
  ]);

  // oxlint-disable typescript/consistent-type-assertions,typescript/no-unsafe-type-assertion,typescript/no-unsafe-member-access -- PO loader exports are untyped; merged shape matches CatalogMessages.
  const messages = {
    ...legacyMessages.default,
    ...extractedMessages.default,
  } as RequestConfig["messages"];
  // oxlint-enable typescript/consistent-type-assertions,typescript/no-unsafe-type-assertion,typescript/no-unsafe-member-access

  return {
    locale,
    messages,
  };
});
