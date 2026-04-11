"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";

import { ActionCardContent } from "@/components/game/cards/action-content";
import { ModifierCardContent } from "@/components/game/cards/modifier-content";
import { NumberCardContent } from "@/components/game/cards/number-content";
import type { ModifierCard } from "@/lib/game/card-types";
import { cn } from "@/lib/utils";

type Flip7CardProps = {
  label: string;
  faceDown?: boolean;
  dealing?: boolean;
  stateAnimation?: "bust" | "stay" | null;
  className?: string;
  /** Skip 3D flip; use for VRT — headless browsers can screenshot the wrong face with preserve-3d. */
  disableFlip3d?: boolean;
} & (
  | { kind: "number"; numberValue: number }
  | { kind: "modifier"; modifierValue: ModifierCard["modifierValue"] }
  | { kind: "action"; actionKind: "freeze" | "flip_three" | "second_chance" }
);

function FaceContent(props: Flip7CardProps) {
  if (props.kind === "number") {
    return <NumberCardContent numberValue={props.numberValue} />;
  }
  if (props.kind === "modifier") {
    return <ModifierCardContent modifierValue={props.modifierValue} />;
  }
  return <ActionCardContent actionKind={props.actionKind} />;
}

function ScreenReaderSummary(props: Flip7CardProps) {
  const t = useTranslations("Cards");

  const kindLabel =
    props.kind === "number"
      ? t("kindNumber")
      : props.kind === "modifier"
        ? t("kindModifier")
        : t("kindAction");

  const valueLabel =
    props.kind === "number"
      ? String(props.numberValue)
      : props.kind === "modifier"
        ? props.modifierValue === "x2"
          ? t("modifier.x2")
          : t("modifier.plus", { value: props.modifierValue as number })
        : t(`action.${props.actionKind}`);

  return (
    <div className="sr-only">
      <span>{kindLabel}</span>
      <span>{t("numberLine", { label: props.label })}</span>
      <span>{valueLabel}</span>
    </div>
  );
}

export function Flip7Card(props: Flip7CardProps) {
  const shellClass = cn(
    "flip7-card-shell w-32 shrink-0 sm:w-48",
    props.dealing && "flip7-card-deal",
    props.stateAnimation === "bust" && "flip7-card-bust",
    props.stateAnimation === "stay" && "flip7-card-stay",
    props.className,
  );

  const faceUp = (
    <div className="absolute inset-0 overflow-hidden rounded-2xl [backface-visibility:hidden]">
      <ScreenReaderSummary {...props} />
      <FaceContent {...props} />
    </div>
  );

  const faceDown = (
    <div className="absolute inset-0 overflow-hidden rounded-2xl border border-border bg-card p-3 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_30px_rgba(0,0,0,0.24)]">
      <div className="pointer-events-none absolute inset-2 rounded-xl border border-primary/20" />
      <div className="pointer-events-none absolute inset-4 rounded-lg border border-primary/10" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,transparent_43%,oklch(0.72_0.14_160_/_0.08)_43%,oklch(0.72_0.14_160_/_0.08)_57%,transparent_57%,transparent_100%)] opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(45deg,transparent_0%,transparent_43%,oklch(0.72_0.14_160_/_0.08)_43%,oklch(0.72_0.14_160_/_0.08)_57%,transparent_57%,transparent_100%)] opacity-60" />
      <div className="pointer-events-none absolute inset-y-6 left-1/2 w-px -translate-x-1/2 bg-primary/15" />
      <div className="pointer-events-none absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-primary/15" />
    </div>
  );

  if (props.disableFlip3d) {
    return (
      <motion.div
        whileHover={{ scale: 1.04, y: -2 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={shellClass}
      >
        <div className="relative aspect-[4/5] w-full">{props.faceDown ? faceDown : faceUp}</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.04, y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={shellClass}
    >
      <div
        className={cn(
          "relative aspect-[4/5] transition-transform duration-700 [transform-style:preserve-3d]",
          props.faceDown && "[transform:rotateY(180deg)]",
        )}
      >
        {faceUp}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          {faceDown}
        </div>
      </div>
    </motion.div>
  );
}
