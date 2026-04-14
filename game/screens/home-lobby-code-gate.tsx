"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";

import { MatchSetup } from "@/game/screens/match-setup";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Link } from "@/shared/i18n/navigation";

export function HomeLobbyCodeGate({ code }: { code: string }) {
  const t = useTranslations("Home");
  const getMatchByCode = useQuery(api.matches.getMatchByCode, { lobbyCode: code });

  if (getMatchByCode === undefined) {
    return (
      <div className="flex min-h-[100dvh] flex-1 items-center justify-center">
        <div className="w-full max-w-md space-y-4 px-6">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-lg" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    );
  }

  if (getMatchByCode === null) {
    return (
      <main className="selection:bg-primary/20 flex min-h-[100dvh] flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md space-y-6 text-center">
          <div>
            <h2 className="font-heading text-foreground mb-2 text-2xl tracking-tight">
              {t("lobbyNotFoundTitle")}
            </h2>
            <p className="text-muted-foreground text-sm">{t("lobbyNotFoundBody", { code })}</p>
          </div>
          <Button render={<Link href="/" />} nativeButton={false} variant="default" className="w-full sm:w-auto">
            {t("backHome")}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="selection:bg-primary/20 flex min-h-[100dvh] flex-1 items-center justify-center">
      <div className="w-full max-w-md px-6">
        <h2 className="font-heading text-foreground mb-2 text-2xl tracking-tight">
          {t("joinTableTitle")}
        </h2>
        <p className="text-muted-foreground mb-8 text-sm">{t("joinTableBody", { code })}</p>
        <MatchSetup joinCode={code} existingMatchId={getMatchByCode.matchId} />
      </div>
    </main>
  );
}
