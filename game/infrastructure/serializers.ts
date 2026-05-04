import type { Doc, Id } from "../../convex/_generated/dataModel";
import { isActionCard, isModifierCard, isNumberCard, type Card } from "../logic/card-types";
import { decodeRoundEvent, encodeRoundEvent, type RoundEvent } from "../logic/events";
import type { PlayerRoundState, RoundRuntime } from "../logic/round-state";

type PlayerIdMap = Map<string, Id<"players">>;

export function serializeRoundRuntime(round: RoundRuntime, playerIdMap: PlayerIdMap) {
  return {
    phase: round.phase,
    dealerSeat: round.dealerSeat,
    activePlayerId: round.activePlayerId ? playerIdMap.get(round.activePlayerId) : undefined,
    drawPile: round.drawPile,
    discardPile: round.discardPile,
    openingSeatIndex: round.openingSeatIndex,
    turnSeatIndex: round.turnSeatIndex,
    endedBy: round.endedBy,
    pendingAction: round.pendingAction
      ? {
          sourcePlayerId: playerIdMap.get(round.pendingAction.sourcePlayerId)!,
          actionKind: round.pendingAction.actionKind,
          eligibleTargetIds: round.pendingAction.eligibleTargetIds.map(
            (playerId) => playerIdMap.get(playerId)!,
          ),
          resume: round.pendingAction.resume,
        }
      : undefined,
    pendingFlip3: round.pendingFlip3
      ? {
          sourcePlayerId: playerIdMap.get(round.pendingFlip3.sourcePlayerId)!,
          targetPlayerId: playerIdMap.get(round.pendingFlip3.targetPlayerId)!,
          cardsRemaining: round.pendingFlip3.cardsRemaining,
          deferredActionCards: round.pendingFlip3.deferredActionCards,
        }
      : undefined,
  };
}

export function deserializeRoundRuntime(doc: Doc<"rounds">): RoundRuntime {
  return {
    phase: doc.phase,
    roundNumber: doc.roundNumber,
    dealerSeat: doc.dealerSeat,
    activePlayerId: doc.activePlayerId ? String(doc.activePlayerId) : null,
    drawPile: doc.drawPile as Card[],
    discardPile: doc.discardPile as Card[],
    openingSeatIndex: doc.openingSeatIndex,
    turnSeatIndex: doc.turnSeatIndex,
    endedBy: doc.endedBy,
    pendingAction: doc.pendingAction
      ? {
          sourcePlayerId: String(doc.pendingAction.sourcePlayerId),
          actionKind: doc.pendingAction.actionKind,
          eligibleTargetIds: doc.pendingAction.eligibleTargetIds.map((id) => String(id)),
          resume: doc.pendingAction.resume,
        }
      : null,
    pendingFlip3: doc.pendingFlip3
      ? ({
          sourcePlayerId: String(doc.pendingFlip3.sourcePlayerId),
          targetPlayerId: String(doc.pendingFlip3.targetPlayerId),
          cardsRemaining: doc.pendingFlip3.cardsRemaining,
          deferredActionCards: doc.pendingFlip3.deferredActionCards.filter(isActionCard),
        } satisfies NonNullable<RoundRuntime["pendingFlip3"]>)
      : null,
  };
}

export function serializePlayerRoundState(
  roundId: Id<"rounds">,
  playerState: PlayerRoundState,
  playerIdMap: PlayerIdMap,
) {
  const { playerId, bustCard, ...rest } = playerState;
  return {
    roundId,
    playerId: playerIdMap.get(playerId)!,
    ...rest,
    ...(bustCard ? { bustCard } : {}),
  };
}

export function serializePlayerRoundStatePatch(playerState: PlayerRoundState) {
  return {
    status: playerState.status,
    numberCards: playerState.numberCards,
    modifierCards: playerState.modifierCards,
    heldActionCards: playerState.heldActionCards,
    receivedActionCards: playerState.receivedActionCards,
    roundScore: playerState.roundScore,
    pointsAtRisk: playerState.pointsAtRisk,
    hasFlip7: playerState.hasFlip7,
    bustCard: playerState.bustCard ?? undefined,
  };
}

export function deserializePlayerRoundState(doc: Doc<"roundPlayerStates">): PlayerRoundState {
  const numberCards = doc.numberCards.filter(isNumberCard);
  const modifierCards = doc.modifierCards.filter(isModifierCard);
  const heldActionCards = doc.heldActionCards.filter(isActionCard);
  const receivedActionCards = doc.receivedActionCards.filter(isActionCard);
  const bustCard =
    doc.bustCard !== null && doc.bustCard !== undefined && isNumberCard(doc.bustCard)
      ? doc.bustCard
      : null;

  return {
    playerId: String(doc.playerId),
    status: doc.status,
    numberCards,
    modifierCards,
    heldActionCards,
    receivedActionCards,
    roundScore: doc.roundScore,
    pointsAtRisk: doc.pointsAtRisk,
    hasFlip7: doc.hasFlip7,
    bustCard,
  } satisfies PlayerRoundState;
}

export function serializeRoundEvent(event: RoundEvent, playerIdMap: PlayerIdMap) {
  const persistedEvent = encodeRoundEvent(event);
  return {
    eventType: persistedEvent.eventType,
    actorPlayerId: persistedEvent.actorPlayerId
      ? playerIdMap.get(persistedEvent.actorPlayerId)
      : undefined,
    targetPlayerId: persistedEvent.targetPlayerId
      ? playerIdMap.get(persistedEvent.targetPlayerId)
      : undefined,
    payload: persistedEvent.payload,
  };
}

export function deserializeRoundEvent(doc: Doc<"roundEvents">): RoundEvent {
  return decodeRoundEvent({
    eventType: doc.eventType,
    actorPlayerId: doc.actorPlayerId ? String(doc.actorPlayerId) : null,
    targetPlayerId: doc.targetPlayerId ? String(doc.targetPlayerId) : null,
    payload: doc.payload,
  });
}
