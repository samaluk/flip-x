"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type CardFrameProps = {
  borderColor: string;
  backgroundColor: string;
  /** Optional CSS background layered under children (e.g. gradients) */
  backgroundOverlay?: string;
  /** Subtle grain */
  showNoise?: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * Shared card chrome: thick border and face background.
 */
export function CardFrame({
  borderColor,
  backgroundColor,
  backgroundOverlay,
  showNoise = true,
  children,
  className,
}: CardFrameProps) {
  return (
    <div
      className={cn(
        "relative h-full min-h-0 w-full overflow-hidden rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
        className,
      )}
      style={{
        borderWidth: 4,
        borderStyle: "solid",
        borderColor,
        backgroundColor,
      }}
    >
      {backgroundOverlay ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: backgroundOverlay }}
        />
      ) : null}

      {showNoise ? (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-multiply dark:opacity-[0.12] dark:mix-blend-screen"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      ) : null}

      <div className="relative z-[1] flex h-full min-h-0 flex-col p-2 sm:px-2.5">
        {children}
      </div>
    </div>
  );
}
