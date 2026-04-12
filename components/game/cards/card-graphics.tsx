import type { CSSProperties } from "react";

/** Fan motif for modifier cards (top / bottom) */
export function ModifierShellFan({
  flip,
  fill,
  stroke,
  className,
}: {
  flip?: boolean;
  fill: string;
  stroke: string;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ transform: flip ? "rotate(180deg)" : undefined } as CSSProperties}
    >
      <path
        d="M60 4 L20 28 L100 28 Z"
        fill={fill}
        fillOpacity={0.25}
        stroke={stroke}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <path d="M60 8 L32 26 L88 26 Z" stroke={stroke} strokeWidth={1.2} fill="none" />
      <path d="M44 22 L76 22" stroke={stroke} strokeWidth={1} strokeLinecap="round" />
    </svg>
  );
}

export function LightningBolt({
  fill,
  stroke,
  className,
}: {
  fill: string;
  stroke: string;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M14 2 L8 16 H14 L10 34 L20 14 H14 L14 2Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PadlockIcon({
  bodyFill,
  shackleFill,
  stroke,
  className,
}: {
  bodyFill: string;
  shackleFill: string;
  stroke: string;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 28 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M8 16 V12 C8 7 11 4 14 4 C17 4 20 7 20 12 V16"
        stroke={shackleFill}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <rect
        x={5}
        y={16}
        width={18}
        height={16}
        rx={3}
        fill={bodyFill}
        stroke={stroke}
        strokeWidth={1.4}
      />
      <circle cx={14} cy={24} r={2.2} fill={stroke} />
    </svg>
  );
}

export function HeartIcon({
  fill,
  stroke,
  className,
}: {
  fill: string;
  stroke: string;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M16 24 C6 16 2 12 2 8 C2 4 5 2 8 2 C11 2 14 4 16 7 C18 4 21 2 24 2 C27 2 30 4 30 8 C30 12 26 16 16 24Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FannedCardsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 44 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x={4}
        y={8}
        width={18}
        height={26}
        rx={2}
        transform="rotate(-12 13 21)"
        fill="#9a8b7a"
        stroke="#2E4095"
        strokeWidth={1.2}
      />
      <rect
        x={12}
        y={6}
        width={18}
        height={26}
        rx={2}
        fill="#f8f4ea"
        stroke="#2E4095"
        strokeWidth={1.2}
      />
      <rect
        x={20}
        y={8}
        width={18}
        height={26}
        rx={2}
        transform="rotate(12 29 21)"
        fill="#f39220"
        stroke="#2E4095"
        strokeWidth={1.2}
      />
    </svg>
  );
}
