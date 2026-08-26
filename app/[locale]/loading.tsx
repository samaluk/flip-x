import { HomePageLoading } from "@/game/screens/home-page-loading";
import { ConnectivityLoadingShell } from "@/shared/connectivity/offline-feedback";

export default function LoadingHomePage() {
  return (
    <ConnectivityLoadingShell>
      <HomePageLoading />
    </ConnectivityLoadingShell>
  );
}
