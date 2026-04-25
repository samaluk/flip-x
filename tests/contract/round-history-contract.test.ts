import { describe, expect, it } from "vitest";

import { buildTestMatchSnapshot } from "@/tests/builders/match-snapshot";

describe("round history contract", () => {
  it("builds completed round history entries with score progress", () => {
    const snapshot = buildTestMatchSnapshot({
      matchId: "match-4",
      currentRoundNumber: 2,
      players: [
        { playerId: "p1", displayName: "Alex", seatIndex: 0, totalScore: 45, isOnline: true },
        { playerId: "p2", displayName: "Blair", seatIndex: 1, totalScore: 50, isOnline: true },
      ],
      playerStates: {},
      roundHistory: [
        {
          roundNumber: 1,
          phase: "completed",
          isCurrentRound: false,
          scores: [
            {
              playerId: "p1",
              roundScore: 20,
              totalScore: 20,
              pointsToTarget: 180,
              reachedTarget: false,
            },
            {
              playerId: "p2",
              roundScore: 25,
              totalScore: 25,
              pointsToTarget: 175,
              reachedTarget: false,
            },
          ],
        },
        {
          roundNumber: 2,
          phase: "completed",
          isCurrentRound: false,
          scores: [
            {
              playerId: "p1",
              roundScore: 25,
              totalScore: 45,
              pointsToTarget: 155,
              reachedTarget: false,
            },
            {
              playerId: "p2",
              roundScore: 25,
              totalScore: 50,
              pointsToTarget: 150,
              reachedTarget: false,
            },
          ],
        },
      ],
    });

    expect(snapshot.roundHistory).toHaveLength(2);
    expect(snapshot.roundHistory[1]).toEqual(
      expect.objectContaining({
        roundNumber: 2,
        phase: "completed",
        isCurrentRound: false,
        scores: expect.arrayContaining([
          expect.objectContaining({
            playerId: "p1",
            totalScore: 45,
            pointsToTarget: 155,
            reachedTarget: false,
          }),
          expect.objectContaining({
            playerId: "p2",
            totalScore: 50,
            pointsToTarget: 150,
            reachedTarget: false,
          }),
        ]),
      }),
    );
  });
});
