"use client";

import { AlertCircleIcon } from "lucide-react";
import { useExtracted } from "next-intl";
import { useEffect } from "react";
import { usePostHog } from "@posthog/next";

import { Button } from "@/shared/ui/button";

export type GameErrorContentProps = {
  error: Error;
  retry: () => void;
  locale: string;
  matchId: string;
};

export function GameErrorContent({ error, retry, locale, matchId }: GameErrorContentProps) {
  const t = useExtracted("Game");
  const posthog = usePostHog();

  useEffect(() => {
    console.error(error);
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      return;
    }

    posthog.captureException(error, {
      locale,
      matchId,
      route: "/[locale]/game/[matchId]",
    });
  }, [error, locale, matchId, posthog]);

  return (
    <div className="flex min-h-svh flex-1 items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircleIcon className="size-6 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-xl font-medium tracking-tight text-foreground">
            {t("Could not load the match")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{error.message}</p>
        </div>
        <Button variant="outline" onClick={() => retry()} className="mx-auto">
          {t("Try again")}
        </Button>
      </div>
    </div>
  );
}
