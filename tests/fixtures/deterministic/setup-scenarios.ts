import type { DeterministicSetupScenario } from "./scenario-types";
import { actionCard, modifierCard, numberCard, withSetupFillerCards } from "./card-builders";
import { cloneDeterministicStartOptions } from "./scenario-runner";

export const BASIC_DETERMINISTIC_SETUP_SCENARIO: DeterministicSetupScenario = {
  name: "basic-deterministic-setup",
  playerNames: ["Host", "Guest"],
  startMatch: {
    roundSeed: {
      drawPile: withSetupFillerCards(numberCard("match-open-1", 1), numberCard("match-open-2", 7)),
    },
  },
  startNextRound: {
    roundSeed: {
      drawPile: withSetupFillerCards(
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
