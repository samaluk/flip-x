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
  type PendingAction,
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

function runOneDealingStep(
  round: RoundRuntime,
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
  events: RoundEvent[],
): boolean {
  const player = getPlayerBySeat(players, round.openingSeatIndex);
  const playerState = playerStates[player.playerId];

  if (!playerState) {
    return false;
  }

  if (playerState.status === "waiting") {
    playerState.status = "active";
  }

  const card = drawCard(round);
  if (!card) {
    return false;
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

  if (round.pendingFlip3) {
    round.phase = "player_turns";
    return false;
  }

  if (round.phase !== "dealing") {
    return false;
  }

  if (wrappedToDealer) {
    transitionDealingToPlayerTurns(round, players, playerStates);
    return false;
  }

  return true;
}

function finalizeDealingIfStuck(
  round: RoundRuntime,
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
) {
  if (round.phase !== "dealing" || round.pendingAction || round.pendingFlip3) {
    return;
  }
  const anyActive = Object.values(playerStates).some((s) => s.status === "active");
  if (!anyActive) {
    round.phase = "scoring";
    round.endedBy = "all_inactive";
    round.activePlayerId = null;
  } else {
    transitionDealingToPlayerTurns(round, players, playerStates);
  }
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
    if (!runOneDealingStep(round, players, playerStates, events)) {
      break;
    }
  }

  finalizeDealingIfStuck(round, players, playerStates);

  maybeFinishRound(round, players, playerStates);

  return { round, playerStates, events } satisfies ResolveResult;
}

function requireActivePlayerTurn(
  round: RoundRuntime,
  playerStates: Record<string, PlayerRoundState>,
  playerId: string,
): PlayerRoundState {
  const currentState = playerStates[playerId];
  if (!currentState || round.phase !== "player_turns" || round.activePlayerId !== playerId) {
    throw invalidTurn();
  }
  return currentState;
}

function applyStayTurn(
  round: RoundRuntime,
  playerId: string,
  currentState: PlayerRoundState,
  events: RoundEvent[],
) {
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
}

function handleFlipThreeProgressAfterHit(
  round: RoundRuntime,
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
  playerId: string,
  currentState: PlayerRoundState,
  events: RoundEvent[],
) {
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

function executeHitTurn(
  round: RoundRuntime,
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
  playerId: string,
  currentState: PlayerRoundState,
  events: RoundEvent[],
) {
  const card = drawCard(round);

  if (!card) {
    round.phase = "scoring";
    return;
  }

  const isFlip3Turn = isFlip3ActiveForPlayer(round, playerId);

  addEvent(events, {
    eventType: isFlip3Turn ? "flip3_hit" : "hit",
    actorPlayerId: playerId,
    targetPlayerId: playerId,
    payload: cardEventPayload(card),
  });

  applyCardToPlayer(round, players, playerStates, playerId, card, "turns", events);

  if (isFlip3Turn) {
    handleFlipThreeProgressAfterHit(round, players, playerStates, playerId, currentState, events);
  }
}

function advanceTurnWhenQueueClear(
  round: RoundRuntime,
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
) {
  if (round.phase === "player_turns" && !round.pendingAction && !round.pendingFlip3) {
    const nextSeat = nextActiveSeatIndex(players, playerStates, round.turnSeatIndex);
    round.turnSeatIndex = nextSeat ?? round.turnSeatIndex;
    round.activePlayerId = nextSeat === null ? null : getPlayerBySeat(players, nextSeat).playerId;
    maybeFinishRound(round, players, playerStates);
  }
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
  const currentState = requireActivePlayerTurn(round, playerStates, playerId);

  if (action === "stay") {
    applyStayTurn(round, playerId, currentState, events);
  } else {
    executeHitTurn(round, players, playerStates, playerId, currentState, events);
  }

  maybeFinishRound(round, players, playerStates);
  advanceTurnWhenQueueClear(round, players, playerStates);

  return { round, playerStates, events } satisfies ResolveResult;
}

function requirePendingActionFromRound(round: RoundRuntime): PendingAction {
  const pending = round.pendingAction;
  if (!pending) {
    throw invalidAction();
  }
  return pending;
}

function commitResolvedPendingPhase(round: RoundRuntime, pendingAction: PendingAction) {
  round.pendingAction = null;
  round.phase = pendingAction.resume === "dealing" ? "dealing" : "player_turns";
}

function ensurePlayerTurnsWhenFlip3Pending(round: RoundRuntime) {
  if (round.pendingFlip3) {
    round.phase = "player_turns";
  }
}

function maybeAdvanceTurnIfActivePlayerInactive(
  round: RoundRuntime,
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
) {
  if (round.phase !== "player_turns" || round.pendingAction || round.pendingFlip3) {
    return;
  }
  const currentPlayerState = round.activePlayerId ? playerStates[round.activePlayerId] : null;
  if (currentPlayerState?.status === "active") {
    return;
  }
  const nextSeat = nextActiveSeatIndex(players, playerStates, round.turnSeatIndex);
  round.turnSeatIndex = nextSeat ?? round.turnSeatIndex;
  round.activePlayerId = nextSeat === null ? null : getPlayerBySeat(players, nextSeat).playerId;
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
  const pendingAction = requirePendingActionFromRound(round);

  if (!pendingAction.eligibleTargetIds.includes(targetPlayerId)) {
    throw invalidTarget();
  }

  commitResolvedPendingPhase(round, pendingAction);

  applyResolvedTargetAction(
    round,
    players,
    playerStates,
    pendingAction.sourcePlayerId,
    pendingAction.actionKind,
    targetPlayerId,
    events,
  );

  ensurePlayerTurnsWhenFlip3Pending(round);
  maybeAdvanceTurnIfActivePlayerInactive(round, players, playerStates);
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
