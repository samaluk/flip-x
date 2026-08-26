import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";

import { en } from "@/messages/catalogs";

export function withIntlEn(ui: ReactElement): ReactNode {
  return (
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>
  );
}
