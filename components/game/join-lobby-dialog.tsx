"use client";

import { useMutation } from "convex/react";
import { useSessionId, useSessionMutation } from "convex-helpers/react/sessions";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "@/i18n/navigation";
import { translateConvexError } from "@/lib/convex-error";

interface JoinLobbyDialogProps {
  trigger: React.ReactElement;
}

export function JoinLobbyDialog({ trigger }: JoinLobbyDialogProps) {
  const router = useRouter();
  const [sessionId] = useSessionId();
  const joinByCode = useMutation(api.matches.joinByCode);
  const joinMatch = useSessionMutation(api.matches.joinMatch);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("JoinLobby");
  const tLobby = useTranslations("Lobby");
  const tErrors = useTranslations("Errors");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedCode = code.trim();

    if (!trimmedName) {
      toast.error(t("toastNameRequired"));
      return;
    }

    if (trimmedName.length > 20) {
      toast.error(t("toastNameLength"));
      return;
    }

    if (trimmedCode.length !== 4) {
      toast.error(t("toastCodeLength"));
      return;
    }

    if (!sessionId) {
      toast.error(t("toastSession"));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await joinByCode({ lobbyCode: trimmedCode.toUpperCase() });
      await joinMatch({
        matchId: result.matchId as Id<"matches">,
        playerName: trimmedName,
      });
      startTransition(() => {
        router.push(`/game/${result.matchId}`);
      });
      setIsOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(message ? translateConvexError(message, tErrors) : t("toastJoinFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="join-name" className="text-sm font-medium text-foreground">
              {t("yourName")}
            </label>
            <Input
              id="join-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              maxLength={20}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="join-code" className="text-sm font-medium text-foreground">
              {t("lobbyCode")}
            </label>
            <div className="flex gap-3">
              <Input
                id="join-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={tLobby("codePlaceholder")}
                maxLength={4}
                className="font-mono text-center text-2xl tracking-[0.25em] h-14 uppercase"
              />
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || !name.trim() || code.trim().length !== 4}
                className="h-14 px-8 font-medium"
              >
                {t("join")}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
