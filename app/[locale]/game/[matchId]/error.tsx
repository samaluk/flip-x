"use client";

import { AlertCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GamePageError({ error, reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("Game");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center min-h-[60dvh] px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircleIcon className="h-6 w-6 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-xl font-medium tracking-tight text-foreground">
            {t("errorTitle")}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{error.message}</p>
        </div>
        <Button variant="outline" onClick={reset} className="mx-auto">
          {t("tryAgain")}
        </Button>
      </div>
    </div>
  );
}
