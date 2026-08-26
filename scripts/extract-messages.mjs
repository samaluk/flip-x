import { unstable_extractMessages } from "next-intl/extractor";

await unstable_extractMessages({
  messages: {
    path: "./messages",
    format: "po",
    locales: "infer",
    sourceLocale: "en",
  },
  srcPath: ["./app", "./shared", "./game"],
});

console.log("Extracted messages to messages/*.po");
