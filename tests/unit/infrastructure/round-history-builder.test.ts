import { describe, expect, it } from "vitest";

import { calculateRoundHistory } from "@/game/infrastructure/round-history-builder";

const players = [
  { playerId: "p1", totalScore: 45, seatIndex: 0 },
  { playerId: "p2", totalScore: 50, seatIndex: 1 },
  { playerId: "p3", totalScore: 25, seatIndex: 2 },
];

describe("round history builder", () => {
  it("builds cumulative totals for completed rounds and fills missing scores with zero", () => {
    const history = calculateRoundHistory({
      targetScore: 200,
      currentRoundNumber: 2,
      matchStatus: "in_progress",
      players,
      completedRounds: [
        {
          roundNumber: 1,
          scoreByPlayerId: new Map([
            ["p1", 20],
            ["p2", 25],
          ]),
        },
        {
          roundNumber: 2,
          scoreByPlayerId: new Map([
            ["p1", 25],
            ["p2", 25],
            ["p3", 25],
          ]),
        },
      ],
      projectedRound: null,
    });

    expect(history).toEqual([
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
          {
            playerId: "p3",
            roundScore: 0,
            totalScore: 0,
            pointsToTarget: 200,
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
          {
            playerId: "p3",
            roundScore: 25,
            totalScore: 25,
            pointsToTarget: 175,
            reachedTarget: false,
          },
        ],
      },
    ]);
  });

  it("projects the current round from persisted totals plus points at risk", () => {
    const history = calculateRoundHistory({
      targetScore: 200,
      currentRoundNumber: 3,
      matchStatus: "in_progress",
      players,
      completedRounds: [
        {
          roundNumber: 1,
          scoreByPlayerId: new Map([
            ["p1", 20],
            ["p2", 25],
            ["p3", 10],
          ]),
        },
        {
          roundNumber: 2,
          scoreByPlayerId: new Map([
            ["p1", 25],
            ["p2", 25],
            ["p3", 15],
          ]),
        },
      ],
      projectedRound: {
        roundNumber: 3,
        pointsAtRiskByPlayerId: new Map([
          ["p1", 18],
          ["p2", 160],
        ]),
      },
    });

    expect(history.at(-1)).toEqual({
      roundNumber: 3,
      phase: "projected",
      isCurrentRound: true,
      scores: [
        {
          playerId: "p1",
          roundScore: 18,
          totalScore: 63,
          pointsToTarget: 137,
          reachedTarget: false,
        },
        {
          playerId: "p2",
          roundScore: 160,
          totalScore: 210,
          pointsToTarget: 0,
          reachedTarget: true,
        },
        {
          playerId: "p3",
          roundScore: 0,
          totalScore: 25,
          pointsToTarget: 175,
          reachedTarget: false,
        },
      ],
    });
  });

  it("does not append a projected duplicate when there is no live round", () => {
    const history = calculateRoundHistory({
      targetScore: 200,
      currentRoundNumber: 2,
      matchStatus: "in_progress",
      players,
      completedRounds: [
        {
          roundNumber: 1,
          scoreByPlayerId: new Map([
            ["p1", 20],
            ["p2", 25],
            ["p3", 10],
          ]),
        },
      ],
      projectedRound: null,
    });

    expect(history).toHaveLength(1);
    expect(history[0]?.phase).toBe("completed");
  });

  it("suppresses projected history once the match is completed", () => {
    const history = calculateRoundHistory({
      targetScore: 200,
      currentRoundNumber: 3,
      matchStatus: "completed",
      players,
      completedRounds: [
        {
          roundNumber: 1,
          scoreByPlayerId: new Map([
            ["p1", 20],
            ["p2", 25],
            ["p3", 10],
          ]),
        },
      ],
      projectedRound: {
        roundNumber: 3,
        pointsAtRiskByPlayerId: new Map([["p1", 99]]),
      },
    });

    expect(history).toHaveLength(1);
    expect(history[0]?.phase).toBe("completed");
  });
});
