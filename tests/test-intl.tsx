import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";

export function withIntlEn(ui: ReactElement): ReactNode {
  return (
    <NextIntlClientProvider locale="en" timeZone="UTC">
      {ui}
    </NextIntlClientProvider>
  );
}
