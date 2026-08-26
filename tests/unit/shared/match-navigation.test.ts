import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";
import { describe, expect, it, vi } from "vitest";

import { gameMatchPath, prefetchAndPushGameMatch } from "@/shared/i18n/match-navigation";

describe("match-navigation", () => {
  it("builds the localized game path for a match id", () => {
    expect(gameMatchPath("match-123")).toBe("/game/match-123");
  });

  it("prefetches the game shell before pushing to the match route", () => {
    const prefetch = vi.fn();
    const push = vi.fn();

    prefetchAndPushGameMatch({ prefetch, push }, "match-123");

    expect(prefetch).toHaveBeenCalledWith("/game/match-123", { kind: PrefetchKind.FULL });
    expect(push).toHaveBeenCalledWith("/game/match-123");
    expect(prefetch.mock.invocationCallOrder[0]).toBeLessThan(push.mock.invocationCallOrder[0]!);
  });
});
