import type { ActionCard, Card, ModifierCard, NumberCard } from "@/game/logic/card-types";

import type { DeterministicSetupScenario } from "./scenario-types";
import { cloneDeterministicStartOptions } from "./scenario-runner";

function numberCard(id: string, numberValue: number): NumberCard {
  return {
    id,
    type: "number",
    label: String(numberValue),
    numberValue,
  };
}

function modifierCard(id: string, modifierValue: ModifierCard["modifierValue"]): ModifierCard {
  return {
    id,
    type: "modifier",
    label: modifierValue === "x2" ? "x2" : `+${modifierValue}`,
    modifierValue,
  };
}

function actionCard(id: string, actionKind: ActionCard["actionKind"]): ActionCard {
  return {
    id,
    type: "action",
    label: actionKind,
    actionKind,
  };
}

function withFillerCards(...cards: Card[]) {
  return [
    ...cards,
    numberCard("fill-1", 11),
    numberCard("fill-2", 12),
    actionCard("fill-3", "second_chance"),
    modifierCard("fill-4", 2),
  ];
}

export const BASIC_DETERMINISTIC_SETUP_SCENARIO: DeterministicSetupScenario = {
  name: "basic-deterministic-setup",
  playerNames: ["Host", "Guest"],
  startMatch: {
    roundSeed: {
      drawPile: withFillerCards(numberCard("match-open-1", 1), numberCard("match-open-2", 7)),
    },
  },
  startNextRound: {
    roundSeed: {
      drawPile: withFillerCards(
        modifierCard("round-open-1", 4),
        actionCard("round-open-2", "freeze"),
      ),
    },
  },
};

export function cloneSetupScenario(scenario = BASIC_DETERMINISTIC_SETUP_SCENARIO) {
  return {
    ...scenario,
    playerNames: [...scenario.playerNames] as typeof scenario.playerNames,
    startMatch: cloneDeterministicStartOptions(scenario.startMatch),
    startNextRound: cloneDeterministicStartOptions(scenario.startNextRound),
  } satisfies DeterministicSetupScenario;
}
