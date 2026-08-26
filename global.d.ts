import { routing } from "@/shared/i18n/routing";
import type { CatalogMessages } from "@/messages/catalogs";

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: CatalogMessages;
  }
}
