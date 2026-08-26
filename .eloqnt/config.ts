import { defineConfig } from "@eloqnt/cli";

export default defineConfig({
  srcPath: ["./app", "./shared", "./game"],
  messages: {
    path: "./messages",
    locales: "infer",
    sourceLocale: "en",
    format: "po",
  },
  lint: {
    rules: {
      "missing-translation": "error",
      "orphan-message": "error",
    },
  },
});
