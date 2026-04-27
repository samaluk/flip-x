import type { ActionCard } from "./card-types";
import { resolveHeldTargetAction } from "./action-resolution";
import { discardCard } from "./draw";
import type { RoundEvent } from "./events";
import type { OrderedPlayer, PendingAction, PlayerRoundState, RoundRuntime } from "./round-state";

function isTargetActionCard(
  card: ActionCard,
): card is ActionCard & { actionKind: PendingAction["actionKind"] } {
  return card.actionKind === "flip_three" || card.actionKind === "freeze";
}

export function isFlip3ActiveForPlayer(round: RoundRuntime, playerId: string) {
  return round.pendingFlip3?.targetPlayerId === playerId && round.pendingFlip3.cardsRemaining > 0;
}

function removeHeldActionCard(playerState: PlayerRoundState, cardId: string) {
  const cardIndex = playerState.heldActionCards.findIndex((card) => card.id === cardId);
  if (cardIndex === -1) {
    return null;
  }

  const [card] = playerState.heldActionCards.splice(cardIndex, 1);
  return card;
}

export function discardDeferredFlip3Cards(
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

export function resolveDeferredFlip3Actions(
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
