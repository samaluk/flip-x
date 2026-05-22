import type { ActionCard } from "./card-types";
import { invalidTarget } from "../../shared/lib/errors/domain";
import { addEvent, type RoundEvent } from "./events";
import { maybeFinishRound } from "./round-finalization";
import { updatePointsAtRisk } from "./scoring";
import type { OrderedPlayer, PendingAction, PlayerRoundState, RoundRuntime } from "./round-state";
import {
  activePlayerIds,
  getPlayerBySeat,
  nextActiveSeatIndex,
  orderedPlayerIds,
} from "./turn-order";

type TargetActionResolution = "continue_dealing" | "continue_turns" | "wait_for_input";

function createPendingTargetAction(
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

function applyResolvedTargetAction(
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

function commitResolvedPendingPhase(round: RoundRuntime, pendingAction: PendingAction) {
  round.pendingAction = null;
  round.phase = pendingAction.resume === "dealing" ? "dealing" : "player_turns";
}

function ensurePlayerTurnsWhenFlip3Pending(round: RoundRuntime) {
  if (round.pendingFlip3) {
    round.phase = "player_turns";
  }
}

function focusPendingTurnOwner(round: RoundRuntime, players: OrderedPlayer[]) {
  const targetPlayerId = round.pendingFlip3?.targetPlayerId;
  if (!targetPlayerId) {
    return;
  }

  const targetPlayer = players.find((player) => player.playerId === targetPlayerId);
  if (!targetPlayer) {
    return;
  }

  round.turnSeatIndex = targetPlayer.seatIndex;
  round.activePlayerId = targetPlayerId;
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

export function resolvePendingTargetAction(
  round: RoundRuntime,
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
  pendingAction: PendingAction,
  targetPlayerId: string,
  events: RoundEvent[],
): TargetActionResolution {
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
  focusPendingTurnOwner(round, players);
  maybeAdvanceTurnIfActivePlayerInactive(round, players, playerStates);
  maybeFinishRound(round, players, playerStates);

  if (round.pendingAction || round.pendingFlip3 || round.phase === "scoring") {
    return "wait_for_input";
  }

  return round.phase === "dealing" ? "continue_dealing" : "continue_turns";
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
    focusPendingTurnOwner(round, players);
  }
}
