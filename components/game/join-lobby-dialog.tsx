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
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">Join a Game</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Enter your name and the 4-character code to join an existing lobby.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={20}
              className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700 text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <div className="flex gap-3">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD"
              maxLength={4}
              className="font-mono text-center text-2xl tracking-[0.25em] h-14 bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700 text-zinc-100 placeholder:text-zinc-600 uppercase"
            />
            <Button 
              type="submit" 
              disabled={isSubmitting || !name.trim() || code.trim().length !== 4}
              className="h-14 px-8 bg-zinc-100 text-zinc-950 hover:bg-white active:scale-[0.98] transition-all font-medium"
            >
              Join
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
