import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScoreSummary } from "@/game/ui/score-summary";
import { withIntlEn } from "@/tests/test-intl";

describe("match flow UI", () => {
  it("renders score breakdown values for a completed round", () => {
    render(
      withIntlEn(
        <ScoreSummary
          players={[
            {
              playerId: "p1",
              displayName: "Alex",
              seatIndex: 0,
              totalScore: 42,
              isOnline: true,
              roundStatus: "completed",
              pointsAtRisk: 30,
              numberCards: [],
              bustCard: null,
              modifierCards: [],
              heldActionCards: [],
              receivedActionCards: [],
              scoreBreakdown: {
                additiveModifierTotal: 4,
                finalRoundScore: 30,
                flip7Bonus: 0,
                multipliedTotal: 26,
                multiplierApplied: true,
                numberCardTotal: 13,
              },
            },
          ]}
        />,
      ),
    );

    expect(screen.getByText(/final round score: 30/i)).toBeInTheDocument();
    expect(screen.getByText(/multiplier: ×2/i)).toBeInTheDocument();
  });
});
