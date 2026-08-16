#!/usr/bin/env node
/* oxlint-disable typescript/no-unsafe-argument, typescript/no-unsafe-assignment, typescript/no-unsafe-call, typescript/no-unsafe-member-access, typescript/no-unsafe-return -- This boundary validates SARIF emitted by the pinned fallow CLI before uploading it. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const file = process.argv[2];
if (!file || !existsSync(file)) {
  console.warn("No SARIF file to categorize; skipping.");
  process.exit(0);
}

const sarif = JSON.parse(readFileSync(file, "utf8"));
if (!Array.isArray(sarif.runs) || sarif.runs.length === 0) {
  console.warn("SARIF file contains no runs; skipping.");
  process.exit(0);
}

for (const [index, run] of sarif.runs.entries()) {
  run.automationDetails = { id: `fallow/audit-${index}` };
}

writeFileSync(file, `${JSON.stringify(sarif, null, 2)}\n`);
console.log(
  `Assigned distinct SARIF categories: ${sarif.runs
    .map((run) => run.automationDetails.id)
    .join(", ")}.`,
);
