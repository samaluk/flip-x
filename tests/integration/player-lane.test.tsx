import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlayerLane } from "@/game/ui/player-lane";
import type { MatchSnapshot } from "@/game/logic/view-models";
import { withIntlEn } from "@/tests/test-intl";

function player(
  overrides: Partial<MatchSnapshot["players"][number]> = {},
): MatchSnapshot["players"][number] {
  return {
    playerId: "p1",
    displayName: "Alex",
    seatIndex: 0,
    totalScore: 12,
    isOnline: true,
    roundStatus: "active",
    pointsAtRisk: 12,
    numberCards: [],
    modifierCards: [],
    heldActionCards: [],
    receivedActionCards: [],
    scoreBreakdown: {
      additiveModifierTotal: 0,
      finalRoundScore: 12,
      flip7Bonus: 0,
      multipliedTotal: 12,
      multiplierApplied: false,
      numberCardTotal: 12,
    },
    bustCard: null,
    ...overrides,
  };
}

describe("player lane", () => {
  it("rerenders when targeting state changes", () => {
    const onSelectTarget = vi.fn();
    const { rerender } = render(
      withIntlEn(<PlayerLane player={player()} isActive={false} onSelectTarget={onSelectTarget} />),
    );

    expect(
      screen.queryByRole("button", { name: /select alex as target/i }),
    ).not.toBeInTheDocument();

    rerender(
      withIntlEn(
        <PlayerLane
          player={player()}
          isActive={false}
          isTargetable
          onSelectTarget={onSelectTarget}
        />,
      ),
    );

    expect(screen.getByRole("button", { name: /select alex as target/i })).toBeInTheDocument();
  });

  it("rerenders the Flip Three badge and received action cards", () => {
    const { rerender } = render(withIntlEn(<PlayerLane player={player()} isActive={false} />));

    expect(screen.queryByText(/2 to draw/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/freeze/i)).not.toBeInTheDocument();

    rerender(
      withIntlEn(
        <PlayerLane
          player={player({
            receivedActionCards: [{ label: "freeze", actionKind: "freeze" }],
          })}
          isActive={false}
          flip3Remaining={2}
          incomingActionKind="freeze"
        />,
      ),
    );

    expect(screen.getByText(/2 to draw/i)).toBeInTheDocument();
    expect(screen.getByText(/incoming/i)).toBeInTheDocument();
    expect(screen.getAllByText(/freeze/i).length).toBeGreaterThan(0);
  });

  it("renders bust card in a busted lane", () => {
    const bustCard = { id: "dup", type: "number" as const, label: "7", numberValue: 7 };
    render(
      withIntlEn(
        <PlayerLane
          player={player({
            roundStatus: "busted",
            numberCards: [{ id: "n1", type: "number", label: "7", numberValue: 7 }],
            bustCard,
          })}
          isActive={false}
        />,
      ),
    );

    expect(screen.getByText(/Busted/i)).toBeInTheDocument();
    expect(screen.getAllByText("7").length).toBeGreaterThanOrEqual(1);
  });
});
