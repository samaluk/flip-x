/** Navy used across card line art */
export const CARD_NAVY = "#2D368E";

type NumberCardPalette = {
  fill: string;
};

/** Number card digit colors (from physical deck) */
export const NUMBER_CARD_PALETTES: Record<number, NumberCardPalette> = {
  0: { fill: "#ffffff" },
  1: { fill: "#c4b896" },
  2: { fill: "#d4e82a" },
  3: { fill: "#ef5966" },
  4: { fill: "#00a6b6" },
  5: { fill: "#00985f" },
  6: { fill: "#b660a8" },
  7: { fill: "#f39192" },
  8: { fill: "#8cc63f" },
  9: { fill: "#f27023" },
  10: { fill: "#ed1c24" },
  11: { fill: "#6ca8d2" },
  12: { fill: "#9a8b7a" },
};

type ModifierCardPalette = {
  border: string;
  bg: string;
  bgGradient: string;
  centerInk: string;
  centerStroke: string;
  fanFill: string;
  fanStroke: string;
  smallText: string;
};

export const MODIFIER_CARD_PALETTE: ModifierCardPalette = {
  border: CARD_NAVY,
  bg: "#ffb347",
  bgGradient: "linear-gradient(180deg, #fff2a8 0%, #ff9a3c 45%, #ff7a1a 100%)",
  centerInk: "#c41e3a",
  centerStroke: CARD_NAVY,
  fanFill: "#f03a94",
  fanStroke: CARD_NAVY,
  smallText: CARD_NAVY,
};

type ActionCardPalette = {
  border: string;
  bg: string;
  bgGradient?: string;
  bannerFill: string;
  bannerStroke: string;
  titleFill: string;
  titleStroke: string;
  smallText: string;
  /** Flip three / freeze accents */
  orange: string;
  lightningFill: string;
  lockBody: string;
  lockShackle: string;
  heartFill: string;
};

export const ACTION_CARD_PALETTES: Record<
  "flip_three" | "freeze" | "second_chance",
  ActionCardPalette
> = {
  flip_three: {
    border: "#374b99",
    bg: "#fae13c",
    bgGradient: undefined,
    bannerFill: "#f8f4ea",
    bannerStroke: "#374b99",
    titleFill: "#f8f4ea",
    titleStroke: "#374b99",
    smallText: "#374b99",
    orange: "#f39220",
    lightningFill: "#f39220",
    lockBody: "#c8b9a0",
    lockShackle: "#fde96b",
    heartFill: "#e89997",
  },
  freeze: {
    border: "#2E4095",
    bg: "#80d0e0",
    bannerFill: "#fff9e5",
    bannerStroke: "#fde96b",
    titleFill: "#2E4095",
    titleStroke: "#fde96b",
    smallText: "#2E4095",
    orange: "#fde96b",
    lightningFill: "#5aa8e0",
    lockBody: "#c8b9a0",
    lockShackle: "#fde96b",
    heartFill: "#e89997",
  },
  second_chance: {
    border: "#3d4b8e",
    bg: "#f2745f",
    bgGradient: "radial-gradient(ellipse at 50% 45%, #ff9a85 0%, #f2745f 55%, #e85a42 100%)",
    bannerFill: "#f9f4d7",
    bannerStroke: "#3d4b8e",
    titleFill: "#f9f4d7",
    titleStroke: "#3d4b8e",
    smallText: "#3d4b8e",
    orange: "#f2d052",
    lightningFill: "#5aa8e0",
    lockBody: "#c8b9a0",
    lockShackle: "#fde96b",
    heartFill: "#e89997",
  },
};
