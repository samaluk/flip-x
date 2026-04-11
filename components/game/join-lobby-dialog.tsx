"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { startTransition, type FormEvent, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
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

interface JoinLobbyDialogProps {
  trigger: React.ReactElement;
}

export function JoinLobbyDialog({ trigger }: JoinLobbyDialogProps) {
  const router = useRouter();
  const joinByCode = useMutation(api.matches.joinByCode);
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.trim().length !== 4) {
      toast.error("Please enter a 4-character code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await joinByCode({ lobbyCode: code.trim().toUpperCase() });
      startTransition(() => {
        router.push(`/game/${result.matchId}`);
      });
      setIsOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Lobby not found. Check the code and try again.",
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
            Enter the 4-character code to join an existing lobby.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4">
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
              disabled={isSubmitting || code.trim().length !== 4}
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
