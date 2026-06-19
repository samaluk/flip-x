import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

execFileSync("pnpm", ["exec", "convex", "run", "admin:clearAllAppDataViaCli", "{}"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

console.log("Cleared Convex app data for the current deployment.");
