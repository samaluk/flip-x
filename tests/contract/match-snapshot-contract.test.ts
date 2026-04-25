import { describe, expect, it } from "vitest";

import { createPlayerRoundStates, createRoundRuntime } from "@/game/logic/command-handler";
import { buildMatchSnapshot } from "@/game/logic/view-models";

describe("game session contract", () => {
  it("returns the expected top-level snapshot fields", () => {
    const snapshot = buildMatchSnapshot({
      matchId: "match-1",
      status: "in_progress",
      version: 1,
      hostPlayerId: "p1",
      viewerPlayerId: "p1",
      targetScore: 200,
      currentRoundNumber: 1,
      dealerSeat: 0,
      round: {
        phase: "player_turns",
        roundNumber: 1,
        dealerSeat: 0,
        drawPile: [],
        discardPile: [],
        openingSeatIndex: 3,
        turnSeatIndex: 0,
        activePlayerId: "p1",
        endedBy: "unknown",
        pendingAction: null,
        pendingFlip3: null,
      },
      players: [
        {
          playerId: "p1",
          displayName: "Alex",
          seatIndex: 0,
          totalScore: 0,
          isOnline: true,
        },
      ],
      playerStates: {
        p1: {
          playerId: "p1",
          status: "active",
          numberCards: [],
          bustCard: null,
          modifierCards: [],
          heldActionCards: [],
          receivedActionCards: [],
          roundScore: 0,
          pointsAtRisk: 0,
          hasFlip7: false,
        },
      },
      latestEvent: {
        eventType: "initial_deal",
        actorPlayerId: "p1",
        targetPlayerId: "p1",
        payload: { cardKind: "number", numberValue: 7 },
      },
      roundHistory: [
        {
          roundNumber: 1,
          phase: "completed",
          isCurrentRound: false,
          scores: [
            {
              playerId: "p1",
              roundScore: 0,
              totalScore: 0,
              pointsToTarget: 200,
              reachedTarget: false,
            },
          ],
        },
      ],
    });

    expect(snapshot).toEqual(
      expect.objectContaining({
        matchId: "match-1",
        status: "in_progress",
        currentRoundNumber: 1,
        dealerSeat: 0,
        viewerPlayerId: "p1",
        activePlayerId: "p1",
        roundHistory: expect.arrayContaining([
          expect.objectContaining({
            roundNumber: 1,
            phase: "completed",
          }),
        ]),
      }),
    );
  });

  it("supports next-round snapshots with advanced round number and dealer seat", () => {
    const players = [
      { playerId: "p1", seatIndex: 0 },
      { playerId: "p2", seatIndex: 1 },
      { playerId: "p3", seatIndex: 2 },
    ];
    const round = createRoundRuntime(players, 2, 1);
    const playerStates = createPlayerRoundStates(players);

    const snapshot = buildMatchSnapshot({
      matchId: "match-2",
      status: "in_progress",
      version: 1,
      hostPlayerId: null,
      targetScore: 200,
      currentRoundNumber: 2,
      dealerSeat: 1,
      viewerPlayerId: null,
      round,
      players: [
        { playerId: "p1", displayName: "Alex", seatIndex: 0, totalScore: 15, isOnline: true },
        { playerId: "p2", displayName: "Blair", seatIndex: 1, totalScore: 30, isOnline: false },
        { playerId: "p3", displayName: "Casey", seatIndex: 2, totalScore: 25, isOnline: false },
      ],
      playerStates,
      latestEvent: null,
      roundHistory: [
        {
          roundNumber: 1,
          phase: "completed",
          isCurrentRound: false,
          scores: [
            {
              playerId: "p1",
              roundScore: 15,
              totalScore: 15,
              pointsToTarget: 185,
              reachedTarget: false,
            },
            {
              playerId: "p2",
              roundScore: 30,
              totalScore: 30,
              pointsToTarget: 170,
              reachedTarget: false,
            },
            {
              playerId: "p3",
              roundScore: 25,
              totalScore: 25,
              pointsToTarget: 175,
              reachedTarget: false,
            },
          ],
        },
        {
          roundNumber: 2,
          phase: "projected",
          isCurrentRound: true,
          scores: [
            {
              playerId: "p1",
              roundScore: 8,
              totalScore: 23,
              pointsToTarget: 177,
              reachedTarget: false,
            },
            {
              playerId: "p2",
              roundScore: 12,
              totalScore: 42,
              pointsToTarget: 158,
              reachedTarget: false,
            },
            {
              playerId: "p3",
              roundScore: 0,
              totalScore: 25,
              pointsToTarget: 175,
              reachedTarget: false,
            },
          ],
        },
      ],
    });

    expect(snapshot.currentRoundNumber).toBe(2);
    expect(snapshot.dealerSeat).toBe(1);
    expect(snapshot.players.map((player) => player.totalScore)).toEqual([15, 30, 25]);
    expect(snapshot.roundHistory).toEqual([
      expect.objectContaining({
        roundNumber: 1,
        phase: "completed",
        scores: expect.arrayContaining([
          expect.objectContaining({
            playerId: "p2",
            totalScore: 30,
          }),
        ]),
      }),
      expect.objectContaining({
        roundNumber: 2,
        phase: "projected",
        isCurrentRound: true,
      }),
    ]);
  });

  it("projects bustCard onto the player snapshot", () => {
    const snapshot = buildMatchSnapshot({
      matchId: "match-3",
      status: "in_progress",
      version: 1,
      hostPlayerId: null,
      targetScore: 200,
      currentRoundNumber: 1,
      dealerSeat: 0,
      viewerPlayerId: null,
      round: null,
      players: [
        { playerId: "p1", displayName: "Alex", seatIndex: 0, totalScore: 0, isOnline: true },
      ],
      playerStates: {
        p1: {
          playerId: "p1",
          status: "busted",
          numberCards: [{ id: "n1", type: "number", label: "7", numberValue: 7 }],
          bustCard: { id: "n2", type: "number", label: "7", numberValue: 7 },
          modifierCards: [],
          heldActionCards: [],
          receivedActionCards: [],
          roundScore: 0,
          pointsAtRisk: 0,
          hasFlip7: false,
        },
      },
      latestEvent: null,
      roundHistory: [],
    });

    expect(snapshot.players[0]?.bustCard).toEqual({
      id: "n2",
      type: "number",
      label: "7",
      numberValue: 7,
    });
  });
});
