import type { SessionId } from "convex-helpers/server/sessions";

import type { Id } from "../../convex/_generated/dataModel";
import { ANALYTICS_EVENTS } from "../../shared/analytics/events";
import type { AnalyticsEvent } from "../../shared/analytics/types";

type BuildMatchCreatedAnalyticsEventInput = {
  sessionId: SessionId;
  matchId: Id<"matches">;
  hostPlayerId: Id<"players">;
  targetScore: number;
  maxNumberCardValue: number;
};

type BuildMatchJoinedAnalyticsEventInput = {
  sessionId: SessionId;
  matchId: Id<"matches">;
  playerId: Id<"players">;
  seatIndex: number;
  playerCount: number;
};

export function buildMatchCreatedAnalyticsEvent(
  input: BuildMatchCreatedAnalyticsEventInput,
): AnalyticsEvent {
  return {
    distinctId: String(input.sessionId),
    event: ANALYTICS_EVENTS.matchCreated,
    properties: {
      matchId: String(input.matchId),
      playerId: String(input.hostPlayerId),
      playerCount: 1,
      targetScore: input.targetScore,
      maxNumberCardValue: input.maxNumberCardValue,
    },
  };
}

export function buildMatchJoinedAnalyticsEvent(
  input: BuildMatchJoinedAnalyticsEventInput,
): AnalyticsEvent {
  return {
    distinctId: String(input.sessionId),
    event: ANALYTICS_EVENTS.matchJoined,
    properties: {
      matchId: String(input.matchId),
      playerId: String(input.playerId),
      seatIndex: input.seatIndex,
      playerCount: input.playerCount,
    },
  };
}
