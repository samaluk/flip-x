"use client";

import { useTranslations } from "next-intl";
import { useOffline } from "next/offline";

import { cn } from "@/shared/lib/utils";

type ConnectivityMessageKey = "offlineBanner" | "waitingForConnection";

function useConnectivityMessage(key: ConnectivityMessageKey) {
  const isOffline = useOffline();
  const t = useTranslations("Connectivity");

  if (!isOffline) {
    return null;
  }

  return t(key);
}

export function OfflineBanner({ className }: { className?: string }) {
  const message = useConnectivityMessage("offlineBanner");

  if (!message) {
    return null;
  }

  return (
    <output
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-border bg-surface-muted/95 px-4 py-2 text-center text-sm text-muted-foreground backdrop-blur-sm",
        className,
      )}
    >
      {message}
    </output>
  );
}

export function OfflineLoadingStatus({ className }: { className?: string }) {
  const message = useConnectivityMessage("waitingForConnection");

  if (!message) {
    return null;
  }

  return (
    <output
      className={cn(
        "pointer-events-none fixed inset-x-0 top-12 z-40 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      {message}
    </output>
  );
}
