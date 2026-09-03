import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { LatestRoundEvent } from "@/game/logic/latest-round-event";
import { useLatestRoundEventBody } from "@/game/ui/use-round-event-format";
import { IntlEnProvider } from "@/tests/test-intl";

describe("useLatestRoundEventBody", () => {
  function formatEvent(event: LatestRoundEvent | null): string {
    const { result } = renderHook(() => useLatestRoundEventBody(event), {
      wrapper: IntlEnProvider,
    });
    return result.current;
  }

  it("returns default message when latest event is null", () => {
    expect(formatEvent(null)).toBe("No table event has been logged yet.");
  });

  it("formats pending_action for all action kinds", () => {
    expect(
      formatEvent({
        type: "pending_action",
        payload: { actionKind: "flip_three" },
      }),
    ).toBe("Flip Three is waiting for a target.");

    expect(
      formatEvent({
        type: "pending_action",
        payload: { actionKind: "freeze" },
      }),
    ).toBe("Freeze is waiting for a target.");

    expect(
      formatEvent({
        type: "pending_action",
        payload: { actionKind: "second_chance" },
      }),
    ).toBe("Second Chance is waiting for a target.");
  });

  it("formats second_chance_used", () => {
    expect(
      formatEvent({
        type: "second_chance_used",
        payload: { duplicate: 5 },
      }),
    ).toBe("Second Chance discarded duplicate 5 instead of busting the player.");
  });

  it("formats freeze_applied", () => {
    expect(
      formatEvent({
        type: "freeze_applied",
        payload: {},
      }),
    ).toBe("Frozen! Points banked and out of round.");
  });

  it("formats flip_three_targeted", () => {
    expect(
      formatEvent({
        type: "flip_three_targeted",
        payload: { cardsRemaining: 3 },
      }),
    ).toBe("Flip Three targeted! 3 cards to draw.");
  });

  it("formats flip3_hit", () => {
    expect(
      formatEvent({
        type: "flip3_hit",
        payload: { cardKind: "number", numberValue: 2 },
      }),
    ).toBe("Card drawn.");
  });

  it("formats flip3_completed", () => {
    expect(
      formatEvent({
        type: "flip3_completed",
        payload: {},
      }),
    ).toBe("Flip Three completed!");
  });

  it("formats deferred_action for all action kinds", () => {
    expect(
      formatEvent({
        type: "deferred_action",
        payload: { actionKind: "flip_three" },
      }),
    ).toBe("Flip Three was queued until Flip Three finished.");

    expect(
      formatEvent({
        type: "deferred_action",
        payload: { actionKind: "freeze" },
      }),
    ).toBe("Freeze was queued until Flip Three finished.");

    expect(
      formatEvent({
        type: "deferred_action",
        payload: { actionKind: "second_chance" },
      }),
    ).toBe("Second Chance was queued until Flip Three finished.");
  });

  it("formats duplicate_bust", () => {
    expect(
      formatEvent({
        type: "duplicate_bust",
        payload: { duplicate: 7 },
      }),
    ).toBe("Drew duplicate 7 — bust!");
  });

  it("formats number_drawn", () => {
    expect(
      formatEvent({
        type: "number_drawn",
        payload: { numberValue: 8 },
      }),
    ).toBe("Revealed number 8.");
  });

  it("formats flip7", () => {
    expect(
      formatEvent({
        type: "flip7",
        payload: {},
      }),
    ).toBe("Triggered flip-x!");
  });

  it("formats modifier_drawn for x2 and plus values", () => {
    expect(
      formatEvent({
        type: "modifier_drawn",
        payload: { modifierValue: "x2" },
      }),
    ).toBe("Player revealed modifier ×2.");

    expect(
      formatEvent({
        type: "modifier_drawn",
        payload: { modifierValue: 4 },
      }),
    ).toBe("Player revealed modifier +4.");
  });

  it("formats second_chance_held, discarded, and passed", () => {
    expect(
      formatEvent({
        type: "second_chance_held",
        payload: {},
      }),
    ).toBe("Player stored a Second Chance card.");

    expect(
      formatEvent({
        type: "second_chance_discarded",
        payload: {},
      }),
    ).toBe("Extra Second Chance was discarded because no eligible recipient existed.");

    expect(
      formatEvent({
        type: "second_chance_passed",
        payload: {},
      }),
    ).toBe("Extra Second Chance was passed to another active player.");
  });

  it("formats initial_deal with number, modifier, and action cards", () => {
    expect(
      formatEvent({
        type: "initial_deal",
        payload: { cardKind: "number", numberValue: 10 },
      }),
    ).toBe("Initial deal revealed 10 for the player.");

    expect(
      formatEvent({
        type: "initial_deal",
        payload: { cardKind: "modifier", modifierValue: "x2" },
      }),
    ).toBe("Initial deal revealed ×2 for the player.");

    expect(
      formatEvent({
        type: "initial_deal",
        payload: { cardKind: "modifier", modifierValue: 6 },
      }),
    ).toBe("Initial deal revealed +6 for the player.");

    expect(
      formatEvent({
        type: "initial_deal",
        payload: { cardKind: "action", actionKind: "freeze" },
      }),
    ).toBe("Initial deal revealed Freeze for the player.");
  });

  it("formats stay", () => {
    expect(
      formatEvent({
        type: "stay",
        payload: {},
      }),
    ).toBe("Stayed and banked points.");
  });

  it("formats hit with number, modifier, and action cards", () => {
    expect(
      formatEvent({
        type: "hit",
        payload: { cardKind: "number", numberValue: 3 },
      }),
    ).toBe("Hit and revealed 3.");

    expect(
      formatEvent({
        type: "hit",
        payload: { cardKind: "modifier", modifierValue: 10 },
      }),
    ).toBe("Hit and revealed +10.");

    expect(
      formatEvent({
        type: "hit",
        payload: { cardKind: "action", actionKind: "second_chance" },
      }),
    ).toBe("Hit and revealed Second Chance.");
  });

  it("formats round_scored", () => {
    expect(
      formatEvent({
        type: "round_scored",
        payload: { finalRoundScore: 45 },
      }),
    ).toBe("Round scored at 45 points.");
  });
});
