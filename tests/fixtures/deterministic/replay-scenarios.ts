import { actionCard, numberCard, withReplayFillerCards } from "./card-builders";
import type { DeterministicReplayScenario, ReplayExpectedState } from "./scenario-types";
import { cloneDeterministicStartOptions } from "./scenario-runner";

function expectState(snapshot: ReplayExpectedState): ReplayExpectedState {
  return snapshot;
}

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
  expectedStates: [
    expectState({
      activePlayer: "Guest",
      roundStatus: "player_turns",
      players: {
        Host: {
          roundStatus: "stayed",
          pointsAtRisk: 1,
          numberCards: [1],
        },
        Guest: {
          roundStatus: "active",
          pointsAtRisk: 7,
          numberCards: [7],
        },
      },
      latestEvent: {
        type: "stay",
        payload: {},
        playerNames: "Host",
      },
    }),
    expectState({
      activePlayer: null,
      roundStatus: "completed",
      endedBy: "all_inactive",
      players: {
        Host: {
          totalScore: 1,
          roundStatus: "completed",
          pointsAtRisk: 1,
          numberCards: [1],
        },
        Guest: {
          totalScore: 7,
          roundStatus: "completed",
          pointsAtRisk: 7,
          numberCards: [7],
        },
      },
      latestEvent: {
        type: "round_scored",
        payload: { finalRoundScore: 7 },
        playerNames: "Guest",
      },
    }),
  ],
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
    { stepNumber: 3, actor: "Guest", decisionType: "turn_action", choice: "stay" },
    { stepNumber: 4, actor: "Host", decisionType: "turn_action", choice: "stay" },
  ],
  expectedStates: [
    expectState({
      currentRoundNumber: 2,
      activePlayer: "Guest",
      roundStatus: "resolving_action",
      pendingAction: {
        actionKind: "freeze",
        sourcePlayer: "Guest",
        eligibleTargets: ["Host", "Guest", "Third"],
        resume: "turns",
      },
      pendingFlip3: null,
      players: {
        Host: {
          totalScore: 1,
          roundStatus: "active",
          pointsAtRisk: 6,
          numberCards: [6],
        },
        Guest: {
          totalScore: 2,
          roundStatus: "active",
          pointsAtRisk: 4,
          numberCards: [4],
          heldActionCards: ["freeze"],
        },
        Third: {
          totalScore: 3,
          roundStatus: "active",
          pointsAtRisk: 5,
          numberCards: [5],
        },
      },
      latestEvent: {
        type: "pending_action",
        payload: { actionKind: "freeze" },
        playerNames: "Guest",
      },
    }),
    expectState({
      currentRoundNumber: 2,
      activePlayer: "Guest",
      roundStatus: "player_turns",
      pendingAction: null,
      pendingFlip3: null,
      players: {
        Host: {
          totalScore: 1,
          roundStatus: "active",
          pointsAtRisk: 6,
          numberCards: [6],
        },
        Guest: {
          totalScore: 2,
          roundStatus: "active",
          pointsAtRisk: 4,
          numberCards: [4],
        },
        Third: {
          totalScore: 3,
          roundStatus: "frozen",
          pointsAtRisk: 5,
          numberCards: [5],
          receivedActionCards: ["freeze"],
        },
      },
      latestEvent: {
        type: "freeze_applied",
        payload: {},
        playerNames: "Guest → Third",
      },
    }),
    expectState({
      currentRoundNumber: 2,
      activePlayer: "Host",
      roundStatus: "player_turns",
      players: {
        Host: {
          totalScore: 1,
          roundStatus: "active",
          pointsAtRisk: 6,
          numberCards: [6],
        },
        Guest: {
          totalScore: 2,
          roundStatus: "stayed",
          pointsAtRisk: 4,
          numberCards: [4],
        },
        Third: {
          totalScore: 3,
          roundStatus: "frozen",
          pointsAtRisk: 5,
          numberCards: [5],
          receivedActionCards: ["freeze"],
        },
      },
      latestEvent: {
        type: "stay",
        payload: {},
        playerNames: "Guest",
      },
    }),
    expectState({
      currentRoundNumber: 2,
      activePlayer: null,
      roundStatus: "completed",
      endedBy: "all_inactive",
      players: {
        Host: {
          totalScore: 7,
          roundStatus: "completed",
          pointsAtRisk: 6,
          numberCards: [6],
        },
        Guest: {
          totalScore: 6,
          roundStatus: "completed",
          pointsAtRisk: 4,
          numberCards: [4],
        },
        Third: {
          totalScore: 8,
          roundStatus: "completed",
          pointsAtRisk: 5,
          numberCards: [5],
          receivedActionCards: ["freeze"],
        },
      },
      latestEvent: {
        type: "round_scored",
        payload: { finalRoundScore: 5 },
        playerNames: "Third",
      },
    }),
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
