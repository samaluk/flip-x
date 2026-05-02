import type { ActionCard, Card } from "./card-types";
import { resolveHeldTargetAction } from "./action-resolution";
import { discardCard } from "./draw";
import { addEvent, cardEventPayload, type RoundEvent } from "./events";
import type { OrderedPlayer, PendingAction, PlayerRoundState, RoundRuntime } from "./round-state";

export function isTargetActionCard(
  card: ActionCard,
): card is ActionCard & { actionKind: PendingAction["actionKind"] } {
  return card.actionKind === "flip_three" || card.actionKind === "freeze";
}

export function isFlip3ActiveForPlayer(round: RoundRuntime, playerId: string) {
  return round.pendingFlip3?.targetPlayerId === playerId && round.pendingFlip3.cardsRemaining > 0;
}

export function deferFlip3TargetAction(
  round: RoundRuntime,
  playerState: PlayerRoundState,
  card: ActionCard,
  events: RoundEvent[],
) {
  playerState.heldActionCards.push(card);
  round.pendingFlip3?.deferredActionCards.push(card);
  addEvent(events, {
    eventType: "deferred_action",
    actorPlayerId: playerState.playerId,
    targetPlayerId: playerState.playerId,
    payload: { actionKind: card.actionKind },
  });
}

function removeHeldActionCard(playerState: PlayerRoundState, cardId: string) {
  const cardIndex = playerState.heldActionCards.findIndex((card) => card.id === cardId);
  if (cardIndex === -1) {
    return null;
  }

  const [card] = playerState.heldActionCards.splice(cardIndex, 1);
  return card;
}

function discardDeferredFlip3Cards(
  round: RoundRuntime,
  playerState: PlayerRoundState,
  cards: ActionCard[],
) {
  for (const card of cards) {
    const heldCard = removeHeldActionCard(playerState, card.id);
    if (heldCard) {
      discardCard(round, heldCard);
    }
  }
}

function resolveDeferredFlip3Actions(
  round: RoundRuntime,
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
  playerId: string,
  events: RoundEvent[],
) {
  const flip3 = round.pendingFlip3;
  if (!flip3 || flip3.targetPlayerId !== playerId || flip3.deferredActionCards.length === 0) {
    return;
  }

  const deferredCards = flip3.deferredActionCards.filter(isTargetActionCard);
  flip3.deferredActionCards = [];

  for (const card of deferredCards) {
    if (round.phase !== "player_turns") {
      break;
    }

    if (playerStates[playerId]?.status !== "active") {
      break;
    }

    resolveHeldTargetAction(round, players, playerStates, playerId, card, "turns", events);

    if (round.pendingAction) {
      break;
    }
  }
}

type ApplyFlip3Card = (card: Card) => void;

function clearFlip3AndDiscardDeferredActions(
  round: RoundRuntime,
  playerState: PlayerRoundState,
  deferredCards: ActionCard[],
) {
  discardDeferredFlip3Cards(round, playerState, deferredCards);
  round.pendingFlip3 = null;
}

function completeFlip3Sequence(
  round: RoundRuntime,
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
  playerId: string,
  events: RoundEvent[],
) {
  const flip3 = round.pendingFlip3;
  if (!flip3) {
    return;
  }

  const deferredCards = [...flip3.deferredActionCards];
  round.pendingFlip3 = null;
  addEvent(events, {
    eventType: "flip3_completed",
    actorPlayerId: playerId,
    targetPlayerId: playerId,
    payload: {},
  });

  if (deferredCards.length === 0) {
    return;
  }

  round.pendingFlip3 = {
    ...flip3,
    cardsRemaining: 0,
    deferredActionCards: deferredCards,
  };
  resolveDeferredFlip3Actions(round, players, playerStates, playerId, events);
  if (round.pendingFlip3?.targetPlayerId === playerId && round.pendingFlip3.cardsRemaining === 0) {
    round.pendingFlip3 = null;
  }
}

export function advanceFlip3Hit(
  round: RoundRuntime,
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
  playerId: string,
  card: Card,
  applyCard: ApplyFlip3Card,
  events: RoundEvent[],
) {
  const playerState = playerStates[playerId];
  const flip3 = round.pendingFlip3;

  if (!playerState || !flip3 || flip3.targetPlayerId !== playerId || flip3.cardsRemaining <= 0) {
    return false;
  }

  addEvent(events, {
    eventType: "flip3_hit",
    actorPlayerId: playerId,
    targetPlayerId: playerId,
    payload: cardEventPayload(card),
  });

  applyCard(card);

  if (round.phase !== "player_turns" || playerState.status !== "active") {
    clearFlip3AndDiscardDeferredActions(round, playerState, flip3.deferredActionCards);
    return true;
  }

  flip3.cardsRemaining -= 1;
  if (flip3.cardsRemaining <= 0) {
    completeFlip3Sequence(round, players, playerStates, playerId, events);
  }

  return true;
}
