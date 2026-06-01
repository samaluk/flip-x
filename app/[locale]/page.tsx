import type { Metadata } from "next";

import { HomeClient } from "./home-client";
import { searchParamsCache } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Flip 7",
  description: "Create or join a shared-table Flip 7 game.",
};

export default async function Home({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  await searchParamsCache.parse(searchParams);

  return <HomeClient />;
}
