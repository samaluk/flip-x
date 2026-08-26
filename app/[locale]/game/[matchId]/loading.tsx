import { GamePageLoading } from "@/game/screens/game-page-loading";
import { OfflineLoadingStatus } from "@/shared/connectivity/offline-feedback";

export default function LoadingGamePage() {
  return (
    <>
      <OfflineLoadingStatus />
      <GamePageLoading />
    </>
  );
}
