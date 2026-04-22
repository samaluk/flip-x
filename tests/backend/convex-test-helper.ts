import { ConvexTestingHelper } from "convex-helpers/testing";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  describeReplayResult,
  type DeterministicStartOptions,
  type ReplayResult,
} from "@/tests/fixtures/deterministic";
import type { SessionId } from "convex-helpers/server/sessions";

const DELETE_ALL_APP_DATA_CONFIRMATION = "DELETE_ALL_APP_DATA";

export function asSessionId(value: string) {
  return value as SessionId;
}

export function createTestClient() {
  return new ConvexTestingHelper({
    backendUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
  });
}

export async function resetTestClient(client: ConvexTestingHelper) {
  await client.action(api.admin.clearAllAppDataViaCli, {
    confirm: DELETE_ALL_APP_DATA_CONFIRMATION,
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
  return await client.mutation(api.rounds.startNextRound, {
    matchId,
    sessionId,
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

export async function advanceUntilRoundBoundary(
  client: ConvexTestingHelper,
  matchId: Id<"matches">,
  sessions: Array<{ name: string; sessionId: SessionId }>,
) {
  for (let guard = 0; guard < 50; guard += 1) {
    const snapshot = await getSnapshotForAnySession(client, matchId, sessions);

    if (!snapshot) {
      throw new Error("Expected a match snapshot while resolving gameplay");
    }

    if (snapshot.roundStatus === "scoring" || snapshot.roundStatus === "completed") {
      return snapshot;
    }

    if (snapshot.pendingAction) {
      const sourceSession = sessions.find(
        (session) =>
          snapshot.pendingAction?.sourcePlayerId ===
          snapshot.players.find((player) => player.displayName === session.name)?.playerId,
      );

      if (!sourceSession) {
        throw new Error("Expected a source session for pending action");
      }

      await client.mutation(api.turns.resolveAction, {
        matchId,
        targetPlayerId: snapshot.pendingAction.eligibleTargetIds[0] as Id<"players">,
        sessionId: sourceSession.sessionId,
      });
      continue;
    }

    const activeSession = sessions.find(
      (session) =>
        snapshot.activePlayerId ===
        snapshot.players.find((player) => player.displayName === session.name)?.playerId,
    );

    if (!activeSession) {
      throw new Error("Expected an active session while round is in progress");
    }

    await client.mutation(api.turns.takeTurn, {
      matchId,
      action: "stay",
      sessionId: activeSession.sessionId,
    });
  }

  throw new Error("Timed out while advancing round state");
}

export function describeBackendReplayResult(result: ReplayResult) {
  return `[backend] ${describeReplayResult(result)}`;
}
