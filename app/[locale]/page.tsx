"use client";

import { motion } from "motion/react";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { use } from "react";

import { JoinLobbyDialog } from "@/components/game/join-lobby-dialog";
import { MatchSetup } from "@/components/game/match-setup";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Link } from "@/i18n/navigation";

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
} as const;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
};

export default function Home({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = use(searchParams);
  const codeParam = code?.toUpperCase();
  const t = useTranslations("Home");
  const tLobby = useTranslations("Lobby");
  const getMatchByCode = useQuery(
    api.matches.getMatchByCode,
    codeParam ? { lobbyCode: codeParam } : "skip",
  );

  if (codeParam && getMatchByCode === undefined) {
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

  if (codeParam && getMatchByCode === null) {
    return (
      <main className="selection:bg-primary/20 flex min-h-[100dvh] flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md space-y-6 text-center">
          <div>
            <h2 className="font-heading text-foreground mb-2 text-2xl tracking-tight">
              {t("lobbyNotFoundTitle")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("lobbyNotFoundBody", { code: codeParam })}
            </p>
          </div>
          <Button
            render={<Link href="/" />}
            nativeButton={false}
            variant="default"
            className="w-full sm:w-auto"
          >
            {t("backHome")}
          </Button>
        </div>
      </main>
    );
  }

  if (codeParam && getMatchByCode) {
    return (
      <main className="selection:bg-primary/20 flex min-h-[100dvh] flex-1 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="w-full max-w-md px-6"
        >
          <h2 className="font-heading text-foreground mb-2 text-2xl tracking-tight">
            {t("joinTableTitle")}
          </h2>
          <p className="text-muted-foreground mb-8 text-sm">
            {t("joinTableBody", { code: codeParam })}
          </p>
          <MatchSetup joinCode={codeParam} existingMatchId={getMatchByCode.matchId} />
        </motion.div>
      </main>
    );
  }

  return (
    <main className="selection:bg-primary/20 relative flex min-h-[100dvh] flex-1 items-center overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_oklch(0.72_0.14_160_/_0.04),_transparent_60%)]" />

      <div className="z-10 mx-auto w-full max-w-[1400px] px-6 py-16 md:py-24">
        <div className="grid items-start gap-16 lg:grid-cols-[1.4fr_1fr] lg:gap-24">
          <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-xl">
            <motion.h1
              variants={fadeUp}
              className="text-foreground mb-6 text-4xl leading-none font-medium tracking-tighter md:text-6xl"
            >
              {t("heroLine1")}
              <br />
              {t("heroLine2")}
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-muted-foreground mb-12 max-w-[50ch] text-base leading-relaxed"
            >
              {t("heroBody")}
            </motion.p>

            <motion.div variants={fadeUp}>
              <div className="mb-3">
                <h2 className="font-heading text-foreground text-lg tracking-tight">
                  {t("createTitle")}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">{t("createSubtitle")}</p>
              </div>
              <MatchSetup />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.3 }}
            className="hidden flex-col gap-6 pt-8 lg:flex"
          >
            <JoinLobbyDialog
              trigger={
                <button
                  type="button"
                  className="group surface-elevated w-full cursor-pointer rounded-2xl p-8 text-left transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <h3 className="text-foreground group-hover:text-primary text-lg font-medium tracking-tight transition-colors">
                    {t("joinExistingTitle")}
                  </h3>
                  <p className="text-muted-foreground mt-1.5 text-sm">
                    {t("joinExistingSubtitleDesktop")}
                  </p>
                  <div className="bg-muted/50 border-border text-muted-foreground group-hover:text-foreground mt-5 inline-flex items-center justify-center rounded-xl border px-5 py-3 font-mono text-xl tracking-[0.25em] transition-colors">
                    {tLobby("codePlaceholder")}
                  </div>
                </button>
              }
            />

            <div className="surface-elevated rounded-2xl p-8">
              <h3 className="text-muted-foreground text-sm font-medium tracking-tight uppercase">
                {t("howItWorks")}
              </h3>
              <div className="text-muted-foreground mt-4 space-y-3 text-sm">
                <p className="flex items-start gap-3">
                  <span className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                    1
                  </span>
                  <span>{t("step1")}</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                    2
                  </span>
                  <span>{t("step2")}</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                    3
                  </span>
                  <span>{t("step3")}</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 lg:hidden"
        >
          <JoinLobbyDialog
            trigger={
              <button
                type="button"
                className="group surface-elevated w-full cursor-pointer rounded-2xl p-6 text-left transition-all duration-300 active:scale-[0.99]"
              >
                <h3 className="text-foreground group-hover:text-primary text-base font-medium transition-colors">
                  {t("joinExistingTitle")}
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("joinExistingSubtitleMobile")}
                </p>
                <div className="bg-muted/50 border-border text-muted-foreground mt-4 inline-flex items-center justify-center rounded-lg border px-4 py-2.5 font-mono text-lg tracking-[0.25em]">
                  {tLobby("codePlaceholder")}
                </div>
              </button>
            }
          />
        </motion.div>
      </div>
    </main>
  );
}
