"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

const NUMBER_CARD_STYLES: Record<number, { shell: string; ink: string; corner: string }> = {
  0: {
    shell:
      "border-[#d4c5a9]/70 bg-[#f5eedc] text-[#f03a94] shadow-[0_8px_20px_rgba(240,58,148,0.15)]",
    ink: "text-[#f03a94]",
    corner: "text-[#f03a94]",
  },
  1: {
    shell:
      "border-[#d4c5a9]/70 bg-[#f5eedc] text-[#977598] shadow-[0_8px_20px_rgba(151,117,152,0.15)]",
    ink: "text-[#977598]",
    corner: "text-[#977598]",
  },
  2: {
    shell:
      "border-[#d4c5a9]/70 bg-[#f5eedc] text-[#c5d52d] shadow-[0_8px_20px_rgba(197,213,45,0.15)]",
    ink: "text-[#c5d52d]",
    corner: "text-[#c5d52d]",
  },
  3: {
    shell:
      "border-[#d4c5a9]/70 bg-[#f5eedc] text-[#ef5966] shadow-[0_8px_20px_rgba(239,89,102,0.15)]",
    ink: "text-[#ef5966]",
    corner: "text-[#ef5966]",
  },
  4: {
    shell:
      "border-[#d4c5a9]/70 bg-[#f5eedc] text-[#00a6b6] shadow-[0_8px_20px_rgba(0,166,182,0.15)]",
    ink: "text-[#00a6b6]",
    corner: "text-[#00a6b6]",
  },
  5: {
    shell:
      "border-[#d4c5a9]/70 bg-[#f5eedc] text-[#00985f] shadow-[0_8px_20px_rgba(0,152,95,0.15)]",
    ink: "text-[#00985f]",
    corner: "text-[#00985f]",
  },
  6: {
    shell:
      "border-[#d4c5a9]/70 bg-[#f5eedc] text-[#b660a8] shadow-[0_8px_20px_rgba(182,96,168,0.15)]",
    ink: "text-[#b660a8]",
    corner: "text-[#b660a8]",
  },
  7: {
    shell:
      "border-[#d4c5a9]/70 bg-[#f5eedc] text-[#f39192] shadow-[0_8px_20px_rgba(243,145,146,0.15)]",
    ink: "text-[#f39192]",
    corner: "text-[#f39192]",
  },
  8: {
    shell:
      "border-[#d4c5a9]/70 bg-[#f5eedc] text-[#8cc63f] shadow-[0_8px_20px_rgba(140,198,63,0.15)]",
    ink: "text-[#8cc63f]",
    corner: "text-[#8cc63f]",
  },
  9: {
    shell:
      "border-[#d4c5a9]/70 bg-[#f5eedc] text-[#f27023] shadow-[0_8px_20px_rgba(242,112,35,0.15)]",
    ink: "text-[#f27023]",
    corner: "text-[#f27023]",
  },
  10: {
    shell:
      "border-[#d4c5a9]/70 bg-[#f5eedc] text-[#ed1c24] shadow-[0_8px_20px_rgba(237,28,36,0.15)]",
    ink: "text-[#ed1c24]",
    corner: "text-[#ed1c24]",
  },
  11: {
    shell:
      "border-[#d4c5a9]/70 bg-[#f5eedc] text-[#6ca8d2] shadow-[0_8px_20px_rgba(108,168,210,0.15)]",
    ink: "text-[#6ca8d2]",
    corner: "text-[#6ca8d2]",
  },
  12: {
    shell:
      "border-[#d4c5a9]/70 bg-[#f5eedc] text-[#7a6a61] shadow-[0_8px_20px_rgba(122,106,97,0.15)]",
    ink: "text-[#7a6a61]",
    corner: "text-[#7a6a61]",
  },
};

const MODIFIER_CARD_STYLE = {
  shell: "border-[#e59b15]/70 bg-[#ffb020] text-[#e64c5e] shadow-[0_8px_20px_rgba(255,176,32,0.3)]",
  ink: "text-[#e64c5e]",
  corner: "text-[#cc3a4a]",
};

const ACTION_CARD_STYLES = {
  freeze: {
    shell:
      "border-[#1ea6b8]/70 bg-[#26c6da] text-[#1a4b68] shadow-[0_8px_20px_rgba(38,198,218,0.3)]",
    ink: "text-[#1a4b68]",
    corner: "text-[#123b54]",
  },
  flip_three: {
    shell:
      "border-[#e6d800]/70 bg-[#fff000] text-[#4a4a4a] shadow-[0_8px_20px_rgba(255,240,0,0.3)]",
    ink: "text-[#4a4a4a]",
    corner: "text-[#333333]",
  },
  second_chance: {
    shell:
      "border-[#e66a55]/70 bg-[#ff7e67] text-[#ffffff] shadow-[0_8px_20px_rgba(255,126,103,0.3)]",
    ink: "text-[#ffffff]",
    corner: "text-[#ffffff]",
  },
} as const;

type Flip7CardProps = {
  label: string;
  faceDown?: boolean;
  dealing?: boolean;
  stateAnimation?: "bust" | "stay" | null;
  className?: string;
} & (
  | { kind: "number"; numberValue: number }
  | { kind: "modifier" }
  | { kind: "action"; actionKind: "freeze" | "flip_three" | "second_chance" }
);

function getCardStyle(props: Flip7CardProps) {
  if (props.kind === "number") {
    return NUMBER_CARD_STYLES[props.numberValue];
  }

  if (props.kind === "modifier") {
    return MODIFIER_CARD_STYLE;
  }

  return ACTION_CARD_STYLES[props.actionKind];
}

export function Flip7Card(props: Flip7CardProps) {
  const style = getCardStyle(props);

  return (
    <motion.div
      whileHover={{ scale: 1.04, y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "flip7-card-shell w-[4.9rem] shrink-0 sm:w-[5.6rem]",
        props.dealing && "flip7-card-deal",
        props.stateAnimation === "bust" && "flip7-card-bust",
        props.stateAnimation === "stay" && "flip7-card-stay",
        props.className,
      )}
    >
      <div
        className={cn(
          "relative aspect-[5/7] transition-transform duration-700 [transform-style:preserve-3d]",
          props.faceDown && "[transform:rotateY(180deg)]",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 overflow-hidden rounded-2xl border p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] [backface-visibility:hidden] sm:p-3",
            style.shell,
          )}
        >
          <div className="absolute inset-x-2 top-2 flex items-start justify-between sm:inset-x-3 sm:top-3">
            <div
              className={cn("font-heading text-[0.7rem] tracking-[0.24em] uppercase", style.corner)}
            >
              Flip7
            </div>
            <div className={cn("font-heading text-[0.75rem]", style.corner)}>{props.label}</div>
          </div>
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-2 text-center">
            <div
              className={cn(
                "font-heading text-4xl leading-none tracking-[-0.06em] sm:text-5xl",
                style.ink,
                props.kind !== "number" && "text-2xl tracking-[0.08em] uppercase sm:text-3xl",
              )}
            >
              {props.label}
            </div>
          </div>
          <div className="absolute inset-x-2 bottom-2 flex items-end justify-between sm:inset-x-3 sm:bottom-3">
            <div
              className={cn("font-heading text-[0.7rem] tracking-[0.28em] uppercase", style.corner)}
            >
              {props.kind === "number" ? "Number" : props.kind === "modifier" ? "Bonus" : "Action"}
            </div>
            <div
              className={cn(
                "font-heading text-[0.72rem] tracking-[0.18em] uppercase",
                style.corner,
              )}
            >
              {props.kind === "action"
                ? props.actionKind.replace("_", " ")
                : props.kind === "modifier"
                  ? "Score"
                  : `No. ${props.label}`}
            </div>
          </div>
          <div className="pointer-events-none absolute inset-2 rounded-xl border border-white/18" />
          <div className="pointer-events-none absolute inset-x-4 top-4 h-px bg-white/24" />
          <div className="pointer-events-none absolute inset-x-4 bottom-4 h-px bg-black/12" />
        </div>

        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-card p-3 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_30px_rgba(0,0,0,0.24)]">
            <div className="pointer-events-none absolute inset-2 rounded-xl border border-primary/20" />
            <div className="pointer-events-none absolute inset-4 rounded-lg border border-primary/10" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,transparent_43%,oklch(0.72_0.14_160_/_0.08)_43%,oklch(0.72_0.14_160_/_0.08)_57%,transparent_57%,transparent_100%)] opacity-70" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(45deg,transparent_0%,transparent_43%,oklch(0.72_0.14_160_/_0.08)_43%,oklch(0.72_0.14_160_/_0.08)_57%,transparent_57%,transparent_100%)] opacity-60" />
            <div className="pointer-events-none absolute inset-y-6 left-1/2 w-px -translate-x-1/2 bg-primary/15" />
            <div className="pointer-events-none absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-primary/15" />
            <div className="font-heading text-2xl tracking-[0.34em] uppercase">Flip</div>
            <div className="font-heading text-5xl leading-none tracking-[-0.08em]">7</div>
            <div className="mt-2 font-heading text-[0.72rem] tracking-[0.32em] uppercase text-muted-foreground">
              Card Game
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
