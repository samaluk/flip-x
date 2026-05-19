import type { SessionId } from "convex-helpers/server/sessions";

import { ANALYTICS_EVENTS } from "../../shared/analytics/events";
import type { AnalyticsEvent, AnalyticsProperties } from "../../shared/analytics/types";
import { assertNever } from "../../shared/lib/utils";
import type { MatchAggregate } from "../infrastructure/load-match-aggregate";
import type { GameTransition } from "../infrastructure/save-command-result";
import type { MatchSnapshot } from "../logic/view-models";
import type { GameCommand } from "./game-command";

type BuildGameCommandAnalyticsEventsInput = {
  command: GameCommand;
  sessionId: SessionId;
  aggregate: Pick<MatchAggregate, "viewerPlayerId" | "players">;
  transition: GameTransition;
  snapshot: MatchSnapshot;
};

function withViewerProperties(
  properties: AnalyticsProperties,
  viewerPlayerId: MatchAggregate["viewerPlayerId"],
) {
  return {
    ...properties,
    ...(viewerPlayerId ? { playerId: String(viewerPlayerId) } : {}),
  } satisfies AnalyticsProperties;
}

function gameCommandEventName(command: GameCommand) {
  switch (command.type) {
    case "START_MATCH":
      return ANALYTICS_EVENTS.matchStarted;
    case "START_NEXT_ROUND":
      return ANALYTICS_EVENTS.roundStarted;
    case "TAKE_TURN":
      return ANALYTICS_EVENTS.turnTaken;
    case "RESOLVE_ACTION":
      return ANALYTICS_EVENTS.actionResolved;
    default:
      return assertNever(command);
  }
}

function commandSpecificProperties(command: GameCommand): AnalyticsProperties {
  switch (command.type) {
    case "TAKE_TURN":
      return { action: command.action };
    case "RESOLVE_ACTION":
      return { targetPlayerId: command.targetPlayerId };
    case "START_MATCH":
    case "START_NEXT_ROUND":
      return {};
    default:
      return assertNever(command);
  }
}

function baseGameCommandProperties(input: BuildGameCommandAnalyticsEventsInput) {
  const commandProperties: AnalyticsProperties = commandSpecificProperties(input.command);

  return withViewerProperties(
    {
      matchId: String(input.snapshot.matchId),
      command: input.command.type,
      matchStatus: input.snapshot.status,
      roundNumber: input.snapshot.currentRoundNumber,
      playerCount: input.snapshot.players.length,
      targetScore: input.snapshot.targetScore,
      maxNumberCardValue: input.snapshot.settings.maxNumberCardValue,
      ...commandProperties,
    },
    input.aggregate.viewerPlayerId,
  );
}

export function buildGameCommandAnalyticsEvents(
  input: BuildGameCommandAnalyticsEventsInput,
): AnalyticsEvent[] {
  const baseProperties = baseGameCommandProperties(input);
  const events: AnalyticsEvent[] = [
    {
      distinctId: String(input.sessionId),
      event: gameCommandEventName(input.command),
      properties: baseProperties,
    },
  ];

  if (input.transition.finalized) {
    events.push({
      distinctId: String(input.sessionId),
      event: ANALYTICS_EVENTS.roundCompleted,
      properties: {
        ...baseProperties,
        roundNumber: input.transition.roundWrite.round.roundNumber,
      },
    });
  }

  if (input.snapshot.status === "completed") {
    events.push({
      distinctId: String(input.sessionId),
      event: ANALYTICS_EVENTS.matchCompleted,
      properties: baseProperties,
    });
  }

  return events;
}
