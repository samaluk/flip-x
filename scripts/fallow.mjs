#!/usr/bin/env node
/* oxlint-disable typescript/no-unsafe-argument, typescript/no-unsafe-assignment, typescript/no-unsafe-call, typescript/no-unsafe-member-access, eslint/no-underscore-dangle -- This boundary validates JSON emitted by pinned local tools before reading it. */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = process.cwd();
const coverage = path.resolve(root, "coverage/coverage-final.json");
const baselineDir = "fallow-baselines";
const baselines = {
  "dead-code.json": ["dead-code", "--type-aware", "--save-baseline"],
  "dupes.json": ["dupes", "--save-baseline"],
  "health.json": [
    "health",
    "--coverage",
    coverage,
    "--coverage-root",
    root,
    "--baseline-mode",
    "identity",
    "--save-baseline",
  ],
};

function run(command, args, capture = false) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit",
  });
  if (result.error) return { status: 2, stdout: "", error: result.error.message };
  return { status: result.status ?? 2, stdout: result.stdout?.trim() ?? "" };
}

function fallow(args, capture = false) {
  return run("pnpm", ["exec", "fallow", ...args], capture);
}

function requireCoverage() {
  if (!existsSync(coverage)) {
    console.error("coverage/coverage-final.json is missing; run `pnpm test:coverage` first");
    process.exit(2);
  }
}

function normalize(file) {
  const value = JSON.parse(readFileSync(file, "utf8"));
  if (file.endsWith("regression.json")) {
    delete value.timestamp;
    delete value.git_sha;
  }
  return JSON.stringify(value);
}

function regenerate(directory) {
  requireCoverage();
  for (const [file, args] of Object.entries(baselines)) {
    const result = fallow([...args, path.resolve(directory, file)]);
    if (result.status > 1) return result.status;
  }
  const regressionResult = fallow([
    "dead-code",
    "--type-aware",
    "--save-regression-baseline",
    path.resolve(directory, "regression.json"),
  ]);
  return regressionResult.status > 1 ? regressionResult.status : 0;
}

function checkFreshness() {
  const temp = mkdtempSync(path.join(tmpdir(), "fallow-baselines-"));
  try {
    const status = regenerate(temp);
    if (status !== 0) return status;
    const stale = [...Object.keys(baselines), "regression.json"].filter(
      (file) =>
        !existsSync(path.join(baselineDir, file)) ||
        normalize(path.join(baselineDir, file)) !== normalize(path.join(temp, file)),
    );
    if (stale.length === 0) return (console.log("Fallow baselines are fresh."), 0);
    console.error(
      `Stale Fallow baselines: ${stale.join(", ")}. Run \`pnpm fallow:baseline:update\`.`,
    );
    return 1;
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

function regression() {
  const result = fallow(
    [
      "dead-code",
      "--type-aware",
      "--regression-baseline",
      `${baselineDir}/regression.json`,
      "--fail-on-regression",
      "--tolerance",
      "0",
      "--format",
      "json",
      "--quiet",
    ],
    true,
  );
  if (!result.stdout) return (console.error(result.error ?? "Fallow emitted no JSON."), 2);
  const report = JSON.parse(result.stdout);
  const abstained = report._meta?.type_aware?.abstained_count ?? 0;
  if (report.regression?.exceeded || report.regression?.status !== "pass" || abstained !== 0)
    return 1;
  console.log(`Regression baseline OK; ${abstained} abstained semantic queries.`);
  return result.status > 1 ? result.status : 0;
}

function gate(args) {
  const result = fallow(args);
  return result.status;
}

function ci() {
  requireCoverage();
  const pinned = JSON.parse(readFileSync("package.json", "utf8")).devDependencies.fallow;
  const version = fallow(["--version"], true);
  if (!version.stdout.includes(`fallow ${pinned}`))
    return (console.error(`Expected Fallow ${pinned}, got ${version.stdout}.`), 2);
  const skillDrift = run("git", [
    "diff",
    "--no-index",
    "--quiet",
    "node_modules/fallow/skills/fallow",
    ".agents/skills/fallow",
  ]);
  if (skillDrift.status !== 0)
    return (
      console.error(
        "Vendored Fallow skill differs from the installed package; re-vendor it before continuing.",
      ),
      skillDrift.status === 1 ? 1 : 2
    );
  for (const args of [
    ["type-aware", "status"],
    [
      "dead-code",
      "--type-aware",
      "--baseline",
      `${baselineDir}/dead-code.json`,
      "--fail-on-issues",
    ],
    ["dupes", "--baseline", `${baselineDir}/dupes.json`, "--fail-on-issues"],
    [
      "health",
      "--coverage",
      coverage,
      "--coverage-root",
      root,
      "--baseline",
      `${baselineDir}/health.json`,
      "--baseline-mode",
      "identity",
      "--fail-on-issues",
    ],
  ]) {
    const status = gate(args);
    if (status !== 0) return status;
  }
  const fresh = checkFreshness();
  return fresh === 0 ? regression() : fresh;
}

const command = process.argv[2];
if (command === "baseline:update") process.exit(regenerate(baselineDir));
if (command === "baseline:check") process.exit(checkFreshness());
if (command === "regression") process.exit(regression());
if (command === "ci") process.exit(ci());
console.error("usage: node scripts/fallow.mjs baseline:update|baseline:check|regression|ci");
process.exit(2);
