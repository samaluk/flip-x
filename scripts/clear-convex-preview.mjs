import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

const DELETE_ALL_APP_DATA_CONFIRMATION = "DELETE_ALL_APP_DATA";
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const clearAllAppDataViaCli = makeFunctionReference("admin:clearAllAppDataViaCli");

if (!convexUrl) {
  throw new Error("Expected NEXT_PUBLIC_CONVEX_URL to be set before clearing preview data.");
}

const client = new ConvexHttpClient(convexUrl);

await client.action(clearAllAppDataViaCli, {
  confirm: DELETE_ALL_APP_DATA_CONFIRMATION,
});

console.log("Cleared Convex preview app data.");
