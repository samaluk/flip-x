"use client";

import { AlertCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { usePostHog } from "@posthog/next";

import { Button } from "@/shared/ui/button";

export default function GamePageError({ error, reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("Game");
  const params = useParams<{ locale: string; matchId: string }>();
  const posthog = usePostHog();

  useEffect(() => {
    console.error(error);
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      return;
    }

    posthog.captureException(error, {
      locale: params.locale,
      matchId: params.matchId,
      route: "/[locale]/game/[matchId]",
    });
  }, [error, params.locale, params.matchId, posthog]);

  return (
    <div className="flex min-h-svh flex-1 items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircleIcon className="size-6 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-xl font-medium tracking-tight text-foreground">
            {t("errorTitle")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{error.message}</p>
        </div>
        <Button variant="outline" onClick={reset} className="mx-auto">
          {t("tryAgain")}
        </Button>
      </div>
    </div>
  );
}
