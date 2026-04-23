import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { api } from "@/convex/_generated/api";

import {
  advanceOneGameplayStep,
  createStartedMatch,
  createTestClient,
  getSnapshotForAnySession,
  resetTestClient,
  waitForPendingAction,
} from "./convex-test-helper";

describe("Convex turns", () => {
  let client = createTestClient();

  beforeEach(() => {
    client = createTestClient();
  });

  afterEach(async () => {
    await resetTestClient(client);
  });

  it("takeTurn rejects a session that does not own the active player", async () => {
    const { matchId, sessions, started } = await createStartedMatch(client, ["Host", "Guest"]);
    const inactiveSession = sessions.find(
      (session) =>
        started.activePlayerId !==
        started.players.find((player) => player.displayName === session.name)?.playerId,
    );

    expect(inactiveSession).toBeDefined();

    await expect(
      client.mutation(api.turns.takeTurn, {
        matchId,
        action: "hit",
        sessionId: inactiveSession!.sessionId,
      }),
    ).rejects.toThrow("InvalidTurn");
  });

  it("takeTurn updates the round state and latest event for the active session", async () => {
    const { matchId, sessions } = await createStartedMatch(client, ["Host", "Guest"]);
    const snapshot = await client.query(api.matches.getMatchSnapshot, {
      matchId,
      sessionId: sessions[0].sessionId,
    });
    expect(snapshot).not.toBeNull();
    if (!snapshot) {
      throw new Error("expected snapshot");
    }

    const activeSession = sessions.find(
      (session) =>
        snapshot.activePlayerId ===
        snapshot.players.find((player) => player.displayName === session.name)?.playerId,
    );

    expect(activeSession).toBeDefined();

    const updated = await client.mutation(api.turns.takeTurn, {
      matchId,
      action: "hit",
      sessionId: activeSession!.sessionId,
    });

    expect(updated.currentRoundNumber).toBe(1);
    expect(updated.latestEvent).not.toBeNull();
    expect(updated.players).toHaveLength(2);
  });

  it("resolveAction rejects sessions when no matching pending action is available", async () => {
    const { matchId, sessions, started } = await createStartedMatch(client, [
      "Host",
      "Guest",
      "Third",
    ]);
    const targetPlayerId = started.players[0].playerId as never;
    const invalidSession = started.pendingAction
      ? sessions.find(
          (session) =>
            started.pendingAction?.sourcePlayerId !==
            started.players.find((player) => player.displayName === session.name)?.playerId,
        )
      : sessions[0];

    expect(invalidSession).toBeDefined();

    await expect(
      client.mutation(api.turns.resolveAction, {
        matchId,
        targetPlayerId,
        sessionId: invalidSession!.sessionId,
      }),
    ).rejects.toThrow("InvalidAction");
  });

  it("resolveAction updates the round state for the source session", async () => {
    const { matchId, sessions } = await createStartedMatch(client, ["Host", "Guest", "Third"]);

    const snapshot = await waitForPendingAction(client, matchId, sessions);

    expect(snapshot.pendingAction).toBeTruthy();

    const sourceSession = sessions.find(
      (session) =>
        snapshot.pendingAction?.sourcePlayerId ===
        snapshot.players.find((player) => player.displayName === session.name)?.playerId,
    );
    const targetPlayerId = snapshot.pendingAction!.eligibleTargetIds[0];

    const updated = await client.mutation(api.turns.resolveAction, {
      matchId,
      targetPlayerId: targetPlayerId as never,
      sessionId: sourceSession!.sessionId,
    });

    expect(updated.latestEvent).not.toBeNull();
    expect(updated.pendingAction).not.toEqual(snapshot.pendingAction);
  });

  it("completes a two-player round and keeps scores consistent", async () => {
    const { matchId, sessions } = await createStartedMatch(client, ["Host", "Guest"]);

    const initialSnapshot = await getSnapshotForAnySession(client, matchId, sessions);
    expect(initialSnapshot).not.toBeNull();
    if (!initialSnapshot) {
      throw new Error("Expected a match snapshot while resolving turns");
    }

    let snapshot = initialSnapshot;

    for (let guard = 0; guard < 50; guard += 1) {
      if (snapshot.roundStatus === "scoring" || snapshot.roundStatus === "completed") {
        break;
      }

      snapshot = await advanceOneGameplayStep(client, matchId, sessions, snapshot);
    }

    const finalSnapshot = await client.query(api.matches.getMatchSnapshot, {
      matchId,
      sessionId: sessions[0].sessionId,
    });

    expect(finalSnapshot).not.toBeNull();
    expect(["in_progress", "completed"]).toContain(finalSnapshot!.status);
    expect(finalSnapshot!.players.some((player) => player.totalScore > 0)).toBe(true);
  });

  it("resolves a live pending action without invalid turn drift", async () => {
    const { matchId, sessions } = await createStartedMatch(client, ["Host", "Guest", "Third"]);

    const pendingSnapshot = await waitForPendingAction(client, matchId, sessions);
    if (!pendingSnapshot.pendingAction) {
      throw new Error("Expected a pending action snapshot");
    }
    const pendingAction = pendingSnapshot.pendingAction;

    const sourceSession = sessions.find(
      (session) =>
        pendingAction.sourcePlayerId ===
        pendingSnapshot.players.find((player) => player.displayName === session.name)?.playerId,
    );

    expect(sourceSession).toBeDefined();

    const resolved = await client.mutation(api.turns.resolveAction, {
      matchId,
      targetPlayerId: pendingAction.eligibleTargetIds[0] as never,
      sessionId: sourceSession!.sessionId,
    });

    expect(resolved.latestEvent).not.toBeNull();
    expect(resolved.pendingAction).not.toEqual(pendingAction);

    const continued =
      resolved.roundStatus === "player_turns" || resolved.pendingAction
        ? await advanceOneGameplayStep(
            client,
            matchId,
            sessions,
            resolved as Parameters<typeof advanceOneGameplayStep>[3],
          )
        : resolved;

    expect(continued.latestEvent).not.toBeNull();
  });
});
