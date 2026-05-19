export const ANALYTICS_EVENTS = {
  matchCreated: "match_created",
  matchJoined: "match_joined",
  matchStarted: "match_started",
  roundStarted: "round_started",
  turnTaken: "turn_taken",
  actionResolved: "action_resolved",
  roundCompleted: "round_completed",
  matchCompleted: "match_completed",
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
