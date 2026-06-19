import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const convexArgs = ["exec", "convex", "run", "admin:clearAllAppDataViaCli", "{}"];

const previewName = process.env.PREVIEW_DEPLOYMENT_NAME;
if (previewName) {
  convexArgs.push("--deployment", `preview/${previewName}`);
}

execFileSync("pnpm", convexArgs, {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

console.log("Cleared Convex app data for the current deployment.");
