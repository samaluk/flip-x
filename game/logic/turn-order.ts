import type { OrderedPlayer, PlayerRoundState } from "./round-state";

export function orderedPlayerIds(players: OrderedPlayer[]) {
  return [...players].toSorted((left, right) => left.seatIndex - right.seatIndex);
}

export function getPlayerBySeat(players: OrderedPlayer[], seatIndex: number) {
  const total = players.length;
  const normalized = ((seatIndex % total) + total) % total;
  return orderedPlayerIds(players)[normalized];
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

export function activePlayerIds(
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
) {
  return orderedPlayerIds(players)
    .filter((player) => playerStates[player.playerId]?.status === "active")
    .map((player) => player.playerId);
}
