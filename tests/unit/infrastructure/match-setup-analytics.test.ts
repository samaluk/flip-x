import { describe, expect, it } from "vitest";

import {
  buildMatchCreatedAnalyticsEvent,
  buildMatchJoinedAnalyticsEvent,
} from "@/game/application/match-setup-analytics";
import type { Id } from "@/convex/_generated/dataModel";

describe("match setup analytics", () => {
  it("builds a privacy-safe match_created event", () => {
    const event = buildMatchCreatedAnalyticsEvent({
      sessionId: "session-1",
      matchId: "match-1" as Id<"matches">,
      hostPlayerId: "player-1" as Id<"players">,
      targetScore: 200,
      maxNumberCardValue: 12,
    });

    expect(event).toEqual({
      distinctId: "session-1",
      event: "match_created",
      properties: {
        matchId: "match-1",
        playerId: "player-1",
        playerCount: 1,
        targetScore: 200,
        maxNumberCardValue: 12,
      },
    });
    expect(event.properties).not.toHaveProperty("playerName");
    expect(event.properties).not.toHaveProperty("displayName");
  });

  it("builds a privacy-safe match_joined event", () => {
    const event = buildMatchJoinedAnalyticsEvent({
      sessionId: "session-2",
      matchId: "match-1" as Id<"matches">,
      playerId: "player-2" as Id<"players">,
      seatIndex: 1,
      playerCount: 2,
    });

    expect(event).toEqual({
      distinctId: "session-2",
      event: "match_joined",
      properties: {
        matchId: "match-1",
        playerId: "player-2",
        seatIndex: 1,
        playerCount: 2,
      },
    });
    expect(event.properties).not.toHaveProperty("playerName");
    expect(event.properties).not.toHaveProperty("displayName");
  });
});
