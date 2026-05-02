import fs from "node:fs";

const filePath = process.argv[2];
const key = process.argv[3];

if (!filePath || !key) {
  throw new Error("Usage: read-env-value-from-file.mjs <file> <KEY>");
}

const text = fs.readFileSync(filePath, "utf8");

for (const rawLine of text.split("\n")) {
  const line = rawLine.replace(/\r$/, "");
  if (line === "" || line.startsWith("#")) {
    continue;
  }

  const eq = line.indexOf("=");
  if (eq === -1) {
    continue;
  }

  const name = line.slice(0, eq);
  if (name !== key) {
    continue;
  }

  let value = line.slice(eq + 1);
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  process.stdout.write(value);
  process.exit(0);
}

process.exit(1);
