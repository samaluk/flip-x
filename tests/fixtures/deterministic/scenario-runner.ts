import type { Card } from "@/game/logic/card-types";
import type { MatchSnapshot } from "@/game/logic/view-models";

import { canonicalizeSnapshot } from "./replay-assertions";
import type { DeterministicStartOptions } from "./scenario-types";
import type {
  DeterministicReplayScenario,
  ReplayDecisionStep,
  ReplayResult,
} from "./scenario-types";

export function cloneCard<T extends Card>(card: T): T {
  return structuredClone(card);
}

export function cloneCards(cards: readonly Card[]): Card[] {
  return cards.map((card) => cloneCard(card));
}

export function cloneDeterministicStartOptions(
  options: DeterministicStartOptions,
): DeterministicStartOptions {
  return {
    roundSeed: {
      drawPile: cloneCards(options.roundSeed.drawPile),
    },
  };
}

export type ReplaySessionRecord = {
  name: string;
  sessionId: string;
};

export type ReplayHarness = {
  createStartedMatch: (
    playerNames: string[],
    options: { deterministicStart?: DeterministicStartOptions },
  ) => Promise<{
    matchId: string;
    sessions: ReplaySessionRecord[];
    started: MatchSnapshot;
  }>;
  advanceUntilRoundBoundary: (
    matchId: string,
    sessions: ReplaySessionRecord[],
  ) => Promise<MatchSnapshot>;
  startDeterministicNextRound: (
    matchId: string,
    sessionId: string,
    deterministicStart?: DeterministicStartOptions,
  ) => Promise<MatchSnapshot>;
  takeTurn: (matchId: string, sessionId: string, action: "hit" | "stay") => Promise<MatchSnapshot>;
  resolveAction: (
    matchId: string,
    sessionId: string,
    targetPlayerId: string,
  ) => Promise<MatchSnapshot>;
};

function findSession(sessions: ReplaySessionRecord[], actor: string) {
  return sessions.find((session) => session.name === actor) ?? null;
}

function findPlayerId(snapshot: MatchSnapshot, playerName: string) {
  return snapshot.players.find((player) => player.displayName === playerName)?.playerId ?? null;
}

function invalidResult(
  scenario: DeterministicReplayScenario,
  stepsConsumed: number,
  validationError: string,
): ReplayResult {
  return {
    scenarioName: scenario.name,
    scope: scenario.scope,
    status: "invalid",
    stepsConsumed,
    validationError,
  };
}

function divergedResult(
  scenario: DeterministicReplayScenario,
  stepsConsumed: number,
  decision: ReplayDecisionStep,
  expectedState: ReturnType<typeof canonicalizeSnapshot>,
  actualState: ReturnType<typeof canonicalizeSnapshot>,
): ReplayResult {
  return {
    scenarioName: scenario.name,
    scope: scenario.scope,
    status: "diverged",
    stepsConsumed,
    divergence: {
      stepNumber: decision.stepNumber,
      decision,
      expectedState,
      actualState,
      message: `Replay diverged at step ${decision.stepNumber} for ${decision.actor}`,
    },
  };
}

export async function runDeterministicReplayScenario(
  scenario: DeterministicReplayScenario,
  harness: ReplayHarness,
): Promise<ReplayResult> {
  const started = await harness.createStartedMatch([...scenario.playerNames], {
    deterministicStart: cloneDeterministicStartOptions(scenario.setupMatch),
  });

  let snapshot = started.started;

  if (scenario.scope === "round") {
    if (!scenario.setupRound) {
      return invalidResult(scenario, 0, "Round-scope replay requires setupRound");
    }

    await harness.advanceUntilRoundBoundary(started.matchId, started.sessions);
    snapshot = await harness.startDeterministicNextRound(
      started.matchId,
      started.sessions[0]!.sessionId,
      cloneDeterministicStartOptions(scenario.setupRound),
    );
  }

  for (const [index, decision] of scenario.decisionScript.entries()) {
    if (snapshot.roundStatus === "completed" || snapshot.roundStatus === "scoring") {
      return invalidResult(
        scenario,
        index,
        `Replay received extra step ${decision.stepNumber} after gameplay already ended`,
      );
    }

    const actorSession = findSession(started.sessions, decision.actor);
    if (!actorSession) {
      return invalidResult(scenario, index, `No session found for actor ${decision.actor}`);
    }

    if (decision.decisionType === "turn_action") {
      snapshot = await harness.takeTurn(started.matchId, actorSession.sessionId, decision.choice);
    } else {
      if (!snapshot.pendingAction) {
        return invalidResult(
          scenario,
          index,
          `Expected pending action for step ${decision.stepNumber}`,
        );
      }
      if (snapshot.pendingAction.actionKind !== decision.promptKind) {
        return invalidResult(
          scenario,
          index,
          `Expected ${decision.promptKind} prompt for step ${decision.stepNumber}`,
        );
      }

      const targetPlayerId = findPlayerId(snapshot, decision.choice);
      if (!targetPlayerId) {
        return invalidResult(scenario, index, `No target found for player ${decision.choice}`);
      }

      snapshot = await harness.resolveAction(
        started.matchId,
        actorSession.sessionId,
        targetPlayerId,
      );
    }

    const actualState = canonicalizeSnapshot(snapshot);
    const expectedState = scenario.expectedStates[index];

    if (!expectedState) {
      return invalidResult(
        scenario,
        index + 1,
        `Missing expected state for step ${decision.stepNumber}`,
      );
    }

    if (JSON.stringify(actualState) !== JSON.stringify(expectedState)) {
      return divergedResult(scenario, index + 1, decision, expectedState, actualState);
    }
  }

  if (scenario.expectedStates.length !== scenario.decisionScript.length) {
    return invalidResult(
      scenario,
      scenario.decisionScript.length,
      "Expected states count must match decision script length",
    );
  }

  if (snapshot.roundStatus !== "completed" && snapshot.roundStatus !== "scoring") {
    return invalidResult(
      scenario,
      scenario.decisionScript.length,
      "Replay script ended before gameplay reached a round boundary",
    );
  }

  return {
    scenarioName: scenario.name,
    scope: scenario.scope,
    status: "matched",
    stepsConsumed: scenario.decisionScript.length,
    finalOutcome: canonicalizeSnapshot(snapshot),
  };
}
