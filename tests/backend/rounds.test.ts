import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { api } from "@/convex/_generated/api";

import { createStartedMatch, createTestClient, resetTestClient } from "./convex-test-helper";

describe("Convex rounds", () => {
  let client = createTestClient();

  beforeEach(() => {
    client = createTestClient();
  });

  afterEach(async () => {
    await resetTestClient(client);
  });

  it("startNextRound advances to the next round after round completion", async () => {
    const { matchId, sessions } = await createStartedMatch(client, ["Host", "Guest"]);

    let completedSnapshot = null;
    let guard = 0;
    while (guard < 50) {
      guard += 1;
      const snapshots = await Promise.all(
        sessions.map((session) =>
          client.query(api.matches.getMatchSnapshot, {
            matchId,
            sessionId: session.sessionId,
          }),
        ),
      );
      const snapshot = snapshots.find((value) => value !== null);

      if (!snapshot) {
        throw new Error("Expected a match snapshot while resolving turns");
      }

      if (snapshot.roundStatus === "scoring" || snapshot.roundStatus === "completed") {
        completedSnapshot = snapshot;
        break;
      }

      if (snapshot.pendingAction) {
        const sourceSession = sessions.find(
          (session) =>
            snapshot.pendingAction?.sourcePlayerId ===
            snapshot.players.find((player) => player.displayName === session.name)?.playerId,
        );

        await client.mutation(api.turns.resolveAction, {
          matchId,
          targetPlayerId: snapshot.pendingAction.eligibleTargetIds[0] as never,
          sessionId: sourceSession!.sessionId,
        });
        continue;
      }

      const activeSession = sessions.find(
        (session) => snapshot.activePlayerId === snapshot.players.find((player) => player.displayName === session.name)?.playerId,
      );

      if (!activeSession) {
        break;
      }

      await client.mutation(api.turns.takeTurn, {
        matchId,
        action: "stay",
        sessionId: activeSession.sessionId,
      });
    }

    expect(completedSnapshot).not.toBeNull();

    const nextRound = await client.mutation(api.rounds.startNextRound, {
      matchId,
      sessionId: sessions[0].sessionId,
    });

    expect(nextRound.currentRoundNumber).toBe(2);
    expect(nextRound.status).toBe("in_progress");
    expect(nextRound.players).toHaveLength(2);
  });
});
