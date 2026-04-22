import fs from "node:fs";

const outputPath = process.argv[2];
const envVarName = process.argv[3] ?? "NEXT_PUBLIC_CONVEX_URL";
const value = process.env[envVarName];

if (!outputPath) {
  throw new Error("Expected output file path as the first argument.");
}

if (!value) {
  throw new Error(`Expected ${envVarName} to be set by convex deploy.`);
}

fs.writeFileSync(outputPath, `${value}\n`, "utf8");
