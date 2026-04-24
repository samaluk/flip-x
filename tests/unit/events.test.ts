import { describe, expect, it } from "vitest";

import { decodeRoundEvent, encodeRoundEvent, type RoundEvent } from "@/game/logic/events";

const roundEvents: RoundEvent[] = [
  {
    eventType: "initial_deal",
    actorPlayerId: "p1",
    targetPlayerId: "p1",
    payload: { cardKind: "number", numberValue: 7 },
  },
  {
    eventType: "hit",
    actorPlayerId: "p1",
    targetPlayerId: "p1",
    payload: { cardKind: "modifier", modifierValue: "x2" },
  },
  {
    eventType: "flip3_hit",
    actorPlayerId: "p2",
    targetPlayerId: "p2",
    payload: { cardKind: "action", actionKind: "freeze" },
  },
  {
    eventType: "number_drawn",
    actorPlayerId: "p1",
    targetPlayerId: "p1",
    payload: { numberValue: 12 },
  },
  {
    eventType: "modifier_drawn",
    actorPlayerId: "p1",
    targetPlayerId: "p1",
    payload: { modifierValue: 6 },
  },
  {
    eventType: "second_chance_held",
    actorPlayerId: "p1",
    targetPlayerId: "p1",
    payload: {},
  },
  {
    eventType: "second_chance_passed",
    actorPlayerId: "p1",
    targetPlayerId: "p2",
    payload: {},
  },
  {
    eventType: "second_chance_discarded",
    actorPlayerId: "p1",
    targetPlayerId: null,
    payload: {},
  },
  {
    eventType: "second_chance_used",
    actorPlayerId: "p1",
    targetPlayerId: "p1",
    payload: { duplicate: 7 },
  },
  {
    eventType: "duplicate_bust",
    actorPlayerId: "p1",
    targetPlayerId: "p1",
    payload: { duplicate: 8 },
  },
  {
    eventType: "flip7",
    actorPlayerId: "p1",
    targetPlayerId: "p1",
    payload: {},
  },
  {
    eventType: "freeze_applied",
    actorPlayerId: "p1",
    targetPlayerId: "p2",
    payload: {},
  },
  {
    eventType: "stay",
    actorPlayerId: "p1",
    targetPlayerId: "p1",
    payload: {},
  },
  {
    eventType: "flip_three_targeted",
    actorPlayerId: "p1",
    targetPlayerId: "p2",
    payload: { cardsRemaining: 3 },
  },
  {
    eventType: "flip3_completed",
    actorPlayerId: "p2",
    targetPlayerId: "p2",
    payload: {},
  },
  {
    eventType: "deferred_action",
    actorPlayerId: "p2",
    targetPlayerId: "p2",
    payload: { actionKind: "flip_three" },
  },
  {
    eventType: "pending_action",
    actorPlayerId: "p1",
    targetPlayerId: null,
    payload: { actionKind: "freeze" },
  },
  {
    eventType: "round_scored",
    actorPlayerId: "p1",
    targetPlayerId: "p1",
    payload: { finalRoundScore: 42 },
  },
];

describe("round event persistence", () => {
  it("round-trips every event type through the persisted shape", () => {
    for (const event of roundEvents) {
      expect(decodeRoundEvent(encodeRoundEvent(event))).toEqual(event);
    }
  });

  it("rejects unknown event types", () => {
    expect(() =>
      decodeRoundEvent({
        eventType: "unknown_event",
        actorPlayerId: null,
        targetPlayerId: null,
        payload: {},
      }),
    ).toThrow("Unknown round event type");
  });

  it("rejects invalid payloads", () => {
    expect(() =>
      decodeRoundEvent({
        eventType: "number_drawn",
        actorPlayerId: "p1",
        targetPlayerId: "p1",
        payload: { numberValue: "7" },
      }),
    ).toThrow("numberValue");
  });
});
