import {
  createPlayerRoundStates as createPlayerRoundStatesImpl,
  createRoundRuntime as createRoundRuntimeImpl,
} from "@/game/logic/command-handler";
import type { PlayerRoundState, RoundRuntime } from "@/game/logic/round-state";

const testPlayers = [
  { playerId: "p1", seatIndex: 0 },
  { playerId: "p2", seatIndex: 1 },
  { playerId: "p3", seatIndex: 2 },
];

export function createRoundRuntime(
  players = testPlayers,
  roundNumber = 1,
  dealerSeat = 0,
): RoundRuntime {
  return createRoundRuntimeImpl(players, roundNumber, dealerSeat) as RoundRuntime;
}

export function createPlayerRoundStates(players = testPlayers): Record<string, PlayerRoundState> {
  return createPlayerRoundStatesImpl(players) as Record<string, PlayerRoundState>;
}

export function createTurnRound(players = testPlayers): RoundRuntime {
  const round = createRoundRuntime(players);
  round.phase = "player_turns";
  round.activePlayerId = "p1";
  round.turnSeatIndex = 0;
  return round;
}

export function createActivePlayerStates(players = testPlayers): Record<string, PlayerRoundState> {
  const playerStates = createPlayerRoundStates(players);
  playerStates.p1.status = "active";
  playerStates.p2.status = "active";
  playerStates.p3.status = "active";
  return playerStates;
}

export const testPlayers3P = testPlayers;

export const testPlayers2P = [
  { playerId: "p1", seatIndex: 0 },
  { playerId: "p2", seatIndex: 1 },
];

export const testPlayers4P = [
  { playerId: "p1", seatIndex: 0 },
  { playerId: "p2", seatIndex: 1 },
  { playerId: "p3", seatIndex: 2 },
  { playerId: "p4", seatIndex: 3 },
];
