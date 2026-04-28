import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const clearAllAppDataViaCli = makeFunctionReference("admin:clearAllAppDataViaCli");

if (!convexUrl) {
  throw new Error("Expected NEXT_PUBLIC_CONVEX_URL to be set before clearing preview data.");
}

const client = new ConvexHttpClient(convexUrl);

await client.action(clearAllAppDataViaCli);

console.log("Cleared Convex preview app data.");
