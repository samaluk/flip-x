import type { ActionCard } from "./card-types";
import { addEvent, type RoundEvent } from "./events";
import { updatePointsAtRisk } from "./scoring";
import type { OrderedPlayer, PendingAction, PlayerRoundState, RoundRuntime } from "./round-state";
import { activePlayerIds, orderedPlayerIds } from "./turn-order";

export function createPendingTargetAction(
  round: RoundRuntime,
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
  sourcePlayerId: string,
  actionKind: PendingAction["actionKind"],
  resume: PendingAction["resume"],
  events: RoundEvent[],
) {
  const eligibleTargetIds =
    resume === "dealing"
      ? orderedPlayerIds(players)
          .filter(
            (player) =>
              playerStates[player.playerId]?.status === "active" ||
              playerStates[player.playerId]?.status === "waiting",
          )
          .map((player) => player.playerId)
      : activePlayerIds(players, playerStates);

  if (eligibleTargetIds.length === 0) {
    return null;
  }

  if (eligibleTargetIds.length === 1) {
    return eligibleTargetIds[0];
  }

  round.phase = "resolving_action";
  round.pendingAction = {
    sourcePlayerId,
    actionKind,
    eligibleTargetIds,
    resume,
  };

  addEvent(events, {
    eventType: "pending_action",
    actorPlayerId: sourcePlayerId,
    targetPlayerId: null,
    payload: { actionKind },
  });

  return null;
}

export function applyResolvedTargetAction(
  round: RoundRuntime,
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
  sourcePlayerId: string,
  actionKind: PendingAction["actionKind"],
  targetPlayerId: string,
  events: RoundEvent[],
) {
  const sourceState = playerStates[sourcePlayerId];
  const targetState = playerStates[targetPlayerId];

  if (!targetState) {
    return;
  }

  const cardIndex = sourceState.heldActionCards.findIndex((c) => c.actionKind === actionKind);
  if (cardIndex !== -1) {
    const [card] = sourceState.heldActionCards.splice(cardIndex, 1);
    targetState.receivedActionCards.push(card);
  }

  if (actionKind === "freeze") {
    targetState.status = "frozen";
    updatePointsAtRisk(targetState);
    addEvent(events, {
      eventType: "freeze_applied",
      actorPlayerId: sourcePlayerId,
      targetPlayerId,
      payload: {},
    });
    return;
  }

  addEvent(events, {
    eventType: "flip_three_targeted",
    actorPlayerId: sourcePlayerId,
    targetPlayerId,
    payload: { cardsRemaining: 3 },
  });

  round.pendingFlip3 = {
    sourcePlayerId,
    targetPlayerId,
    cardsRemaining: 3,
    deferredActionCards: [],
  };
}

export function resolveHeldTargetAction(
  round: RoundRuntime,
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
  playerId: string,
  card: ActionCard & { actionKind: PendingAction["actionKind"] },
  resume: PendingAction["resume"],
  events: RoundEvent[],
) {
  const targetOrPending = createPendingTargetAction(
    round,
    players,
    playerStates,
    playerId,
    card.actionKind,
    resume,
    events,
  );

  if (typeof targetOrPending === "string") {
    applyResolvedTargetAction(
      round,
      players,
      playerStates,
      playerId,
      card.actionKind,
      targetOrPending,
      events,
    );
  }
}
