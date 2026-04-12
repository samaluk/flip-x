"use client";

import { CopyIcon, CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface LobbyCodeDisplayProps {
  code: string;
}

export function LobbyCodeDisplay({ code }: LobbyCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("LobbyCodeDisplay");

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(t("toastCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("toastFailed"));
    }
  }

  return (
    <div
      data-testid="lobby-code-display"
      className="border-border bg-card flex items-center gap-3 rounded-xl border px-5 py-3 shadow-[inset_0_1px_0_oklch(1_0_0_/_4%)]"
    >
      <span data-testid="lobby-code-value" className="text-foreground font-mono text-3xl font-bold tracking-[0.3em]">
        {code}
      </span>
      <Button variant="outline" size="sm" onClick={copyCode} className="gap-2">
        {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
        {copied ? t("copied") : t("copy")}
      </Button>
    </div>
  );
}
