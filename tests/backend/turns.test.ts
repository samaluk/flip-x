import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { api } from "@/convex/_generated/api";

import {
  commandMetadata,
  createStartedMatch,
  createTestClient,
  resetTestClient,
} from "./convex-test-helper";

describe("Convex preview smoke: turns", () => {
  let client = createTestClient();

  beforeEach(() => {
    client = createTestClient();
  });

  afterEach(async () => {
    await resetTestClient(client);
  });

  it("happy path: active player takes turn", async () => {
    const { matchId, sessions } = await createStartedMatch(client, ["Host", "Guest"], {
      deterministicStart: {
        roundSeed: {
          drawPile: [
            { id: "preview-open-host", type: "number", label: "1", numberValue: 1 },
            { id: "preview-open-guest", type: "number", label: "7", numberValue: 7 },
            { id: "preview-hit", type: "number", label: "4", numberValue: 4 },
          ],
        },
      },
    });
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
      ...commandMetadata(snapshot.version),
    });

    expect(updated.currentRoundNumber).toBe(1);
    expect(updated.latestEvent).not.toBeNull();
  });

  it("rejects non-active player taking turn", async () => {
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
        ...commandMetadata(started.version),
      }),
    ).rejects.toThrow("INVALID_TURN");
  });
});
