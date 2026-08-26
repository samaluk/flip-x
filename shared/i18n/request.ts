import { hasLocale } from "next-intl";
import { getRequestConfig, type RequestConfig } from "next-intl/server";
import { locale as rootLocale } from "next/root-params";

import { routing } from "./routing";

export default getRequestConfig(async () => {
  // oxlint-disable-next-line typescript/no-unsafe-assignment, typescript/no-unsafe-call
  const paramValue = await rootLocale();
  const locale = hasLocale(routing.locales, paramValue) ? paramValue : routing.defaultLocale;

  // oxlint-disable-next-line typescript/no-unsafe-assignment -- dynamic PO imports return plain objects from the next-intl loader.
  const { default: messages } = await import(`../../messages/${locale}.po`);

  // oxlint-disable-next-line typescript/consistent-type-assertions,typescript/no-unsafe-type-assertion,typescript/no-unsafe-member-access -- PO loader exports are untyped plain objects.
  const typedMessages = messages as RequestConfig["messages"];
  // oxlint-enable typescript/consistent-type-assertions,typescript/no-unsafe-type-assertion,typescript/no-unsafe-member-access

  return {
    locale,
    messages: typedMessages,
  };
});
