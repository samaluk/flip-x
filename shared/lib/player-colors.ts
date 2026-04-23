export type PlayerColorId = (typeof PLAYER_COLORS)[number]["id"];

export const PLAYER_COLORS = [
  { id: "cyan", label: "Cyan", background: "#4dd0e1", foreground: "#001f2c" },
  { id: "mint", label: "Mint", background: "#6ee7b7", foreground: "#052e1a" },
  { id: "emerald", label: "Emerald", background: "#34d399", foreground: "#042f1d" },
  { id: "lime", label: "Lime", background: "#a3e635", foreground: "#1f2a05" },
  { id: "yellow", label: "Yellow", background: "#facc15", foreground: "#2d2400" },
  { id: "amber", label: "Amber", background: "#f59e0b", foreground: "#2b1700" },
  { id: "orange", label: "Orange", background: "#fb923c", foreground: "#301000" },
  { id: "coral", label: "Coral", background: "#fb7185", foreground: "#3b0611" },
  { id: "rose", label: "Rose", background: "#f43f5e", foreground: "#fff1f2" },
  { id: "pink", label: "Pink", background: "#f472b6", foreground: "#3b0824" },
  { id: "fuchsia", label: "Fuchsia", background: "#e879f9", foreground: "#35063c" },
  { id: "purple", label: "Purple", background: "#c084fc", foreground: "#2e0a4f" },
  { id: "violet", label: "Violet", background: "#a78bfa", foreground: "#1e1245" },
  { id: "indigo", label: "Indigo", background: "#818cf8", foreground: "#111947" },
  { id: "blue", label: "Blue", background: "#60a5fa", foreground: "#061b3a" },
  { id: "sky", label: "Sky", background: "#38bdf8", foreground: "#06283a" },
  { id: "teal", label: "Teal", background: "#2dd4bf", foreground: "#032d28" },
  { id: "slate", label: "Slate", background: "#94a3b8", foreground: "#111827" },
  { id: "stone", label: "Stone", background: "#a8a29e", foreground: "#1c1917" },
  { id: "red", label: "Red", background: "#f87171", foreground: "#3f0707" },
] as const;

const PLAYER_COLOR_IDS = new Set<string>(PLAYER_COLORS.map((color) => color.id));

export function isPlayerColorId(value: string): value is PlayerColorId {
  return PLAYER_COLOR_IDS.has(value);
}

export function getPlayerColor(colorId: string | null | undefined, fallbackIndex = 0) {
  return (
    PLAYER_COLORS.find((color) => color.id === colorId) ??
    PLAYER_COLORS[((fallbackIndex % PLAYER_COLORS.length) + PLAYER_COLORS.length) % PLAYER_COLORS.length]
  );
}

export function firstAvailablePlayerColorId(usedColorIds: Iterable<string>) {
  const used = new Set(usedColorIds);
  return PLAYER_COLORS.find((color) => !used.has(color.id))?.id ?? PLAYER_COLORS[0].id;
}

export function playerInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length >= 2 ? `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}` : parts[0]?.slice(0, 2) ?? "?";
  return initials.toUpperCase();
}
