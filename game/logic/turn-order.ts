import type { OrderedPlayer, PlayerRoundState } from "./round-state";

export function orderedPlayers<T extends OrderedPlayer>(players: readonly T[]): T[] {
  return [...players].toSorted((left, right) => left.seatIndex - right.seatIndex);
}

export function getPlayerBySeat<T extends OrderedPlayer>(
  players: readonly T[],
  seatIndex: number,
): T {
  const total = players.length;
  const normalized = ((seatIndex % total) + total) % total;
  return orderedPlayers(players)[normalized];
}

export function getPlayerById<T extends OrderedPlayer>(
  players: readonly T[],
  playerId: string,
): T | undefined {
  return players.find((player) => player.playerId === playerId);
}

export function nextActiveSeatIndex(
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
  seatIndex: number,
) {
  for (let offset = 1; offset <= players.length; offset += 1) {
    const player = getPlayerBySeat(players, seatIndex + offset);

    if (playerStates[player.playerId]?.status === "active") {
      return player.seatIndex;
    }
  }

  return null;
}

export function advanceToNextActiveSeat(
  round: { turnSeatIndex: number; activePlayerId: string | null },
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
) {
  const nextSeat = nextActiveSeatIndex(players, playerStates, round.turnSeatIndex);
  round.turnSeatIndex = nextSeat ?? round.turnSeatIndex;
  round.activePlayerId = nextSeat === null ? null : getPlayerBySeat(players, nextSeat).playerId;
}

export function activePlayerIds(
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
) {
  return orderedPlayers(players)
    .filter((player) => playerStates[player.playerId]?.status === "active")
    .map((player) => player.playerId);
}
