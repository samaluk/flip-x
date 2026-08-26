"use client";

import { useTranslations } from "next-intl";
import { useOffline } from "next/offline";
import type { ReactNode } from "react";

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
        "fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 px-4 py-2 text-center text-sm text-muted-foreground backdrop-blur-sm",
        className,
      )}
    >
      {message}
    </output>
  );
}

export function ConnectivityLoadingShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const isOffline = useOffline();
  const message = useConnectivityMessage("waitingForConnection");

  return (
    <div className={cn(isOffline && "pt-14", className)}>
      {message ? (
        <output className="pointer-events-none mb-4 text-center text-sm text-muted-foreground">
          {message}
        </output>
      ) : null}
      {children}
    </div>
  );
}
