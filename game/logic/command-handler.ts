import { createDeck } from "./card-types";
import { invalidAction, invalidTarget, invalidTurn } from "../../shared/lib/errors/domain";
import { applyResolvedTargetAction } from "./action-resolution";
import { applyCardToPlayer } from "./apply-card";
import { addEvent, cardEventPayload, type RoundEvent } from "./events";
import { drawCard } from "./draw";
import {
  discardDeferredFlip3Cards,
  isFlip3ActiveForPlayer,
  resolveDeferredFlip3Actions,
} from "./flip-three";
import { maybeFinishRound } from "./round-finalization";
import {
  clonePendingFlip3,
  clonePlayerStates,
  cloneRoundRuntime,
  type CreateRoundRuntimeOptions,
  type OrderedPlayer,
  type PlayerRoundState,
  type ResolveResult,
  type RoundRuntime,
} from "./round-state";
import { getPlayerBySeat, nextActiveSeatIndex } from "./turn-order";

function transitionDealingToPlayerTurns(
  round: RoundRuntime,
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
) {
  round.phase = "player_turns";
  const firstActiveSeat = nextActiveSeatIndex(players, playerStates, round.dealerSeat - 1);
  round.turnSeatIndex = firstActiveSeat ?? round.dealerSeat;
  round.activePlayerId =
    firstActiveSeat === null ? null : getPlayerBySeat(players, firstActiveSeat).playerId;
}

export function createPlayerRoundStates(players: OrderedPlayer[]) {
  return Object.fromEntries(
    players.map((player) => [
      player.playerId,
      {
        playerId: player.playerId,
        status: "waiting",
        numberCards: [],
        modifierCards: [],
        heldActionCards: [],
        receivedActionCards: [],
        roundScore: 0,
        pointsAtRisk: 0,
        hasFlip7: false,
        bustCard: null,
      } satisfies PlayerRoundState,
    ]),
  );
}

export function createRoundRuntime(
  players: OrderedPlayer[],
  roundNumber: number,
  dealerSeat: number,
  options: CreateRoundRuntimeOptions = {},
) {
  const firstPlayer = getPlayerBySeat(players, dealerSeat);

  return {
    phase: options.phase ?? "dealing",
    roundNumber,
    dealerSeat,
    drawPile: [...(options.drawPile ?? createDeck(options.rng))],
    discardPile: [...(options.discardPile ?? [])],
    openingSeatIndex: options.openingSeatIndex ?? firstPlayer.seatIndex,
    turnSeatIndex: options.turnSeatIndex ?? firstPlayer.seatIndex,
    activePlayerId: options.activePlayerId ?? firstPlayer.playerId,
    endedBy: options.endedBy ?? "unknown",
    pendingAction: options.pendingAction ?? null,
    pendingFlip3: options.pendingFlip3 ? clonePendingFlip3(options.pendingFlip3) : null,
  } satisfies RoundRuntime;
}

export function continueRound(
  players: OrderedPlayer[],
  roundInput: RoundRuntime,
  playerStatesInput: Record<string, PlayerRoundState>,
) {
  const round = cloneRoundRuntime(roundInput);
  const playerStates = clonePlayerStates(playerStatesInput);
  const events: RoundEvent[] = [];

  while (round.phase === "dealing" && !round.pendingAction && !round.pendingFlip3) {
    const player = getPlayerBySeat(players, round.openingSeatIndex);
    const playerState = playerStates[player.playerId];

    if (!playerState) {
      break;
    }

    if (playerState.status === "waiting") {
      playerState.status = "active";
    }

    const card = drawCard(round);

    if (!card) {
      break;
    }

    const nextOpeningSeatIndex = round.openingSeatIndex + 1;
    const wrappedToDealer =
      getPlayerBySeat(players, nextOpeningSeatIndex).seatIndex === round.dealerSeat;
    round.openingSeatIndex = nextOpeningSeatIndex;

    addEvent(events, {
      eventType: "initial_deal",
      actorPlayerId: player.playerId,
      targetPlayerId: player.playerId,
      payload: cardEventPayload(card),
    });

      applyCardToPlayer(round, players, playerStates, player.playerId, card, "dealing", events);

      // If Flip Three was dealt, transition to player_turns so the target can hit
      if (round.pendingFlip3) {
        round.phase = "player_turns";
        break;
      }

      if (round.phase !== "dealing") {
        break;
      }

    if (wrappedToDealer) {
      transitionDealingToPlayerTurns(round, players, playerStates);
      break;
    }
  }

  // Safety: if loop exited while still dealing, force valid phase
  if (round.phase === "dealing" && !round.pendingAction && !round.pendingFlip3) {
    const anyActive = Object.values(playerStates).some((s) => s.status === "active");
    if (!anyActive) {
      round.phase = "scoring";
      round.endedBy = "all_inactive";
      round.activePlayerId = null;
    } else {
      transitionDealingToPlayerTurns(round, players, playerStates);
    }
  }

  maybeFinishRound(round, players, playerStates);

  return { round, playerStates, events } satisfies ResolveResult;
}

export function takeTurnAction(
  players: OrderedPlayer[],
  roundInput: RoundRuntime,
  playerStatesInput: Record<string, PlayerRoundState>,
  playerId: string,
  action: "hit" | "stay",
) {
  const round = cloneRoundRuntime(roundInput);
  const playerStates = clonePlayerStates(playerStatesInput);
  const events: RoundEvent[] = [];
  const currentState = playerStates[playerId];

  if (!currentState || round.phase !== "player_turns" || round.activePlayerId !== playerId) {
    throw invalidTurn();
  }

  if (action === "stay") {
    if (isFlip3ActiveForPlayer(round, playerId)) {
      throw invalidTurn();
    }
    currentState.status = "stayed";
    currentState.roundScore = currentState.pointsAtRisk;
    addEvent(events, {
      eventType: "stay",
      actorPlayerId: playerId,
      targetPlayerId: playerId,
      payload: {},
    });
  } else {
    const card = drawCard(round);

    if (!card) {
      round.phase = "scoring";
    } else {
      const isFlip3Turn = isFlip3ActiveForPlayer(round, playerId);

      addEvent(events, {
        eventType: isFlip3Turn ? "flip3_hit" : "hit",
        actorPlayerId: playerId,
        targetPlayerId: playerId,
        payload: cardEventPayload(card),
      });

      applyCardToPlayer(round, players, playerStates, playerId, card, "turns", events);

      if (isFlip3Turn) {
        const flip3 = round.pendingFlip3;

        if (!flip3) {
          // A nested Flip Three cannot replace the active one until the current sequence ends.
        } else if (round.phase !== "player_turns") {
          discardDeferredFlip3Cards(round, currentState, flip3.deferredActionCards);
          round.pendingFlip3 = null;
        } else if (currentState.status !== "active") {
          discardDeferredFlip3Cards(round, currentState, flip3.deferredActionCards);
          round.pendingFlip3 = null;
        } else {
          flip3.cardsRemaining -= 1;
          if (flip3.cardsRemaining <= 0) {
            const deferredCards = [...flip3.deferredActionCards];
            round.pendingFlip3 = null;
            addEvent(events, {
              eventType: "flip3_completed",
              actorPlayerId: playerId,
              targetPlayerId: playerId,
              payload: {},
            });
            if (deferredCards.length > 0) {
              round.pendingFlip3 = {
                ...flip3,
                cardsRemaining: 0,
                deferredActionCards: deferredCards,
              };
              resolveDeferredFlip3Actions(round, players, playerStates, playerId, events);
              if (
                round.pendingFlip3?.targetPlayerId === playerId &&
                round.pendingFlip3.cardsRemaining === 0
              ) {
                round.pendingFlip3 = null;
              }
            }
          }
        }
      }
    }
  }

  maybeFinishRound(round, players, playerStates);

  if (round.phase === "player_turns" && !round.pendingAction && !round.pendingFlip3) {
    const nextSeat = nextActiveSeatIndex(players, playerStates, round.turnSeatIndex);
    round.turnSeatIndex = nextSeat ?? round.turnSeatIndex;
    round.activePlayerId = nextSeat === null ? null : getPlayerBySeat(players, nextSeat).playerId;
    maybeFinishRound(round, players, playerStates);
  }

  return { round, playerStates, events } satisfies ResolveResult;
}

export function resolvePendingAction(
  players: OrderedPlayer[],
  roundInput: RoundRuntime,
  playerStatesInput: Record<string, PlayerRoundState>,
  targetPlayerId: string,
) {
  if (!roundInput.pendingAction) {
    throw invalidAction();
  }

  const round = cloneRoundRuntime(roundInput);
  const playerStates = clonePlayerStates(playerStatesInput);
  const events: RoundEvent[] = [];
  const pendingAction = round.pendingAction;

  if (!pendingAction) {
    throw invalidAction();
  }

  if (!pendingAction.eligibleTargetIds.includes(targetPlayerId)) {
    throw invalidTarget();
  }

  round.pendingAction = null;
  round.phase = pendingAction.resume === "dealing" ? "dealing" : "player_turns";

  applyResolvedTargetAction(
    round,
    players,
    playerStates,
    pendingAction.sourcePlayerId,
    pendingAction.actionKind,
    targetPlayerId,
    events,
  );

  // If Flip Three was resolved, ensure phase is player_turns for target to hit
  if (round.pendingFlip3) {
    round.phase = "player_turns";
  }

  // Advance turn if current active player is no longer active (e.g., frozen by self-targeting)
  if (round.phase === "player_turns" && !round.pendingAction && !round.pendingFlip3) {
    const currentPlayerState = round.activePlayerId ? playerStates[round.activePlayerId] : null;
    if (currentPlayerState?.status !== "active") {
      const nextSeat = nextActiveSeatIndex(players, playerStates, round.turnSeatIndex);
      round.turnSeatIndex = nextSeat ?? round.turnSeatIndex;
      round.activePlayerId = nextSeat === null ? null : getPlayerBySeat(players, nextSeat).playerId;
    }
  }

  maybeFinishRound(round, players, playerStates);

  if (round.phase === "dealing" && !round.pendingAction) {
    const continued = continueRound(players, round, playerStates);
    return {
      round: continued.round,
      playerStates: continued.playerStates,
      events: [...events, ...continued.events],
    } satisfies ResolveResult;
  }

  return { round, playerStates, events } satisfies ResolveResult;
}
