import { describe, expect, it, vi } from "vitest";

import { expectRejectWithCode } from "@/tests/backend/convex-test-helper";

describe("expectRejectWithCode", () => {
  it("quiets console.error and asserts expected rejection code from promise", async () => {
    let consoleErrorCalled = false;
    await expectRejectWithCode(async () => {
      console.error('[CONVEX M(turns:takeTurn)] ConvexError "INVALID_TURN"');
      consoleErrorCalled = true;
      throw new Error('[CONVEX M(turns:takeTurn)] ConvexError "INVALID_TURN"');
    }, "INVALID_TURN");

    expect(consoleErrorCalled).toBe(true);
  });

  it("works with an action function returning a promise", async () => {
    await expectRejectWithCode(async () => {
      console.error('[CONVEX M(matches:joinMatch)] ConvexError "NAME_ALREADY_TAKEN"');
      throw new Error('[CONVEX M(matches:joinMatch)] ConvexError "NAME_ALREADY_TAKEN"');
    }, "NAME_ALREADY_TAKEN");
  });

  it("fails when the rejection code does not match", async () => {
    await expect(
      expectRejectWithCode(Promise.reject(new Error("OTHER_ERROR")), "INVALID_TURN"),
    ).rejects.toThrow();
  });

  it("fails when the promise resolves instead of rejecting", async () => {
    await expect(
      expectRejectWithCode(Promise.resolve("success"), "INVALID_TURN"),
    ).rejects.toThrow();
  });
});
