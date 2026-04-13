import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { asSessionId, createTestClient, resetTestClient } from "./convex-test-helper";

describe("Convex matches", () => {
  let client = createTestClient();

  beforeEach(() => {
    client = createTestClient();
  });

  afterEach(async () => {
    await resetTestClient(client);
  });

  it("createMatch creates the match, host player, and session mapping", async () => {
    const sessionId = asSessionId("session-host");

    const created = await client.mutation(api.matches.createMatch, {
      hostName: "Host",
      sessionId,
    });

    const matchId = created.matchId as Id<"matches">;
    const snapshot = await client.query(api.matches.getMatchSnapshot, {
      matchId,
      sessionId,
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot?.status).toBe("setup");
    expect(snapshot?.players).toHaveLength(1);
    expect(snapshot?.players[0]).toEqual(
      expect.objectContaining({
        displayName: "Host",
        seatIndex: 0,
      }),
    );
    expect(snapshot?.viewerPlayerId).toBe(snapshot?.players[0].playerId);
    expect(snapshot?.isHost).toBe(true);
  });

  it("joinMatch adds a new player to an existing match", async () => {
    const hostSession = asSessionId("session-host");
    const guestSession = asSessionId("session-guest");
    const created = await client.mutation(api.matches.createMatch, {
      hostName: "Host",
      sessionId: hostSession,
    });

    await client.mutation(api.matches.joinMatch, {
      matchId: created.matchId as Id<"matches">,
      playerName: "Guest",
      sessionId: guestSession,
    });

    const snapshot = await client.query(api.matches.getMatchSnapshot, {
      matchId: created.matchId as Id<"matches">,
      sessionId: guestSession,
    });

    expect(snapshot?.players.map((player) => player.displayName)).toEqual(["Host", "Guest"]);
    expect(snapshot?.viewerPlayerId).toBe(snapshot?.players[1].playerId);
  });

  it("joinMatch rejects duplicate names owned by another session", async () => {
    const created = await client.mutation(api.matches.createMatch, {
      hostName: "Host",
      sessionId: asSessionId("session-host"),
    });

    await client.mutation(api.matches.joinMatch, {
      matchId: created.matchId as Id<"matches">,
      playerName: "Guest",
      sessionId: asSessionId("session-guest-a"),
    });

    await expect(
      client.mutation(api.matches.joinMatch, {
        matchId: created.matchId as Id<"matches">,
        playerName: "guest",
        sessionId: asSessionId("session-guest-b"),
      }),
    ).rejects.toThrow("NAME_ALREADY_TAKEN");
  });

  it("joinMatch updates the existing player for the same session", async () => {
    const guestSession = asSessionId("session-guest");
    const created = await client.mutation(api.matches.createMatch, {
      hostName: "Host",
      sessionId: asSessionId("session-host"),
    });
    const matchId = created.matchId as Id<"matches">;

    await client.mutation(api.matches.joinMatch, {
      matchId,
      playerName: "Guest",
      sessionId: guestSession,
    });

    const renamed = await client.mutation(api.matches.joinMatch, {
      matchId,
      playerName: "Renamed Guest",
      sessionId: guestSession,
    });

    expect(renamed.players).toHaveLength(2);
    expect(renamed.players.map((player) => player.displayName)).toEqual(["Host", "Renamed Guest"]);
  });

  it("startMatch rejects non-host sessions", async () => {
    const created = await client.mutation(api.matches.createMatch, {
      hostName: "Host",
      sessionId: asSessionId("session-host"),
    });
    const matchId = created.matchId as Id<"matches">;

    await client.mutation(api.matches.joinMatch, {
      matchId,
      playerName: "Guest",
      sessionId: asSessionId("session-guest"),
    });

    await expect(
      client.mutation(api.matches.startMatch, {
        matchId,
        sessionId: asSessionId("session-guest"),
      }),
    ).rejects.toThrow("NOT_HOST");
  });

  it("startMatch rejects matches with fewer than two players", async () => {
    const created = await client.mutation(api.matches.createMatch, {
      hostName: "Host",
      sessionId: asSessionId("session-host"),
    });

    await expect(
      client.mutation(api.matches.startMatch, {
        matchId: created.matchId as Id<"matches">,
        sessionId: asSessionId("session-host"),
      }),
    ).rejects.toThrow("INSUFFICIENT_PLAYERS");
  });

  it("startMatch creates the first round snapshot", async () => {
    const hostSession = asSessionId("session-host");
    const created = await client.mutation(api.matches.createMatch, {
      hostName: "Host",
      sessionId: hostSession,
    });
    const matchId = created.matchId as Id<"matches">;

    await client.mutation(api.matches.joinMatch, {
      matchId,
      playerName: "Guest",
      sessionId: asSessionId("session-guest"),
    });

    const started = await client.mutation(api.matches.startMatch, {
      matchId,
      sessionId: hostSession,
    });

    expect(started.status).toBe("in_progress");
    expect(started.currentRoundNumber).toBe(1);
    expect(started.roundStatus).toBeDefined();
    expect(started.players).toHaveLength(2);
    expect(started.latestEvent).not.toBeNull();
  });
});
