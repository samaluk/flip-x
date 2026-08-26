import { GamePageLoading } from "@/game/screens/game-page-loading";
import { ConnectivityLoadingShell } from "@/shared/connectivity/offline-feedback";

export default function LoadingGamePage() {
  return (
    <ConnectivityLoadingShell>
      <GamePageLoading />
    </ConnectivityLoadingShell>
  );
}
