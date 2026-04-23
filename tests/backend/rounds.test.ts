import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { api } from "@/convex/_generated/api";

import {
  advanceOneGameplayStep,
  createStartedMatch,
  createTestClient,
  getSnapshotForAnySession,
  resetTestClient,
} from "./convex-test-helper";

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

    const initialSnapshot = await getSnapshotForAnySession(client, matchId, sessions);
    expect(initialSnapshot).not.toBeNull();
    if (!initialSnapshot) {
      throw new Error("Expected a match snapshot while resolving turns");
    }

    let completedSnapshot = initialSnapshot;

    for (let guard = 0; guard < 50; guard += 1) {
      if (
        completedSnapshot.roundStatus === "scoring" ||
        completedSnapshot.roundStatus === "completed"
      ) {
        break;
      }

      completedSnapshot = await advanceOneGameplayStep(client, matchId, sessions, completedSnapshot);
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
