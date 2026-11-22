import { useExtracted } from "next-intl";

import type { GameSettingsSnapshot } from "@/game/logic/game-settings";

export function GameSettingsSummary({
  settings,
  locked,
}: {
  settings: GameSettingsSnapshot;
  locked: boolean;
}) {
  const t = useExtracted("GameSettings");

  return (
    <div className="space-y-4">
      {locked ? (
        <span className="inline-block rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
          {t("Locked")}
        </span>
      ) : null}
      <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <SettingSummaryItem label={t("Points to win")} value={String(settings.targetScore)} />
        <SettingSummaryItem label={t("Cards")} value={`0-${settings.maxNumberCardValue}`} />
        <SettingSummaryItem
          label={t("Modifiers")}
          value={`+2 to +${settings.modifierRange.max}, x2`}
        />
        <SettingSummaryItem label={t("Mode")} value={settings.modeLabel} />
      </dl>
    </div>
  );
}

function SettingSummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/30 px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mbs-0.5 font-medium">{value}</dd>
    </div>
  );
}
