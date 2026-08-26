"use client";

import { useExtracted } from "next-intl";
import { useOffline } from "next/offline";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

export function OfflineBanner({ className }: { className?: string }) {
  const isOffline = useOffline();
  const t = useExtracted("Connectivity");

  if (!isOffline) {
    return null;
  }

  return (
    <div
      role="status" // oxlint-disable-line jsx-a11y/prefer-tag-over-role -- live status region; output is for calculation results
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 px-4 py-2 text-center text-sm text-muted-foreground backdrop-blur-sm",
        className,
      )}
    >
      {t("You're offline. Pending requests will retry when you're back online.")}
    </div>
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
  const t = useExtracted("Connectivity");

  return (
    <div className={cn(isOffline && "pt-14", className)}>
      {isOffline ? (
        <div
          role="status" // oxlint-disable-line jsx-a11y/prefer-tag-over-role -- live status region; output is for calculation results
          className="pointer-events-none mb-4 text-center text-sm text-muted-foreground"
        >
          {t("Waiting for connection…")}
        </div>
      ) : null}
      {children}
    </div>
  );
}
