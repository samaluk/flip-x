import { HomeClient } from "./home-client";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return <HomeClient code={code?.toUpperCase()} />;
}
