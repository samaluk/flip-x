import { HomeClient } from "./home-client";
import { searchParamsCache } from "@/lib/search-params";

export default async function Home({
	searchParams,
}: {
	searchParams: Promise<{ code?: string }>;
}) {
	await searchParamsCache.parse(searchParams);

	return <HomeClient />;
}
