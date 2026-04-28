import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import {
  asSessionId,
  commandMetadata,
  createTestClient,
  resetTestClient,
} from "./convex-test-helper";

describe("Convex preview smoke: matches", () => {
  let client = createTestClient();

  beforeEach(() => {
    client = createTestClient();
  });

  afterEach(async () => {
    await resetTestClient(client);
  });

  it("happy path: create, join, start, and get snapshot", async () => {
    const hostSession = asSessionId("session-host");
    const guestSession = asSessionId("session-guest");

    const created = await client.mutation(api.matches.createMatch, {
      hostName: "Host",
      sessionId: hostSession,
    });
    const matchId = created.matchId as Id<"matches">;

    await client.mutation(api.matches.joinMatch, {
      matchId,
      playerName: "Guest",
      sessionId: guestSession,
    });

    const started = await client.mutation(api.matches.startMatch, {
      matchId,
      sessionId: hostSession,
      ...commandMetadata(created.version),
    });

    expect(started.status).toBe("in_progress");
    expect(started.currentRoundNumber).toBe(1);
    expect(started.players).toHaveLength(2);
    expect(started.latestEvent).not.toBeNull();
  });

  it("rejects join with duplicate name from different session", async () => {
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
});
