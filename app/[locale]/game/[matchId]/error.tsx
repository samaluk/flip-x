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
    <div className="flex min-h-[60dvh] flex-1 items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="bg-destructive/10 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
          <AlertCircleIcon className="text-destructive h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-foreground text-xl font-medium tracking-tight">
            {t("errorTitle")}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{error.message}</p>
        </div>
        <Button variant="outline" onClick={reset} className="mx-auto">
          {t("tryAgain")}
        </Button>
      </div>
    </div>
  );
}
