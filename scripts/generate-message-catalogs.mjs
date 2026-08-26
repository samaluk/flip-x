/* oxlint-disable typescript/no-unsafe-assignment, typescript/no-unsafe-member-access, typescript/no-unsafe-argument, typescript/no-unsafe-call, typescript/no-unsafe-type-assertion, typescript/no-unsafe-return -- build script over untyped PO parser output. */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const POParser = require(
  path.join(
    process.cwd(),
    "node_modules/.pnpm/po-parser@2.2.0/node_modules/po-parser/dist/index.js",
  ),
).default;

function setNestedProperty(object, keyPath, value) {
  const parts = keyPath.split(".");
  let current = object;
  for (let index = 0; index < parts.length - 1; index++) {
    const part = parts[index];
    if (
      typeof current[part] !== "object" ||
      current[part] === null ||
      Array.isArray(current[part])
    ) {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

function loadPoFile(relativePath) {
  const poPath = path.join(process.cwd(), relativePath);
  const parsed = POParser.parse(fs.readFileSync(poPath, "utf8"));
  const messages = {};
  for (const entry of parsed.messages ?? []) {
    const id = entry.msgctxt ? `${entry.msgctxt}.${entry.msgid}` : entry.msgid;
    setNestedProperty(messages, id, entry.msgstr);
  }
  return messages;
}

const catalogs = {};
for (const locale of ["en", "es"]) {
  catalogs[locale] = loadPoFile(`messages/${locale}.po`);

  fs.mkdirSync(path.join(process.cwd(), "messages/.lingual"), { recursive: true });
  fs.writeFileSync(
    path.join(process.cwd(), `messages/.lingual/${locale}.json`),
    `${JSON.stringify(catalogs[locale], null, 2)}\n`,
  );
}

const content = `// Snapshot of extracted PO catalogs for typing and tests.\n// Regenerate with: pnpm i18n:catalog\n\nexport const en = ${JSON.stringify(catalogs.en, null, 2)} as const;\n\nexport const es = ${JSON.stringify(catalogs.es, null, 2)} as const;\n\nexport type CatalogMessages = typeof en;\n`;
fs.writeFileSync(path.join(process.cwd(), "messages/catalogs.ts"), content);

console.log("Generated messages/catalogs.ts and messages/.lingual/*.json");
