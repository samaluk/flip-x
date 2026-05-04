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

  it("heartbeat creates a room token and syncPlayer attaches the player id", async () => {
    const sessionId = asSessionId("session-host");
    const created = await client.mutation(api.matches.createMatch, {
      hostName: "Host",
      sessionId,
    });
    const matchId = created.matchId as Id<"matches">;

    const heartbeat = await client.mutation(api.presence.heartbeat, {
      roomId: matchId,
      userId: String(sessionId),
      sessionId: "tab-host",
      interval: 5_000,
    });

    await client.mutation(api.presence.syncPlayer, {
      matchId,
      playerId: created.viewerPlayerId as Id<"players">,
      sessionId,
    });

    const listed = await client.query(api.presence.list, {
      roomToken: heartbeat.roomToken,
    });

    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({
      userId: sessionId,
      online: true,
      data: created.viewerPlayerId,
    });
  });

  it("disconnect marks a user offline", async () => {
    const sessionId = asSessionId("session-host");
    const created = await client.mutation(api.matches.createMatch, {
      hostName: "Host",
      sessionId,
    });

    const heartbeat = await client.mutation(api.presence.heartbeat, {
      roomId: created.matchId,
      userId: String(sessionId),
      sessionId: "tab-host",
      interval: 5_000,
    });

    await client.mutation(api.presence.disconnect, {
      sessionToken: heartbeat.sessionToken,
    });

    const listed = await client.query(api.presence.list, {
      roomToken: heartbeat.roomToken,
    });

    expect(listed).toHaveLength(1);
    expect(listed[0]?.online).toBe(false);
  });

  it("multiple browser sessions for one anonymous session collapse into one user", async () => {
    const sessionId = asSessionId("session-host");
    const created = await client.mutation(api.matches.createMatch, {
      hostName: "Host",
      sessionId,
    });
    const matchId = created.matchId as Id<"matches">;

    const firstHeartbeat = await client.mutation(api.presence.heartbeat, {
      roomId: matchId,
      userId: String(sessionId),
      sessionId: "tab-host-a",
      interval: 5_000,
    });
    await client.mutation(api.presence.heartbeat, {
      roomId: matchId,
      userId: String(sessionId),
      sessionId: "tab-host-b",
      interval: 5_000,
    });

    await client.mutation(api.presence.syncPlayer, {
      matchId,
      playerId: created.viewerPlayerId as Id<"players">,
      sessionId,
    });

    const listed = await client.query(api.presence.list, {
      roomToken: firstHeartbeat.roomToken,
    });

    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({
      userId: sessionId,
      online: true,
      data: created.viewerPlayerId,
    });
  });
});
