"use client";

import { useLocale, useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("LanguageSwitcher");

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 flex items-center gap-1 rounded-full border border-border bg-background/80 px-1 py-1 shadow-sm backdrop-blur-sm",
        className,
      )}
      role="group"
      aria-label={t("aria")}
    >
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => router.replace(pathname, { locale: loc })}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            locale === loc
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {loc === "en" ? t("english") : t("spanish")}
        </button>
      ))}
    </div>
  );
}
