import { createSearchParamsCache, parseAsString } from "nuqs/server";

export const searchParamsParsers = {
  code: parseAsString,
} as const;

export const searchParamsCache = createSearchParamsCache(searchParamsParsers);