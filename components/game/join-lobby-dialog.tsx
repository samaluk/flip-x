"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { startTransition, type FormEvent, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAnonymousSessionId } from "@/lib/anonymous-session";

interface JoinLobbyDialogProps {
  trigger: React.ReactElement;
}

export function JoinLobbyDialog({ trigger }: JoinLobbyDialogProps) {
  const router = useRouter();
  const sessionId = useAnonymousSessionId();
  const joinByCode = useMutation(api.matches.joinByCode);
  const joinMatch = useMutation(api.matches.joinMatch);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedCode = code.trim();

    if (!trimmedName) {
      toast.error("Please enter your name.");
      return;
    }

    if (trimmedName.length > 20) {
      toast.error("Name must be 20 characters or less.");
      return;
    }

    if (trimmedCode.length !== 4) {
      toast.error("Please enter a 4-character code.");
      return;
    }

    if (!sessionId) {
      toast.error("Session not available.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await joinByCode({ lobbyCode: trimmedCode.toUpperCase() });
      await joinMatch({
        matchId: result.matchId as Id<"matches">,
        playerName: trimmedName,
        sessionId,
      });
      startTransition(() => {
        router.push(`/game/${result.matchId}`);
      });
      setIsOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not join the lobby. Check the code and name.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">Join a Game</DialogTitle>
          <DialogDescription>
            Enter your name and the 4-character code to join an existing lobby.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="join-name" className="text-sm font-medium text-foreground">
              Your name
            </label>
            <Input
              id="join-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={20}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="join-code" className="text-sm font-medium text-foreground">
              Lobby code
            </label>
            <div className="flex gap-3">
              <Input
                id="join-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABCD"
                maxLength={4}
                className="font-mono text-center text-2xl tracking-[0.25em] h-14 uppercase"
              />
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || !name.trim() || code.trim().length !== 4}
                className="h-14 px-8 font-medium"
              >
                Join
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
