"use client";

import { CopyIcon, CheckIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface LobbyCodeDisplayProps {
  code: string;
}

export function LobbyCodeDisplay({ code }: LobbyCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Lobby code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the code.");
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-zinc-950/50 px-4 py-3">
      <span className="font-mono text-2xl font-bold tracking-widest text-zinc-50">{code}</span>
      <Button variant="outline" size="sm" onClick={copyCode} className="gap-2">
        {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
        {copied ? "Copied!" : "Copy"}
      </Button>
    </div>
  );
}
