"use client";

import type { ReactNode } from "react";

import { cardTw } from "@/game/cards/card-responsive";
import type { ActionCardPalette } from "@/game/cards/card-palettes";
import type { ActionBannerStyle } from "@/game/cards/action-banner-styles";

function ActionBanner({
  style,
  palette,
  compact = false,
  children,
}: {
  style: ActionBannerStyle;
  palette: ActionCardPalette;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cardTw(compact, style.base, style.wide)}
      style={{
        backgroundColor: palette.bannerFill,
        borderColor: palette.bannerStroke,
        transform: `skewX(${style.skewDeg}deg)${style.rotate ? ` ${style.rotate}` : ""}`,
      }}
    >
      <div
        className={cardTw(compact, style.titleBase, style.titleWide)}
        style={{
          color: palette.titleFill,
          WebkitTextStroke: `${style.strokeWidth}px ${palette.titleStroke}`,
          paintOrder: "stroke fill",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function ActionBannerStack({
  palette,
  compact = false,
  topStyle,
  topTitle,
  bottomStyle,
  bottomTitle,
}: {
  palette: ActionCardPalette;
  compact?: boolean;
  topStyle: ActionBannerStyle;
  topTitle: ReactNode;
  bottomStyle?: ActionBannerStyle;
  bottomTitle?: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 py-1">
      <ActionBanner style={topStyle} palette={palette} compact={compact}>
        {topTitle}
      </ActionBanner>
      {bottomStyle ? (
        <ActionBanner style={bottomStyle} palette={palette} compact={compact}>
          {bottomTitle}
        </ActionBanner>
      ) : null}
    </div>
  );
}
