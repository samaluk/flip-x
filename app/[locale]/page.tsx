import type { Metadata } from "next";
import { Suspense } from "react";

import { HomeClient } from "./home-client";
import { searchParamsCache } from "@/lib/search-params";
import { HomePageLoading } from "@/game/screens/home-page-loading";

export const metadata: Metadata = {
  title: "flip-x",
  description: "Create or join a shared-table flip-x game.",
};

export default function Home({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  return (
    <Suspense fallback={<HomePageLoading />}>
      <HomeSearchParamsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function HomeSearchParamsContent({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  await searchParamsCache.parse(searchParams);

  return <HomeClient />;
}
