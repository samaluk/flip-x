import type { ActionCard, Card } from "./card-types";
import { invalidAction } from "../../shared/lib/errors/domain";
import { resolveHeldTargetAction, resolvePendingTargetAction } from "./action-resolution";
import { addEvent, cardEventPayload, type RoundEvent } from "./events";
import { advanceFlip3Hit, isFlip3ActiveForPlayer } from "./flip-three";
import { maybeFinishRound } from "./round-finalization";
import type { OrderedPlayer, PendingAction, PlayerRoundState, RoundRuntime } from "./round-state";
import { advanceToNextActiveSeat } from "./turn-order";

export type PendingOperation =
  | { kind: "hit"; playerId: string; card: Card; applyCard: (card: Card) => void }
  | { kind: "target"; targetPlayerId: string }
  | {
      kind: "offer";
      playerId: string;
      card: ActionCard & { actionKind: PendingAction["actionKind"] };
      resume: PendingAction["resume"];
    };

export function advancePendingOperation(
  round: RoundRuntime,
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
  operation: PendingOperation,
  events: RoundEvent[],
): "continue_dealing" | "wait_for_input" {
  if (operation.kind === "target") {
    const pendingAction = round.pendingAction;
    if (!pendingAction) {
      throw invalidAction();
    }
    const resolution = resolvePendingTargetAction(
      round,
      players,
      playerStates,
      pendingAction,
      operation.targetPlayerId,
      events,
    );
    if (resolution === "continue_dealing") {
      return "continue_dealing";
    }
    if (resolution === "continue_turns") {
      advanceTurnWhenQueueClear(round, players, playerStates);
    }
  } else if (operation.kind === "offer") {
    resolveHeldTargetAction(
      round,
      players,
      playerStates,
      operation.playerId,
      operation.card,
      operation.resume,
      events,
    );
    return "wait_for_input";
  } else if (isFlip3ActiveForPlayer(round, operation.playerId)) {
    advanceFlip3Hit(
      round,
      players,
      playerStates,
      operation.playerId,
      operation.card,
      operation.applyCard,
      events,
    );
  } else {
    addEvent(events, {
      eventType: "hit",
      actorPlayerId: operation.playerId,
      targetPlayerId: operation.playerId,
      payload: cardEventPayload(operation.card),
    });
    operation.applyCard(operation.card);
  }

  maybeFinishRound(round, players, playerStates);
  if (operation.kind === "hit") {
    advanceTurnWhenQueueClear(round, players, playerStates);
  }
  return "wait_for_input";
}

export function advanceTurnWhenQueueClear(
  round: RoundRuntime,
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
) {
  if (round.phase === "player_turns" && !round.pendingAction && !round.pendingFlip3) {
    advanceToNextActiveSeat(round, players, playerStates);
    maybeFinishRound(round, players, playerStates);
  }
}
