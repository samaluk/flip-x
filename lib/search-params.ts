import { createSearchParamsCache, parseAsString } from "nuqs/server";

const searchParamsParsers = {
  code: parseAsString,
} as const;

export const searchParamsCache = createSearchParamsCache(searchParamsParsers);
