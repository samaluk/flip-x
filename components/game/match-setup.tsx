"use client";

import { useSessionId, useSessionMutation } from "convex-helpers/react/sessions";
import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { startTransition, type FormEvent, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useRouter } from "@/i18n/navigation";
import { translateConvexError } from "@/lib/convex-error";
import { cn } from "@/lib/utils";

interface MatchSetupProps {
  joinCode?: string;
  existingMatchId?: string;
}

export function MatchSetup({ joinCode, existingMatchId }: MatchSetupProps) {
  const router = useRouter();
  const [sessionId] = useSessionId();
  const createMatch = useSessionMutation(api.matches.createMatch);
  const [hostName, setHostName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("MatchSetup");
  const tErrors = useTranslations("Errors");

  async function submitMatch(formData: FormData) {
    const name = formData.get("hostName") as string;

    const trimmedName = name?.trim();
    if (!trimmedName) {
      toast.error(t("toastNameRequired"));
      return;
    }

    if (trimmedName.length > 20) {
      toast.error(t("toastNameLength"));
      return;
    }

    if (!sessionId) {
      toast.error(t("toastSession"));
      return;
    }

    setIsSubmitting(true);

    try {
      let targetMatchId = existingMatchId;

      if (!targetMatchId) {
        const match = await createMatch({
          hostName: trimmedName,
        });
        targetMatchId = match.matchId;
      }

      if (targetMatchId) {
        startTransition(() => {
          router.push(`/game/${targetMatchId}`);
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(message ? translateConvexError(message, tErrors) : t("toastCreateFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMatch(new FormData(event.currentTarget));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="hostName" className="text-sm font-medium text-foreground">
            {t("yourName")}
          </label>
          <Input
            id="hostName"
            name="hostName"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            placeholder={t("namePlaceholder")}
            maxLength={20}
            required
            className="transition-all"
          />
        </div>

        <div className="mt-1">
          <Dialog>
            <DialogTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  className="justify-start w-full text-muted-foreground hover:text-foreground transition-colors"
                >
                  <SparklesIcon className="mr-2 h-4 w-4" />
                  {t("rulesHelp")}
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-xl font-medium">{t("rulesTitle")}</DialogTitle>
                <DialogDescription>{t("rulesIntro")}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 text-sm text-muted-foreground mt-4">
                <p className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    1
                  </span>
                  <span>{t("rulesStep1")}</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    2
                  </span>
                  <span>{t("rulesStep2")}</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    3
                  </span>
                  <span>{t("rulesStep3")}</span>
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{t("footnote")}</p>

      <div>
        <button
          type="submit"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "w-full sm:w-auto px-8 font-medium",
          )}
          disabled={isSubmitting || !hostName.trim() || !sessionId}
        >
          {joinCode ? t("joinLobby") : t("createLobby")}
        </button>
      </div>
    </form>
  );
}
