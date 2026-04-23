import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RoundHistoryTable } from "@/game/ui/round-history-table";
import { withIntlEn } from "@/tests/test-intl";

const players = [
  {
    playerId: "p1",
    displayName: "Alex",
    seatIndex: 0,
    totalScore: 45,
    isOnline: true,
    roundStatus: "active" as const,
    pointsAtRisk: 18,
    numberCards: [],
    modifierCards: [],
    heldActionCards: [],
    receivedActionCards: [],
    scoreBreakdown: {
      numberCardTotal: 18,
      multiplierApplied: false,
      multipliedTotal: 18,
      additiveModifierTotal: 0,
      flip7Bonus: 0,
      finalRoundScore: 18,
    },
    bustCard: null,
  },
  {
    playerId: "p2",
    displayName: "Blair",
    seatIndex: 1,
    totalScore: 198,
    isOnline: true,
    roundStatus: "stayed" as const,
    pointsAtRisk: 4,
    numberCards: [],
    modifierCards: [],
    heldActionCards: [],
    receivedActionCards: [],
    scoreBreakdown: {
      numberCardTotal: 4,
      multiplierApplied: false,
      multipliedTotal: 4,
      additiveModifierTotal: 0,
      flip7Bonus: 0,
      finalRoundScore: 4,
    },
    bustCard: null,
  },
];

describe("round history table", () => {
  it("renders round columns, player rows, and total plus gain cells", () => {
    render(
      withIntlEn(
        <RoundHistoryTable
          players={players}
          history={[
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
                  roundScore: 4,
                  totalScore: 202,
                  pointsToTarget: 0,
                  reachedTarget: true,
                },
              ],
            },
          ]}
        />,
      ),
    );

    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("Blair")).toBeInTheDocument();
    expect(screen.getByText("R1")).toBeInTheDocument();
    expect(screen.getByText("R2*")).toBeInTheDocument();
    expect(screen.getByText("63")).toBeInTheDocument();
    expect(screen.getAllByText("+18").length).toBeGreaterThan(0);
  });

  it("shows live projection copy, winner state, and target distance", () => {
    render(
      withIntlEn(
        <RoundHistoryTable
          players={players}
          history={[
            {
              roundNumber: 2,
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
                  roundScore: 4,
                  totalScore: 202,
                  pointsToTarget: 0,
                  reachedTarget: true,
                },
              ],
            },
          ]}
        />,
      ),
    );

    expect(screen.getByText(/live/i)).toBeInTheDocument();
    expect(screen.getByText("137 to target")).toBeInTheDocument();
    expect(screen.getByText("Winner")).toBeInTheDocument();
  });

  it("renders a horizontal scroll container", () => {
    render(withIntlEn(<RoundHistoryTable players={players} history={[]} />));

    expect(screen.getByText(/live history appears/i)).toBeInTheDocument();

    render(
      withIntlEn(
        <RoundHistoryTable
          players={players}
          history={[
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
          ]}
        />,
      ),
    );

    expect(screen.getByTestId("round-history-scroll")).toHaveClass("overflow-x-auto");
  });
});
