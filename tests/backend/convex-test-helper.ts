import { execFileSync } from "node:child_process";
import path from "node:path";

import { ConvexTestingHelper } from "convex-helpers/testing";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  describeReplayResult,
  type DeterministicStartOptions,
  type ReplayResult,
} from "@/tests/fixtures/deterministic";
import type { SessionId } from "convex-helpers/server/sessions";

const DEFAULT_GAMEPLAY_GUARD_LIMIT = 150;
let idempotencySequence = 0;

export function commandMetadata(expectedVersion: number) {
  idempotencySequence += 1;
  return {
    expectedVersion,
    idempotencyKey: `backend-test-${idempotencySequence}`,
  };
}

type TestSession = { name: string; sessionId: SessionId };

export function asSessionId(value: string) {
  return value as SessionId;
}

export function createTestClient() {
  return new ConvexTestingHelper({
    backendUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
  });
}

export async function resetTestClient(client: ConvexTestingHelper) {
  execFileSync("node", [path.resolve(process.cwd(), "scripts/clear-convex-app-data.mjs")], {
    stdio: "inherit",
    env: process.env,
  });
  await client.close();
}

export async function createStartedMatch(
  client: ConvexTestingHelper,
  names: readonly [string, string, ...string[]] = ["Host", "Guest"],
  options: { deterministicStart?: DeterministicStartOptions } = {},
) {
  const sessions = names.map((name, index) => ({
    name,
    sessionId: asSessionId(`session-${index}-${name.toLowerCase()}`),
  }));

  const host = sessions[0];
  const created = await client.mutation(api.matches.createMatch, {
    hostName: host.name,
    sessionId: host.sessionId,
  });
  const matchId = created.matchId as Id<"matches">;

  for (const player of sessions.slice(1)) {
    await client.mutation(api.matches.joinMatch, {
      matchId,
      playerName: player.name,
      sessionId: player.sessionId,
    });
  }

  const started = await client.mutation(api.matches.startMatch, {
    matchId,
    sessionId: host.sessionId,
    ...commandMetadata(created.version),
    deterministicStart: options.deterministicStart,
  });

  return {
    matchId,
    sessions,
    started,
  };
}

export async function startDeterministicNextRound(
  client: ConvexTestingHelper,
  matchId: Id<"matches">,
  sessionId: SessionId,
  deterministicStart?: DeterministicStartOptions,
) {
  const snapshot = await client.query(api.matches.getMatchSnapshot, { matchId, sessionId });
  return await client.mutation(api.rounds.startNextRound, {
    matchId,
    sessionId,
    ...commandMetadata(snapshot?.version ?? 0),
    deterministicStart,
  });
}

export async function getSnapshotForAnySession(
  client: ConvexTestingHelper,
  matchId: Id<"matches">,
  sessions: Array<{ sessionId: SessionId }>,
) {
  for (const session of sessions) {
    const snapshot = await client.query(api.matches.getMatchSnapshot, {
      matchId,
      sessionId: session.sessionId,
    });

    if (snapshot) {
      return snapshot;
    }
  }

  return null;
}

type BackendSnapshot = NonNullable<Awaited<ReturnType<typeof getSnapshotForAnySession>>>;

function asBackendSnapshot(snapshot: unknown) {
  return snapshot as BackendSnapshot;
}

function getSessionForPlayerId(
  snapshot: BackendSnapshot,
  sessions: TestSession[],
  playerId: string,
) {
  const player = snapshot.players.find((candidate) => candidate.playerId === playerId);
  if (!player) {
    return null;
  }

  return sessions.find((session) => session.name === player.displayName) ?? null;
}

export async function advanceOneGameplayStep(
  client: ConvexTestingHelper,
  matchId: Id<"matches">,
  sessions: TestSession[],
  snapshot: BackendSnapshot,
  options: { turnAction?: "hit" | "stay" } = {},
) {
  const turnAction = options.turnAction ?? "stay";

  if (snapshot.pendingAction) {
    const sourceSession = getSessionForPlayerId(
      snapshot,
      sessions,
      snapshot.pendingAction.sourcePlayerId,
    );

    if (!sourceSession) {
      throw new Error(
        `Expected a source session for pending action owned by ${snapshot.pendingAction.sourcePlayerId}`,
      );
    }

    return asBackendSnapshot(
      await client.mutation(api.turns.resolveAction, {
        matchId,
        targetPlayerId: snapshot.pendingAction.eligibleTargetIds[0] as Id<"players">,
        sessionId: sourceSession.sessionId,
        ...commandMetadata(snapshot.version),
      }),
    );
  }

  if (snapshot.roundStatus !== "player_turns" || !snapshot.activePlayerId) {
    return snapshot;
  }

  const activeSession = getSessionForPlayerId(snapshot, sessions, snapshot.activePlayerId);

  if (!activeSession) {
    throw new Error(`Expected an active session for player ${snapshot.activePlayerId}`);
  }

  return asBackendSnapshot(
    await client.mutation(api.turns.takeTurn, {
      matchId,
      action: turnAction,
      sessionId: activeSession.sessionId,
      ...commandMetadata(snapshot.version),
    }),
  );
}

export async function waitForPendingAction(
  client: ConvexTestingHelper,
  matchId: Id<"matches">,
  sessions: TestSession[],
  options: { guardLimit?: number } = {},
) {
  const guardLimit = options.guardLimit ?? DEFAULT_GAMEPLAY_GUARD_LIMIT;
  const initialSnapshot = await getSnapshotForAnySession(client, matchId, sessions);

  if (!initialSnapshot) {
    throw new Error("Expected a match snapshot while waiting for a pending action");
  }

  let snapshot: BackendSnapshot = initialSnapshot;

  for (let guard = 0; guard < guardLimit; guard += 1) {
    if (snapshot.pendingAction) {
      return snapshot;
    }

    if (snapshot.roundStatus === "scoring" || snapshot.roundStatus === "completed") {
      snapshot = asBackendSnapshot(
        await client.mutation(api.rounds.startNextRound, {
          matchId,
          sessionId: sessions[0]!.sessionId,
          ...commandMetadata(snapshot.version),
        }),
      );
      continue;
    }

    snapshot = await advanceOneGameplayStep(client, matchId, sessions, snapshot, {
      turnAction: "hit",
    });
  }

  throw new Error(`Timed out while waiting for a pending action after ${guardLimit} steps`);
}

export async function advanceUntilRoundBoundary(
  client: ConvexTestingHelper,
  matchId: Id<"matches">,
  sessions: TestSession[],
) {
  const initialSnapshot = await getSnapshotForAnySession(client, matchId, sessions);

  if (!initialSnapshot) {
    throw new Error("Expected a match snapshot while resolving gameplay");
  }

  let snapshot: BackendSnapshot = initialSnapshot;

  for (let guard = 0; guard < 50; guard += 1) {
    if (snapshot.roundStatus === "scoring" || snapshot.roundStatus === "completed") {
      return snapshot;
    }

    snapshot = await advanceOneGameplayStep(client, matchId, sessions, snapshot, {
      turnAction: "stay",
    });
  }

  throw new Error("Timed out while advancing round state");
}

export function describeBackendReplayResult(result: ReplayResult) {
  return `[backend] ${describeReplayResult(result)}`;
}
