import { describe, expect, it } from "vitest";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  deserializePlayerRoundState,
  deserializeRoundEvent,
  deserializeRoundRuntime,
  serializePlayerRoundState,
  serializeRoundEvent,
  serializeRoundRuntime,
} from "@/game/infrastructure/serializers";
import type { RoundEvent } from "@/game/logic/events";
import type { PlayerRoundState, RoundRuntime } from "@/game/logic/round-state";

const roundId = "round-1" as Id<"rounds">;
const playerIds = new Map<string, Id<"players">>([
  ["p1", "p1" as Id<"players">],
  ["p2", "p2" as Id<"players">],
]);

const numberCard = { id: "n1", type: "number" as const, label: "7", numberValue: 7 };
const actionCard = {
  id: "a1",
  type: "action" as const,
  label: "freeze",
  actionKind: "freeze" as const,
};

describe("infrastructure serializers", () => {
  it("round-trips round runtime through persisted fields", () => {
    const round: RoundRuntime = {
      phase: "player_turns",
      roundNumber: 2,
      dealerSeat: 1,
      drawPile: [numberCard],
      discardPile: [actionCard],
      openingSeatIndex: 2,
      turnSeatIndex: 1,
      activePlayerId: "p1",
      endedBy: "unknown",
      pendingAction: {
        sourcePlayerId: "p1",
        actionKind: "freeze",
        eligibleTargetIds: ["p1", "p2"],
        resume: "turns",
      },
      pendingFlip3: {
        sourcePlayerId: "p1",
        targetPlayerId: "p2",
        cardsRemaining: 2,
        deferredActionCards: [actionCard],
      },
    };

    const serialized = serializeRoundRuntime(round, playerIds);
    const doc = {
      _id: roundId,
      _creationTime: 1,
      matchId: "match-1" as Id<"matches">,
      roundNumber: round.roundNumber,
      startedAt: 1,
      ...serialized,
    } as Doc<"rounds">;

    expect(deserializeRoundRuntime(doc)).toEqual(round);
  });

  it("round-trips player round state through persisted fields", () => {
    const playerState: PlayerRoundState = {
      playerId: "p1",
      status: "active",
      numberCards: [numberCard],
      modifierCards: [],
      heldActionCards: [actionCard],
      receivedActionCards: [],
      roundScore: 7,
      pointsAtRisk: 7,
      hasFlip7: false,
      bustCard: null,
    };

    const serialized = serializePlayerRoundState(roundId, playerState, playerIds);
    const doc = {
      _id: "state-1" as Id<"roundPlayerStates">,
      _creationTime: 1,
      ...serialized,
    } as Doc<"roundPlayerStates">;

    expect(deserializePlayerRoundState(doc)).toEqual(playerState);
  });

  it("round-trips round events while converting player ids", () => {
    const event: RoundEvent = {
      eventType: "freeze_applied",
      actorPlayerId: "p1",
      targetPlayerId: "p2",
      payload: {},
    };

    const serialized = serializeRoundEvent(event, playerIds);
    const doc = {
      _id: "event-1" as Id<"roundEvents">,
      _creationTime: 1,
      roundId,
      sequence: 1,
      createdAt: 1,
      ...serialized,
    } as Doc<"roundEvents">;

    expect(deserializeRoundEvent(doc)).toEqual(event);
  });
});
