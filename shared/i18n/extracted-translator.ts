/** Translator callback shape returned by `useExtracted`. */
export type ExtractedTranslator = (
  message: string,
  values?: Record<string, string | number>,
) => string;
