import { MATCH_REPLAY_SCENARIO, cloneReplayScenario } from "./replay-scenarios";

export const DIVERGED_REPLAY_SCENARIO = (() => {
  const scenario = cloneReplayScenario(MATCH_REPLAY_SCENARIO);
  scenario.name = "match-replay-diverged";
  scenario.expectedStates[1] = {
    ...scenario.expectedStates[1]!,
    players: {
      ...scenario.expectedStates[1]!.players,
      Guest: { ...scenario.expectedStates[1]!.players?.Guest, totalScore: 8 },
    },
  };
  return scenario;
})();

export const INCOMPLETE_REPLAY_SCENARIO = (() => {
  const scenario = cloneReplayScenario(MATCH_REPLAY_SCENARIO);
  scenario.name = "match-replay-incomplete";
  scenario.decisionScript = scenario.decisionScript.slice(0, 1);
  scenario.expectedStates = scenario.expectedStates.slice(0, 1);
  return scenario;
})();

export const EXTRA_STEP_REPLAY_SCENARIO = (() => {
  const scenario = cloneReplayScenario(MATCH_REPLAY_SCENARIO);
  scenario.name = "match-replay-extra-step";
  scenario.decisionScript = [
    ...scenario.decisionScript,
    { stepNumber: 3, actor: "Host", decisionType: "turn_action", choice: "stay" },
  ];
  scenario.expectedStates = [...scenario.expectedStates, scenario.expectedStates[1]!];
  return scenario;
})();
