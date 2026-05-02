import type { Card } from "@/game/logic/card-types";
import { canonicalizeSnapshot, projectExpectedReplayState } from "./replay-assertions";
import type { ConfectMatchSnapshot } from "./confect-match-snapshot";
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
    started: ConfectMatchSnapshot;
  }>;
  advanceUntilRoundBoundary: (
    matchId: string,
    sessions: ReplaySessionRecord[],
  ) => Promise<ConfectMatchSnapshot>;
  startDeterministicNextRound: (
    matchId: string,
    sessionId: string,
    expectedVersion: number,
    deterministicStart?: DeterministicStartOptions,
  ) => Promise<ConfectMatchSnapshot>;
  takeTurn: (
    matchId: string,
    sessionId: string,
    action: "hit" | "stay",
    expectedVersion: number,
  ) => Promise<ConfectMatchSnapshot>;
  resolveAction: (
    matchId: string,
    sessionId: string,
    targetPlayerId: string,
    expectedVersion: number,
  ) => Promise<ConfectMatchSnapshot>;
};

function findSession(sessions: ReplaySessionRecord[], actor: string) {
  return sessions.find((session) => session.name === actor) ?? null;
}

function findPlayerId(snapshot: ConfectMatchSnapshot, playerName: string) {
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
  expectedState: NonNullable<DeterministicReplayScenario["expectedStates"][number]>,
  actualState: NonNullable<DeterministicReplayScenario["expectedStates"][number]>,
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

type StartedMatch = Awaited<ReturnType<ReplayHarness["createStartedMatch"]>>;

function isReplayResult(value: ConfectMatchSnapshot | ReplayResult): value is ReplayResult {
  return value.status === "invalid" || value.status === "diverged" || value.status === "matched";
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value).toSorted(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableJson(entryValue)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

async function loadReplayInitialSnapshot(
  scenario: DeterministicReplayScenario,
  harness: ReplayHarness,
): Promise<{ started: StartedMatch; snapshot: ConfectMatchSnapshot } | ReplayResult> {
  const started = await harness.createStartedMatch([...scenario.playerNames], {
    deterministicStart: cloneDeterministicStartOptions(scenario.setupMatch),
  });

  let snapshot = started.started;

  if (scenario.scope === "round") {
    if (!scenario.setupRound) {
      return invalidResult(scenario, 0, "Round-scope replay requires setupRound");
    }

    snapshot = await harness.advanceUntilRoundBoundary(started.matchId, started.sessions);
    snapshot = await harness.startDeterministicNextRound(
      started.matchId,
      started.sessions[0]!.sessionId,
      snapshot.version,
      cloneDeterministicStartOptions(scenario.setupRound),
    );
  }

  return { started, snapshot };
}

function requireActorSessionForStep(
  snapshot: ConfectMatchSnapshot,
  started: StartedMatch,
  scenario: DeterministicReplayScenario,
  index: number,
  decision: ReplayDecisionStep,
): ReplaySessionRecord | ReplayResult {
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

  return actorSession;
}

async function advanceSnapshotForDecision(
  harness: ReplayHarness,
  started: StartedMatch,
  scenario: DeterministicReplayScenario,
  index: number,
  snapshot: ConfectMatchSnapshot,
  decision: ReplayDecisionStep,
  actorSession: ReplaySessionRecord,
): Promise<ConfectMatchSnapshot | ReplayResult> {
  if (decision.decisionType === "turn_action") {
    return harness.takeTurn(
      started.matchId,
      actorSession.sessionId,
      decision.choice,
      snapshot.version,
    );
  }

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

  return harness.resolveAction(
    started.matchId,
    actorSession.sessionId,
    targetPlayerId,
    snapshot.version,
  );
}

function checkStepMatchesExpectedCanonical(
  scenario: DeterministicReplayScenario,
  index: number,
  decision: ReplayDecisionStep,
  nextSnapshot: ConfectMatchSnapshot,
): { snapshot: ConfectMatchSnapshot } | ReplayResult {
  const actualState = canonicalizeSnapshot(nextSnapshot);
  const expectedState = scenario.expectedStates[index];

  if (!expectedState) {
    return invalidResult(
      scenario,
      index + 1,
      `Missing expected state for step ${decision.stepNumber}`,
    );
  }

  const actualFacts = projectExpectedReplayState(actualState, expectedState);
  if (stableJson(actualFacts) !== stableJson(expectedState)) {
    return divergedResult(scenario, index + 1, decision, expectedState, actualFacts);
  }

  return { snapshot: nextSnapshot };
}

function isReplaySessionRecord(
  value: ReplaySessionRecord | ReplayResult,
): value is ReplaySessionRecord {
  return !("scenarioName" in value);
}

async function applyReplayDecisionStep(
  harness: ReplayHarness,
  started: StartedMatch,
  scenario: DeterministicReplayScenario,
  index: number,
  decision: ReplayDecisionStep,
  snapshot: ConfectMatchSnapshot,
): Promise<{ snapshot: ConfectMatchSnapshot } | ReplayResult> {
  const sessionOrError = requireActorSessionForStep(snapshot, started, scenario, index, decision);
  if (!isReplaySessionRecord(sessionOrError)) {
    return sessionOrError;
  }

  const advanced = await advanceSnapshotForDecision(
    harness,
    started,
    scenario,
    index,
    snapshot,
    decision,
    sessionOrError,
  );
  if (isReplayResult(advanced)) {
    return advanced;
  }

  return checkStepMatchesExpectedCanonical(scenario, index, decision, advanced);
}

export async function runDeterministicReplayScenario(
  scenario: DeterministicReplayScenario,
  harness: ReplayHarness,
): Promise<ReplayResult> {
  const loaded = await loadReplayInitialSnapshot(scenario, harness);
  if ("status" in loaded) {
    return loaded;
  }

  let { started, snapshot } = loaded;

  for (const [index, decision] of scenario.decisionScript.entries()) {
    const step = await applyReplayDecisionStep(
      harness,
      started,
      scenario,
      index,
      decision,
      snapshot,
    );
    if ("status" in step) {
      return step;
    }
    snapshot = step.snapshot;
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
