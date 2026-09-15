export type PlayerColorId =
  | "cyan"
  | "mint"
  | "emerald"
  | "lime"
  | "yellow"
  | "amber"
  | "orange"
  | "coral"
  | "rose"
  | "pink"
  | "fuchsia"
  | "purple"
  | "violet"
  | "indigo"
  | "blue"
  | "sky"
  | "teal"
  | "slate"
  | "stone"
  | "red";

export type PlayerColor = {
  id: PlayerColorId;
  label: string;
  swatchClass: string;
};

export const PLAYER_COLORS: readonly PlayerColor[] = [
  // fallow-ignore-next-line code-duplication -- static swatch rows; require-static-classes forbids a shared `bg-player-${id}` template
  { id: "cyan", label: "Cyan", swatchClass: "bg-player-cyan text-player-cyan-foreground" },
  { id: "mint", label: "Mint", swatchClass: "bg-player-mint text-player-mint-foreground" },
  {
    id: "emerald",
    label: "Emerald",
    swatchClass: "bg-player-emerald text-player-emerald-foreground",
  },
  { id: "lime", label: "Lime", swatchClass: "bg-player-lime text-player-lime-foreground" },
  { id: "yellow", label: "Yellow", swatchClass: "bg-player-yellow text-player-yellow-foreground" },
  { id: "amber", label: "Amber", swatchClass: "bg-player-amber text-player-amber-foreground" },
  { id: "orange", label: "Orange", swatchClass: "bg-player-orange text-player-orange-foreground" },
  { id: "coral", label: "Coral", swatchClass: "bg-player-coral text-player-coral-foreground" },
  { id: "rose", label: "Rose", swatchClass: "bg-player-rose text-player-rose-foreground" },
  { id: "pink", label: "Pink", swatchClass: "bg-player-pink text-player-pink-foreground" },
  // fallow-ignore-next-line code-duplication -- static swatch rows; require-static-classes forbids a shared `bg-player-${id}` template
  {
    id: "fuchsia",
    label: "Fuchsia",
    swatchClass: "bg-player-fuchsia text-player-fuchsia-foreground",
  },
  { id: "purple", label: "Purple", swatchClass: "bg-player-purple text-player-purple-foreground" },
  { id: "violet", label: "Violet", swatchClass: "bg-player-violet text-player-violet-foreground" },
  { id: "indigo", label: "Indigo", swatchClass: "bg-player-indigo text-player-indigo-foreground" },
  { id: "blue", label: "Blue", swatchClass: "bg-player-blue text-player-blue-foreground" },
  { id: "sky", label: "Sky", swatchClass: "bg-player-sky text-player-sky-foreground" },
  { id: "teal", label: "Teal", swatchClass: "bg-player-teal text-player-teal-foreground" },
  { id: "slate", label: "Slate", swatchClass: "bg-player-slate text-player-slate-foreground" },
  { id: "stone", label: "Stone", swatchClass: "bg-player-stone text-player-stone-foreground" },
  { id: "red", label: "Red", swatchClass: "bg-player-red text-player-red-foreground" },
];

const PLAYER_COLOR_IDS = new Set<string>(PLAYER_COLORS.map((color) => color.id));

export function isPlayerColorId(value: string): value is PlayerColorId {
  return PLAYER_COLOR_IDS.has(value);
}

export function getPlayerColor(colorId: string | null | undefined, fallbackIndex = 0) {
  return (
    PLAYER_COLORS.find((color) => color.id === colorId) ??
    PLAYER_COLORS[
      ((fallbackIndex % PLAYER_COLORS.length) + PLAYER_COLORS.length) % PLAYER_COLORS.length
    ]
  );
}

export function firstAvailablePlayerColorId(usedColorIds: Iterable<string>) {
  const used = new Set(usedColorIds);
  return PLAYER_COLORS.find((color) => !used.has(color.id))?.id ?? PLAYER_COLORS[0].id;
}

export function playerInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`
      : (parts[0]?.slice(0, 2) ?? "?");
  return initials.toUpperCase();
}
