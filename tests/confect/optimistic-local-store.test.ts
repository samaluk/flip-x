import { OptimisticLocalStore } from "@confect/react";
import type { OptimisticLocalStore as ConvexOptimisticLocalStore } from "convex/browser";
import * as Option from "effect/Option";
import { describe, expect, it } from "vitest";

import refs from "@/confect/_generated/refs";

describe("Confect optimistic local store", () => {
  it("decodes cached query values and represents cache misses with Option", () => {
    const convexStore = makeConvexStore([
      {
        args: { lobbyCode: "ABCD" },
        value: {
          matchId: "match-id",
          lobbyCode: "ABCD",
          status: "setup",
          usedColorIds: [],
        },
      },
    ]);
    const store = OptimisticLocalStore.make(convexStore);

    expect(
      Option.getOrThrow(store.getQuery(refs.public.matches.getMatchByCode, { lobbyCode: "ABCD" })),
    ).toEqual({
      matchId: "match-id",
      lobbyCode: "ABCD",
      status: "setup",
      usedColorIds: [],
    });
    expect(
      Option.isNone(store.getQuery(refs.public.matches.getMatchByCode, { lobbyCode: "MISSING" })),
    ).toBe(true);
  });

  it("decodes all query arguments and encodes updated values", () => {
    const convexStore = makeConvexStore([
      {
        args: { lobbyCode: "ABCD" },
        value: null,
      },
    ]);
    const store = OptimisticLocalStore.make(convexStore);

    expect(store.getAllQueries(refs.public.matches.getMatchByCode)).toEqual([
      {
        args: { lobbyCode: "ABCD" },
        value: Option.some(null),
      },
    ]);

    store.setQuery(refs.public.matches.getMatchByCode, { lobbyCode: "ABCD" }, Option.none());
    expect(
      Option.isNone(store.getQuery(refs.public.matches.getMatchByCode, { lobbyCode: "ABCD" })),
    ).toBe(true);
  });
});

function makeConvexStore(
  initial: Array<{ args: Record<string, unknown>; value: unknown }>,
): ConvexOptimisticLocalStore {
  const entries = [...initial];
  return {
    getQuery: (_query, args) =>
      entries.find((entry) => JSON.stringify(entry.args) === JSON.stringify(args))?.value,
    getAllQueries: () => entries,
    setQuery: (_query, args, value) => {
      const existing = entries.find((entry) => JSON.stringify(entry.args) === JSON.stringify(args));
      if (existing) {
        existing.value = value;
      } else {
        entries.push({ args, value });
      }
    },
  } as ConvexOptimisticLocalStore;
}
