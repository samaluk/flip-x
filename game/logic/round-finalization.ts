import { scoreRound } from "./scoring";
import { addEvent, type RoundEvent } from "./events";
import {
  clonePlayerStates,
  type OrderedPlayer,
  type PlayerRoundState,
  type RoundRuntime,
} from "./round-state";
import { activePlayerIds } from "./turn-order";

export function maybeFinishRound(
  round: RoundRuntime,
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
) {
  if (round.phase === "scoring") {
    return;
  }

  const flip3 = round.pendingFlip3;
  if (flip3 && flip3.cardsRemaining > 0) {
    const targetState = playerStates[flip3.targetPlayerId];
    const flip3StillValid =
      round.phase === "player_turns" &&
      round.activePlayerId === flip3.targetPlayerId &&
      targetState?.status === "active";

    if (flip3StillValid) {
      return;
    }

    round.pendingFlip3 = null;
  }

  if (activePlayerIds(players, playerStates).length === 0) {
    round.phase = "scoring";
    round.endedBy = "all_inactive";
    round.activePlayerId = null;
  }
}

export function finalizeRound(
  roundInput: RoundRuntime,
  playerStatesInput: Record<string, PlayerRoundState>,
) {
  const round: RoundRuntime = {
    ...roundInput,
    drawPile: [...roundInput.drawPile],
    discardPile: [...roundInput.discardPile],
    pendingAction: null,
    pendingFlip3: null,
    phase: "completed",
  };
  const playerStates = clonePlayerStates(playerStatesInput);
  const events: RoundEvent[] = [];

  for (const playerState of Object.values(playerStates)) {
    if (playerState.status === "busted") {
      playerState.roundScore = 0;
      playerState.pointsAtRisk = 0;
      playerState.status = "completed";
      continue;
    }

    const breakdown = scoreRound(
      playerState.numberCards,
      playerState.modifierCards,
      playerState.hasFlip7,
    );

    playerState.roundScore = breakdown.finalRoundScore;
    playerState.pointsAtRisk = breakdown.finalRoundScore;
    playerState.status = "completed";

    addEvent(events, {
      eventType: "round_scored",
      actorPlayerId: playerState.playerId,
      targetPlayerId: playerState.playerId,
      payload: { finalRoundScore: breakdown.finalRoundScore },
    });
  }

  return { round, playerStates, events };
}
