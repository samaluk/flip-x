import type { Doc } from "../../convex/_generated/dataModel";
import { computeScoreBreakdown, type ScoreBreakdown } from "../logic/scoring";
import { finalizeRound } from "../logic/round-finalization";
import type { RoundEvent } from "../logic/events";
import type { PlayerRoundState, RoundRuntime } from "../logic/round-state";

type MatchCompletionPlayer = Pick<Doc<"players">, "_id" | "totalScore">;
type MatchCompletionMatch = Pick<Doc<"matches">, "targetScore">;
type MatchUpdateContext = {
  nextMatchStatus?: "in_progress" | "completed";
  nextCurrentRoundNumber?: number;
  nextDealerSeat?: number;
};

export type RoundCompletionOutcome = {
  round: RoundRuntime;
  playerStates: Record<string, PlayerRoundState>;
  events: RoundEvent[];
  scoreBreakdowns: Record<string, ScoreBreakdown>;
  playerScorePatches: Record<
    string,
    {
      totalScore: number;
      hasWon: boolean;
    }
  >;
  matchPatch: {
    status?: "in_progress" | "completed";
    currentRoundNumber?: number;
    dealerSeat?: number;
    winnerPlayerId?: string;
  };
  matchCompleted: boolean;
};

function selectUniqueWinner(
  players: Array<{ playerId: string; totalScore: number }>,
  targetScore: number,
) {
  const contenders = players.filter((player) => player.totalScore >= targetScore);
  const highScore = Math.max(...contenders.map((player) => player.totalScore));
  const winners = contenders.filter((player) => player.totalScore === highScore);

  return winners.length === 1 ? winners[0] : null;
}

export function buildRoundCompletionOutcome(input: {
  round: RoundRuntime;
  playerStates: Record<string, PlayerRoundState>;
  players: MatchCompletionPlayer[];
  match: MatchCompletionMatch;
  matchUpdateContext: MatchUpdateContext;
}): RoundCompletionOutcome {
  const finalized = finalizeRound(input.round, input.playerStates);
  const scoreBreakdowns = Object.fromEntries(
    Object.entries(finalized.playerStates).map(([playerId, playerState]) => [
      playerId,
      computeScoreBreakdown(playerState),
    ]),
  );
  const carriedScores = input.players.map((player) => {
    const playerState = finalized.playerStates[String(player._id)];
    return {
      playerId: String(player._id),
      totalScore: player.totalScore + (playerState?.roundScore ?? 0),
    };
  });
  const winner = selectUniqueWinner(carriedScores, input.match.targetScore);
  const playerScorePatches = Object.fromEntries(
    carriedScores.map((player) => [
      player.playerId,
      {
        totalScore: player.totalScore,
        hasWon: winner?.playerId === player.playerId,
      },
    ]),
  );

  return {
    ...finalized,
    scoreBreakdowns,
    playerScorePatches,
    matchPatch: winner
      ? {
          status: "completed",
          winnerPlayerId: winner.playerId,
        }
      : {
          status: input.matchUpdateContext.nextMatchStatus,
          currentRoundNumber: input.matchUpdateContext.nextCurrentRoundNumber,
          dealerSeat: input.matchUpdateContext.nextDealerSeat,
        },
    matchCompleted: winner !== null,
  };
}
