import { describe, expect, it } from "vitest";

import { getLanePose, getTransitionPose } from "./player-lane-status";

describe("lane pose transitions", () => {
  it.each([
    ["active", "busted", "bust"],
    ["active", "stayed", "stay"],
    ["active", "frozen", "stay"],
    ["busted", "completed", null],
    ["stayed", "active", null],
    ["stayed", "stayed", null],
  ] as const)("transitions %s to %s with pose %s", (previous, next, pose) => {
    expect(getTransitionPose(previous, next)).toBe(pose);
  });

  it("keeps the resolved pose while a lane remains banked or busted", () => {
    expect(getLanePose("busted")).toBe("bust");
    expect(getLanePose("frozen")).toBe("stay");
    expect(getLanePose("active")).toBeNull();
  });
});
