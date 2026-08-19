export type ActionBannerStyle = {
  /** Compact card class string (width, padding, border, shadow, overlap) */
  base: string;
  /** Extra classes applied only on wide screens */
  wide: string;
  /** `skewX` degrees without the unit */
  skewDeg: number;
  /** Optional extra transform segment, e.g. `rotate(-2deg)` */
  rotate?: string;
  /** Compact title text classes */
  titleBase: string;
  /** Title text classes applied only on wide screens */
  titleWide: string;
  /** Outline stroke width in px */
  strokeWidth: number;
};

export const FLIP_THREE_BANNER_TOP: ActionBannerStyle = {
  base: "relative z-[2] -mb-2 w-[min(100%,10.5rem)] rounded-sm border-2 px-2 py-1 shadow-[2px_3px_0_rgba(55,75,153,0.25)]",
  wide: "sm:w-[min(100%,12rem)] sm:px-3 sm:py-1.5",
  skewDeg: -10,
  rotate: "rotate(-2deg)",
  titleBase: "text-center font-heading text-xl font-black uppercase tracking-wide",
  titleWide: "sm:text-3xl",
  strokeWidth: 1.5,
};

export const FLIP_THREE_BANNER_BOTTOM: ActionBannerStyle = {
  ...FLIP_THREE_BANNER_TOP,
  base: "relative z-[1] w-[min(100%,10.5rem)] rounded-sm border-2 px-2 py-1 shadow-[2px_3px_0_rgba(55,75,153,0.25)]",
};

export const FREEZE_BANNER: ActionBannerStyle = {
  base: "w-[min(100%,11rem)] rounded-sm border-2 px-2 py-2 shadow-[2px_3px_0_rgba(46,64,149,0.2)]",
  wide: "sm:w-[min(100%,12.5rem)] sm:px-4 sm:py-2.5",
  skewDeg: -6,
  titleBase: "text-center font-heading text-lg font-black uppercase tracking-[0.2em]",
  titleWide: "sm:text-2xl",
  strokeWidth: 1,
};

export const SECOND_CHANCE_BANNER_TOP: ActionBannerStyle = {
  base: "relative z-[2] -mb-1.5 w-[min(100%,10.5rem)] rounded-sm border-2 px-2 py-1 shadow-[2px_3px_0_rgba(61,75,142,0.3)]",
  wide: "sm:w-[min(100%,12rem)]",
  skewDeg: -7,
  titleBase: "text-center font-heading text-lg font-black uppercase tracking-wide",
  titleWide: "sm:text-2xl",
  strokeWidth: 1.5,
};

export const SECOND_CHANCE_BANNER_BOTTOM: ActionBannerStyle = {
  ...SECOND_CHANCE_BANNER_TOP,
  base: "w-[min(100%,10.5rem)] rounded-sm border-2 px-2 py-1 shadow-[2px_3px_0_rgba(61,75,142,0.3)]",
};
