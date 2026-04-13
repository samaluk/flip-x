import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { asSessionId, createTestClient, resetTestClient } from "./convex-test-helper";

describe("Convex presence", () => {
  let client = createTestClient();

  beforeEach(() => {
    client = createTestClient();
  });

  afterEach(async () => {
    await resetTestClient(client);
  });

  it("update inserts and then patches a single presence record per session and room", async () => {
    const sessionId = asSessionId("session-host");
    const created = await client.mutation(api.matches.createMatch, {
      hostName: "Host",
      sessionId,
    });
    const matchId = created.matchId as Id<"matches">;

    await client.mutation(api.presence.update, {
      matchId,
      playerId: created.viewerPlayerId as Id<"players">,
      sessionId,
    });
    await client.mutation(api.presence.update, {
      matchId,
      playerId: created.viewerPlayerId as Id<"players">,
      sessionId,
    });

    const listed = await client.query(api.presence.list, {
      matchId,
      sessionId,
    });

    expect(listed).toHaveLength(1);
    expect(listed[0].playerId).toBe(created.viewerPlayerId);
  });

  it("heartbeat leaves presence unchanged when no row exists", async () => {
    const sessionId = asSessionId("session-host");
    const created = await client.mutation(api.matches.createMatch, {
      hostName: "Host",
      sessionId,
    });

    await client.mutation(api.presence.heartbeat, {
      matchId: created.matchId as Id<"matches">,
      sessionId,
    });

    const listed = await client.query(api.presence.list, {
      matchId: created.matchId as Id<"matches">,
      sessionId,
    });

    expect(listed).toEqual([]);
  });

  it("list deduplicates multiple presence updates for the same player", async () => {
    const hostSession = asSessionId("session-host");
    const created = await client.mutation(api.matches.createMatch, {
      hostName: "Host",
      sessionId: hostSession,
    });
    const matchId = created.matchId as Id<"matches">;

    await client.mutation(api.presence.update, {
      matchId,
      playerId: created.viewerPlayerId as Id<"players">,
      sessionId: hostSession,
    });
    await client.mutation(api.presence.heartbeat, {
      matchId,
      sessionId: hostSession,
    });

    await client.mutation(api.matches.joinMatch, {
      matchId,
      playerName: "Guest",
      sessionId: asSessionId("session-guest"),
    });

    const guestSnapshot = await client.query(api.matches.getMatchSnapshot, {
      matchId,
      sessionId: asSessionId("session-guest"),
    });

    await client.mutation(api.presence.update, {
      matchId,
      playerId: guestSnapshot?.viewerPlayerId as Id<"players">,
      sessionId: asSessionId("session-guest"),
    });

    const listed = await client.query(api.presence.list, {
      matchId,
      sessionId: hostSession,
    });

    expect(listed).toHaveLength(2);
    expect(new Set(listed.map((entry) => entry.playerId)).size).toBe(2);
  });
});
