import type { ModifierCard, NumberCard } from "./card-types";
import type { PlayerRoundState } from "./turn-resolution";

export type ScoreBreakdown = {
  numberCardTotal: number;
  multiplierApplied: boolean;
  multipliedTotal: number;
  additiveModifierTotal: number;
  flip7Bonus: number;
  finalRoundScore: number;
};

function sumNumberCards(numberCards: NumberCard[]) {
  return numberCards.reduce((total, card) => total + card.numberValue, 0);
}

export function scoreRound(
  numberCards: NumberCard[],
  modifierCards: ModifierCard[],
  hasFlip7: boolean,
): ScoreBreakdown {
  const numberCardTotal = sumNumberCards(numberCards);
  const multiplierApplied = modifierCards.some((card) => card.modifierValue === "x2");
  const multipliedTotal = multiplierApplied ? numberCardTotal * 2 : numberCardTotal;
  const additiveModifierTotal = modifierCards.reduce((total, card) => {
    if (card.modifierValue === "x2") {
      return total;
    }

    return total + card.modifierValue;
  }, 0);
  const flip7Bonus = hasFlip7 ? 15 : 0;
  const finalRoundScore = multipliedTotal + additiveModifierTotal + flip7Bonus;

  return {
    numberCardTotal,
    multiplierApplied,
    multipliedTotal,
    additiveModifierTotal,
    flip7Bonus,
    finalRoundScore,
  };
}

export function computeScoreBreakdown(playerState: PlayerRoundState): ScoreBreakdown {
  if (playerState.bustCard) {
    return {
      numberCardTotal: 0,
      multiplierApplied: false,
      multipliedTotal: 0,
      additiveModifierTotal: 0,
      flip7Bonus: 0,
      finalRoundScore: 0,
    };
  }

  return scoreRound(
    playerState.numberCards,
    playerState.modifierCards,
    playerState.hasFlip7,
  );
}
