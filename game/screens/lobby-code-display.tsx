"use client";

import { CopyIcon, CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";

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
    <output
      aria-label={t("statusLabel")}
      className="surface-elevated flex items-center gap-3 rounded-xl px-5 py-3"
    >
      <span className="font-mono text-3xl font-bold tracking-widest text-foreground">{code}</span>
      <Button variant="outline" size="sm" onClick={() => void copyCode()} className="gap-2">
        {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
        {copied ? t("copied") : t("copy")}
      </Button>
    </output>
  );
}
