import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";

export function IntlEnProvider({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" timeZone="UTC">
      {children}
    </NextIntlClientProvider>
  );
}

export function withIntlEn(ui: ReactElement): ReactNode {
  return <IntlEnProvider>{ui}</IntlEnProvider>;
}
