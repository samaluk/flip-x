import { describe, expect, it } from "vitest";

import {
  DEFAULT_PLAYER_COLOR_ID,
  deserializePlayerColorId,
  resolvePlayerColorId,
} from "@/shared/lib/player-local-prefs";

describe("player-local-prefs", () => {
  describe("deserializePlayerColorId", () => {
    it("returns stored color when valid", () => {
      expect(deserializePlayerColorId("fuchsia")).toBe("fuchsia");
    });

    it("falls back to default when invalid", () => {
      expect(deserializePlayerColorId("not-a-color")).toBe(DEFAULT_PLAYER_COLOR_ID);
    });
  });

  describe("resolvePlayerColorId", () => {
    it("keeps color when not used", () => {
      expect(resolvePlayerColorId("cyan", [])).toBe("cyan");
      expect(resolvePlayerColorId("fuchsia", ["cyan"])).toBe("fuchsia");
    });

    it("picks first available when color is taken", () => {
      expect(resolvePlayerColorId("cyan", ["cyan"])).not.toBe("cyan");
    });
  });
});
