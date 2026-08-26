import { HomePageLoading } from "@/game/screens/home-page-loading";
import { OfflineLoadingStatus } from "@/shared/connectivity/offline-feedback";

export default function LoadingHomePage() {
  return (
    <>
      <OfflineLoadingStatus />
      <HomePageLoading />
    </>
  );
}
