import { createSearchParamsCache, parseAsString } from "nuqs/server";

const searchParamsParsers: Readonly<{ code: typeof parseAsString }> = {
  code: parseAsString,
};

export const searchParamsCache = createSearchParamsCache(searchParamsParsers);
