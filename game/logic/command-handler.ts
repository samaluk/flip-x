import { createDeck } from "./card-types";
import { invalidAction, invalidTurn } from "../../shared/lib/errors/domain";
import { resolvePendingTargetAction } from "./action-resolution";
import { applyCardToPlayer } from "./apply-card";
import { addEvent, cardEventPayload, type RoundEvent } from "./events";
import { drawCard } from "./draw";
import { advanceFlip3Hit, isFlip3ActiveForPlayer } from "./flip-three";
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
    drawPile: [
      ...(options.drawPile ??
        createDeck(options.rng, { maxNumberCardValue: options.maxNumberCardValue })),
    ],
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

function executeHitTurn(
  round: RoundRuntime,
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
  playerId: string,
  events: RoundEvent[],
) {
  const card = drawCard(round);

  if (!card) {
    round.phase = "scoring";
    return;
  }

  const isFlip3Turn = isFlip3ActiveForPlayer(round, playerId);

  if (isFlip3Turn) {
    advanceFlip3Hit(
      round,
      players,
      playerStates,
      playerId,
      card,
      (drawnCard) => {
        applyCardToPlayer(round, players, playerStates, playerId, drawnCard, "turns", events);
      },
      events,
    );
    return;
  }

  addEvent(events, {
    eventType: "hit",
    actorPlayerId: playerId,
    targetPlayerId: playerId,
    payload: cardEventPayload(card),
  });

  applyCardToPlayer(round, players, playerStates, playerId, card, "turns", events);
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
    executeHitTurn(round, players, playerStates, playerId, events);
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

  const targetResolution = resolvePendingTargetAction(
    round,
    players,
    playerStates,
    pendingAction,
    targetPlayerId,
    events,
  );

  if (targetResolution === "continue_dealing") {
    const continued = continueRound(players, round, playerStates);
    return {
      round: continued.round,
      playerStates: continued.playerStates,
      events: [...events, ...continued.events],
    } satisfies ResolveResult;
  }

  if (targetResolution === "continue_turns") {
    advanceTurnWhenQueueClear(round, players, playerStates);
  }

  return { round, playerStates, events } satisfies ResolveResult;
}
