import {
  type ActionCard,
  type Card,
  isModifierCard,
  isNumberCard,
  type NumberCard,
} from "./card-types";
import { resolveHeldTargetAction } from "./action-resolution";
import { discardCard } from "./draw";
import { addEvent, type RoundEvent } from "./events";
import { isFlip3ActiveForPlayer } from "./flip-three";
import { updatePointsAtRisk } from "./scoring";
import type { OrderedPlayer, PendingAction, PlayerRoundState, RoundRuntime } from "./round-state";
import { activePlayerIds } from "./turn-order";

function isTargetActionCard(
  card: ActionCard,
): card is ActionCard & { actionKind: PendingAction["actionKind"] } {
  return card.actionKind === "flip_three" || card.actionKind === "freeze";
}

function applyHeldSecondChance(
  round: RoundRuntime,
  playerState: PlayerRoundState,
  duplicateCard: NumberCard,
  events: RoundEvent[],
) {
  const secondChanceIndex = playerState.heldActionCards.findIndex(
    (card) => card.actionKind === "second_chance",
  );

  if (secondChanceIndex === -1) {
    return false;
  }

  const [secondChance] = playerState.heldActionCards.splice(secondChanceIndex, 1);

  discardCard(round, secondChance);
  discardCard(round, duplicateCard);

  addEvent(events, {
    eventType: "second_chance_used",
    actorPlayerId: playerState.playerId,
    targetPlayerId: playerState.playerId,
    payload: { duplicate: duplicateCard.numberValue },
  });

  updatePointsAtRisk(playerState);
  return true;
}

export function applyCardToPlayer(
  round: RoundRuntime,
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
  playerId: string,
  card: Card,
  resume: PendingAction["resume"],
  events: RoundEvent[],
) {
  const playerState = playerStates[playerId];

  if (!playerState) {
    return { pending: false };
  }

  if (isNumberCard(card)) {
    const alreadyHasNumber = playerState.numberCards.some(
      (existingCard) => existingCard.numberValue === card.numberValue,
    );

    if (alreadyHasNumber) {
      const preventedBust = applyHeldSecondChance(round, playerState, card, events);

      if (!preventedBust) {
        playerState.status = "busted";
        playerState.roundScore = 0;
        playerState.pointsAtRisk = 0;
        playerState.bustCard = card;
        discardCard(round, card);
        addEvent(events, {
          eventType: "duplicate_bust",
          actorPlayerId: playerId,
          targetPlayerId: playerId,
          payload: { duplicate: card.numberValue },
        });
      }

      return { pending: false };
    }

    playerState.numberCards.push(card);
    playerState.hasFlip7 = playerState.numberCards.length >= 7;
    updatePointsAtRisk(playerState);

    addEvent(events, {
      eventType: "number_drawn",
      actorPlayerId: playerId,
      targetPlayerId: playerId,
      payload: { numberValue: card.numberValue },
    });

    if (playerState.hasFlip7) {
      round.endedBy = "flip7";
      round.phase = "scoring";
      round.activePlayerId = playerId;
      addEvent(events, {
        eventType: "flip7",
        actorPlayerId: playerId,
        targetPlayerId: playerId,
        payload: {},
      });
    }

    return { pending: false };
  }

  if (isModifierCard(card)) {
    playerState.modifierCards.push(card);
    updatePointsAtRisk(playerState);
    addEvent(events, {
      eventType: "modifier_drawn",
      actorPlayerId: playerId,
      targetPlayerId: playerId,
      payload: { modifierValue: card.modifierValue },
    });
    return { pending: false };
  }

  if (card.actionKind === "second_chance") {
    const alreadyHasSecondChance = playerState.heldActionCards.some(
      (heldCard) => heldCard.actionKind === "second_chance",
    );

    if (!alreadyHasSecondChance) {
      playerState.heldActionCards.push(card);
      addEvent(events, {
        eventType: "second_chance_held",
        actorPlayerId: playerId,
        targetPlayerId: playerId,
        payload: {},
      });
      return { pending: false };
    }

    const eligibleRecipients = activePlayerIds(players, playerStates).filter(
      (candidateId) =>
        candidateId !== playerId &&
        !playerStates[candidateId].heldActionCards.some(
          (heldCard) => heldCard.actionKind === "second_chance",
        ),
    );

    if (eligibleRecipients.length === 0) {
      discardCard(round, card);
      addEvent(events, {
        eventType: "second_chance_discarded",
        actorPlayerId: playerId,
        targetPlayerId: null,
        payload: {},
      });
      return { pending: false };
    }

    const recipient = eligibleRecipients[0];
    playerStates[recipient].heldActionCards.push(card);
    addEvent(events, {
      eventType: "second_chance_passed",
      actorPlayerId: playerId,
      targetPlayerId: recipient,
      payload: {},
    });
    return { pending: false };
  }

  if (isFlip3ActiveForPlayer(round, playerId)) {
    playerState.heldActionCards.push(card);
    round.pendingFlip3?.deferredActionCards.push(card);
    addEvent(events, {
      eventType: "deferred_action",
      actorPlayerId: playerId,
      targetPlayerId: playerId,
      payload: { actionKind: card.actionKind },
    });
    return { pending: false };
  }

  playerState.heldActionCards.push(card);

  if (!isTargetActionCard(card)) {
    return { pending: false };
  }

  resolveHeldTargetAction(
    round,
    players,
    playerStates,
    playerId,
    card,
    resume,
    events,
  );

  return { pending: Boolean(round.pendingAction) };
}
