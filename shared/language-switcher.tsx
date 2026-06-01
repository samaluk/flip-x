"use client";

import { useLocale, useTranslations } from "next-intl";

import { useRouter } from "@/shared/i18n/navigation";
import { routing } from "@/shared/i18n/routing";
import { cn } from "@/shared/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const { replace } = useRouter();
  const t = useTranslations("LanguageSwitcher");

  return (
    <fieldset
      className={cn(
        "fixed inset-e-4 top-4 z-50 m-0 flex min-w-0 items-center gap-1 rounded-full border border-border bg-background/80 px-1 py-1 shadow-sm backdrop-blur-sm",
        className,
      )}
      aria-label={t("aria")}
    >
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => replace(window.location.pathname, { locale: loc })}
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
    </fieldset>
  );
}
