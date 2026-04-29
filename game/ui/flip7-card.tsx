"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { memo, type ReactNode } from "react";

import { ActionCardContent } from "@/game/cards/action-content";
import { ModifierCardContent } from "@/game/cards/modifier-content";
import { NumberCardContent } from "@/game/cards/number-content";
import type { ModifierCard } from "@/game/logic/card-types";
import { cn } from "@/shared/lib/utils";

/** Scales the default 8×10rem face to fit narrow sidebars without reflowing inner SVGs. */
const COMPACT_CARD_SCALE = 0.46;

type Flip7CardProps = {
  label: string;
  faceDown?: boolean;
  dealing?: boolean;
  stateAnimation?: "bust" | "stay" | null;
  className?: string;
  /** Smaller footprint for the viewer hand / narrow columns (row of cards). */
  compact?: boolean;
  /** Skip 3D flip; use for VRT — headless browsers can screenshot the wrong face with preserve-3d. */
  disableFlip3d?: boolean;
  /** Action card is pending - show pulsing glow */
  active?: boolean;
  /** Card was received from another player */
  variant?: "received";
} & (
  | { kind: "number"; numberValue: number }
  | { kind: "modifier"; modifierValue: ModifierCard["modifierValue"] }
  | { kind: "action"; actionKind: "freeze" | "flip_three" | "second_chance" }
);

function FaceContent(props: Flip7CardProps) {
  const compact = props.compact === true;
  if (props.kind === "number") {
    return <NumberCardContent numberValue={props.numberValue} compact={compact} />;
  }
  if (props.kind === "modifier") {
    return <ModifierCardContent modifierValue={props.modifierValue} compact={compact} />;
  }
  return <ActionCardContent actionKind={props.actionKind} compact={compact} />;
}

function ScreenReaderSummary(props: Flip7CardProps) {
  const t = useTranslations("Cards");

  const kindLabel =
    props.kind === "number"
      ? t("kindNumber")
      : props.kind === "modifier"
        ? t("kindModifier")
        : t("kindAction");

  let valueLabel: string;
  if (props.kind === "number") {
    valueLabel = String(props.numberValue);
  } else if (props.kind === "modifier") {
    valueLabel =
      props.modifierValue === "x2"
        ? t("modifier.x2")
        : t("modifier.plus", { value: props.modifierValue });
  } else {
    valueLabel = t(`action.${props.actionKind}`);
  }

  return (
    <div className="sr-only">
      <span>{kindLabel}</span>
      <span>{t("numberLine", { label: props.label })}</span>
      <span>{valueLabel}</span>
    </div>
  );
}

export const Flip7Card = memo(function Flip7Card(props: Flip7CardProps) {
  const isCompact = props.compact === true;

  const shellClass = cn(
    "flip7-card-shell shrink-0",
    isCompact ? "h-[4.75rem] w-[3.68rem] overflow-visible" : "w-32 sm:w-48",
    props.dealing && "flip7-card-deal",
    props.stateAnimation === "bust" && "flip7-card-bust",
    props.stateAnimation === "stay" && "flip7-card-stay",
    props.active && "flip7-card-active",
    props.variant === "received" && "flip7-card-received",
    props.className,
  );

  const compactScaleWrap = (node: ReactNode) =>
    isCompact ? (
      <div className="w-32 origin-top-left" style={{ transform: `scale(${COMPACT_CARD_SCALE})` }}>
        {node}
      </div>
    ) : (
      node
    );

  const faceUp = (
    <div className="absolute inset-0 overflow-hidden rounded-2xl [backface-visibility:hidden]">
      <ScreenReaderSummary {...props} />
      <FaceContent {...props} />
    </div>
  );

  const faceDown = (
    <div className="border-border bg-card text-primary absolute inset-0 overflow-hidden rounded-2xl border p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_30px_rgba(0,0,0,0.24)]">
      <div className="border-primary/20 pointer-events-none absolute inset-2 rounded-xl border" />
      <div className="border-primary/10 pointer-events-none absolute inset-4 rounded-lg border" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,transparent_43%,oklch(0.72_0.14_160_/_0.08)_43%,oklch(0.72_0.14_160_/_0.08)_57%,transparent_57%,transparent_100%)] opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(45deg,transparent_0%,transparent_43%,oklch(0.72_0.14_160_/_0.08)_43%,oklch(0.72_0.14_160_/_0.08)_57%,transparent_57%,transparent_100%)] opacity-60" />
      <div className="bg-primary/15 pointer-events-none absolute inset-y-6 left-1/2 w-px -translate-x-1/2" />
      <div className="bg-primary/15 pointer-events-none absolute inset-x-6 top-1/2 h-px -translate-y-1/2" />
    </div>
  );

  if (props.disableFlip3d) {
    /* Plain div: Motion would set its own transform and override bust/stay/deal CSS (bad for VRT). */
    return (
      <div className={shellClass}>
        {compactScaleWrap(
          <div className="relative aspect-[4/5] w-full">{props.faceDown ? faceDown : faceUp}</div>,
        )}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={isCompact ? { scale: 1.03, y: -1 } : { scale: 1.04, y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={shellClass}
    >
      {compactScaleWrap(
        <div
          className={cn(
            "relative aspect-[4/5] transition-transform duration-700 [transform-style:preserve-3d]",
            props.faceDown && "[transform:rotateY(180deg)]",
          )}
        >
          {faceUp}
          <div className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]">
            {faceDown}
          </div>
        </div>,
      )}
    </motion.div>
  );
}, areFlip7CardPropsEqual);

function flip7CardShellPropsEqual(left: Flip7CardProps, right: Flip7CardProps): boolean {
  return (
    left.label === right.label &&
    left.faceDown === right.faceDown &&
    left.dealing === right.dealing &&
    left.stateAnimation === right.stateAnimation &&
    left.className === right.className &&
    left.compact === right.compact &&
    left.disableFlip3d === right.disableFlip3d
  );
}

function flip7CardKindPayloadEqual(left: Flip7CardProps, right: Flip7CardProps): boolean {
  if (left.kind !== right.kind) {
    return false;
  }
  switch (left.kind) {
    case "number":
      return right.kind === "number" && left.numberValue === right.numberValue;
    case "modifier":
      return right.kind === "modifier" && left.modifierValue === right.modifierValue;
    case "action":
      return right.kind === "action" && left.actionKind === right.actionKind;
    default:
      return false;
  }
}

function areFlip7CardPropsEqual(left: Flip7CardProps, right: Flip7CardProps): boolean {
  return flip7CardShellPropsEqual(left, right) && flip7CardKindPayloadEqual(left, right);
}
