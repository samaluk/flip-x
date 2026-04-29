import type { Card } from "@/game/logic/card-types";

import type { ConfectMatchSnapshot } from "./confect-match-snapshot";

export type DeterministicRoundSeed = {
  drawPile: Card[];
};

export type DeterministicStartOptions = {
  roundSeed: DeterministicRoundSeed;
};

export type DeterministicSetupScenario = {
  name: string;
  playerNames: readonly [string, string, ...string[]];
  startMatch: DeterministicStartOptions;
  startNextRound: DeterministicStartOptions;
};

export type ReplayDecisionStep =
  | {
      stepNumber: number;
      actor: string;
      decisionType: "turn_action";
      choice: "hit" | "stay";
    }
  | {
      stepNumber: number;
      actor: string;
      decisionType: "target_confirmation";
      promptKind: "freeze" | "flip_three";
      choice: string;
    };

export type CanonicalReplaySnapshot = {
  status: ConfectMatchSnapshot["status"];
  currentRoundNumber: number;
  dealerSeat: number;
  activePlayer: string | null;
  roundStatus: ConfectMatchSnapshot["roundStatus"];
  endedBy: ConfectMatchSnapshot["endedBy"];
  pendingAction: {
    actionKind: "freeze" | "flip_three";
    sourcePlayer: string;
    eligibleTargets: string[];
    resume: "dealing" | "turns";
  } | null;
  pendingFlip3: {
    sourcePlayer: string;
    targetPlayer: string;
    cardsRemaining: number;
    deferredActionCards: ReadonlyArray<{ label: string; actionKind: string }>;
  } | null;
  players: Array<{
    displayName: string;
    seatIndex: number;
    totalScore: number;
    roundStatus: ConfectMatchSnapshot["players"][number]["roundStatus"];
    pointsAtRisk: number;
    numberCards: number[];
    modifierCards: Array<
      ConfectMatchSnapshot["players"][number]["modifierCards"][number]["modifierValue"]
    >;
    heldActionCards: string[];
    receivedActionCards: string[];
  }>;
  latestEvent: {
    type: string;
    payload: Record<string, unknown>;
    playerNames: string | null;
  } | null;
};

export type DeterministicReplayScenario = {
  name: string;
  scope: "match" | "round";
  playerNames: readonly [string, string, ...string[]];
  setupMatch: DeterministicStartOptions;
  setupRound?: DeterministicStartOptions;
  decisionScript: ReplayDecisionStep[];
  expectedStates: CanonicalReplaySnapshot[];
};

export type ReplayResult =
  | {
      scenarioName: string;
      scope: "match" | "round";
      status: "matched";
      stepsConsumed: number;
      finalOutcome: CanonicalReplaySnapshot;
    }
  | {
      scenarioName: string;
      scope: "match" | "round";
      status: "diverged";
      stepsConsumed: number;
      divergence: {
        stepNumber: number;
        decision: ReplayDecisionStep;
        expectedState: CanonicalReplaySnapshot;
        actualState: CanonicalReplaySnapshot;
        message: string;
      };
    }
  | {
      scenarioName: string;
      scope: "match" | "round";
      status: "invalid";
      stepsConsumed: number;
      validationError: string;
    };

export type CanonicalSetupSnapshot = Pick<
  ConfectMatchSnapshot,
  "status" | "currentRoundNumber" | "dealerSeat" | "activePlayerId" | "roundStatus" | "endedBy"
> & {
  players: Array<{
    displayName: string;
    seatIndex: number;
    roundStatus: ConfectMatchSnapshot["players"][number]["roundStatus"];
    totalScore: number;
    pointsAtRisk: number;
    numberCards: number[];
    modifierCards: Array<
      ConfectMatchSnapshot["players"][number]["modifierCards"][number]["modifierValue"]
    >;
    heldActionKinds: string[];
    receivedActionKinds: string[];
  }>;
  latestEvent: ConfectMatchSnapshot["latestEvent"] extends infer T
    ? T extends null
      ? null
      : {
          type: string;
          actorPlayerId?: string | null;
          targetPlayerId?: string | null;
          payload: Record<string, unknown>;
        }
    : never;
};
