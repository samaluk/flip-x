"use client";

import { AlertCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { catchError, type ErrorInfo } from "next/error";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { usePostHog } from "@posthog/next";

import { Button } from "@/shared/ui/button";

function toDisplayError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
}

export type GameErrorContentProps = {
  error: Error;
  retry: () => void;
  locale: string;
  matchId: string;
};

export function GameErrorContent({ error, retry, locale, matchId }: GameErrorContentProps) {
  const t = useTranslations("Game");
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
            {t("errorTitle")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{error.message}</p>
        </div>
        <Button variant="outline" onClick={() => retry()} className="mx-auto">
          {t("tryAgain")}
        </Button>
      </div>
    </div>
  );
}

function GameErrorFallbackWithParams({ error, retry }: { error: unknown; retry: () => void }) {
  const params = useParams<{ locale: string; matchId: string }>();
  const displayError = toDisplayError(error);

  return (
    <GameErrorContent
      error={displayError}
      retry={retry}
      locale={params.locale}
      matchId={params.matchId}
    />
  );
}

function GameErrorFallback(_props: object, { error, retry }: ErrorInfo) {
  return <GameErrorFallbackWithParams error={error} retry={retry} />;
}

export const GameErrorBoundary = catchError(GameErrorFallback);
