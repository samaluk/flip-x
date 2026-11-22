import { actionCard, numberCard } from "@/tests/builders/cards";
import type { DeterministicReplayScenario, ReplayExpectedState } from "./scenario-types";
import { withReplayFillerCards } from "./fillers";
import { cloneDeterministicStartOptions } from "./scenario-runner";

const replayOutcomes = {
  hostStays: {
    activePlayer: "Guest",
    roundStatus: "player_turns",
    players: { Host: { roundStatus: "stayed" }, Guest: { roundStatus: "active" } },
    latestEvent: { type: "stay", payload: {}, playerNames: "Host" },
  },
  matchScores: {
    activePlayer: null,
    roundStatus: "completed",
    endedBy: "all_inactive",
    players: {
      Host: { totalScore: 1, roundStatus: "completed" },
      Guest: { totalScore: 7, roundStatus: "completed" },
    },
    latestEvent: {
      type: "round_scored",
      payload: { finalRoundScore: 7 },
      playerNames: "Guest",
    },
  },
  freezeNeedsTarget: {
    activePlayer: "Guest",
    roundStatus: "resolving_action",
    pendingAction: {
      actionKind: "freeze",
      sourcePlayer: "Guest",
      eligibleTargets: ["Host", "Guest", "Third"],
      resume: "turns",
    },
    players: { Guest: { heldActionCards: ["freeze"] } },
    latestEvent: {
      type: "pending_action",
      payload: { actionKind: "freeze" },
      playerNames: "Guest",
    },
  },
  freezeTargetsThird: {
    activePlayer: "Host",
    roundStatus: "player_turns",
    pendingAction: null,
    players: {
      Guest: { heldActionCards: [] },
      Third: { roundStatus: "frozen", receivedActionCards: ["freeze"] },
    },
    latestEvent: { type: "freeze_applied", payload: {}, playerNames: "Guest → Third" },
  },
  hostStaysAfterFreeze: {
    activePlayer: "Guest",
    players: { Host: { roundStatus: "stayed" }, Third: { roundStatus: "frozen" } },
    latestEvent: { type: "stay", payload: {}, playerNames: "Host" },
  },
  frozenRoundScores: {
    activePlayer: null,
    roundStatus: "completed",
    endedBy: "all_inactive",
    players: {
      Host: { totalScore: 7, roundStatus: "completed" },
      Guest: { totalScore: 6, roundStatus: "completed" },
      Third: { totalScore: 8, roundStatus: "completed", receivedActionCards: ["freeze"] },
    },
    latestEvent: {
      type: "round_scored",
      payload: { finalRoundScore: 5 },
      playerNames: "Third",
    },
  },
} satisfies Record<string, ReplayExpectedState>;

export const MATCH_REPLAY_SCENARIO: DeterministicReplayScenario = {
  name: "match-replay-stays",
  scope: "match",
  playerNames: ["Host", "Guest"],
  setupMatch: {
    roundSeed: {
      drawPile: withReplayFillerCards(numberCard("m-open-1", 1), numberCard("m-open-2", 7)),
    },
  },
  decisionScript: [
    { stepNumber: 1, actor: "Host", decisionType: "turn_action", choice: "stay" },
    { stepNumber: 2, actor: "Guest", decisionType: "turn_action", choice: "stay" },
  ],
  expectedStates: [replayOutcomes.hostStays, replayOutcomes.matchScores],
};

export const ROUND_REPLAY_SCENARIO: DeterministicReplayScenario = {
  name: "round-replay-freeze",
  scope: "round",
  playerNames: ["Host", "Guest", "Third"],
  setupMatch: {
    roundSeed: {
      drawPile: withReplayFillerCards(
        numberCard("s-open-1", 1),
        numberCard("s-open-2", 2),
        numberCard("s-open-3", 3),
      ),
    },
  },
  setupRound: {
    roundSeed: {
      drawPile: withReplayFillerCards(
        numberCard("r-open-1", 4),
        numberCard("r-open-2", 5),
        numberCard("r-open-3", 6),
        actionCard("r-hit-1", "freeze"),
      ),
    },
  },
  decisionScript: [
    { stepNumber: 1, actor: "Guest", decisionType: "turn_action", choice: "hit" },
    {
      stepNumber: 2,
      actor: "Guest",
      decisionType: "target_confirmation",
      promptKind: "freeze",
      choice: "Third",
    },
    { stepNumber: 3, actor: "Host", decisionType: "turn_action", choice: "stay" },
    { stepNumber: 4, actor: "Guest", decisionType: "turn_action", choice: "stay" },
  ],
  expectedStates: [
    replayOutcomes.freezeNeedsTarget,
    replayOutcomes.freezeTargetsThird,
    replayOutcomes.hostStaysAfterFreeze,
    replayOutcomes.frozenRoundScores,
  ],
};

export function cloneReplayScenario<T extends DeterministicReplayScenario>(scenario: T): T {
  return {
    ...scenario,
    playerNames: [...scenario.playerNames] as T["playerNames"],
    setupMatch: cloneDeterministicStartOptions(scenario.setupMatch),
    setupRound: scenario.setupRound
      ? cloneDeterministicStartOptions(scenario.setupRound)
      : undefined,
    decisionScript: scenario.decisionScript.map((step) => ({ ...step })) as T["decisionScript"],
    expectedStates: scenario.expectedStates.map((expectedState) =>
      structuredClone(expectedState),
    ) as T["expectedStates"],
  };
}
