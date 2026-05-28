import { getManyFrom } from "convex-helpers/server/relationships";

import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../convex/_generated/server";
import type { RoundHistoryEntry } from "../logic/view-models";

type Ctx = QueryCtx | MutationCtx;

type MatchStatus = "setup" | "in_progress" | "completed";

type PlayerScoreSummary = {
  playerId: string;
  totalScore: number;
  seatIndex: number;
};

type CompletedRoundSummary = {
  roundNumber: number;
  scoreByPlayerId: Map<string, number>;
};

type ProjectedRoundSummary = {
  roundNumber: number;
  pointsAtRiskByPlayerId: Map<string, number>;
};

export function calculateRoundHistory(args: {
  targetScore: number;
  currentRoundNumber: number;
  matchStatus: MatchStatus;
  players: PlayerScoreSummary[];
  completedRounds: CompletedRoundSummary[];
  projectedRound: ProjectedRoundSummary | null;
}): RoundHistoryEntry[] {
  const orderedPlayers = [...args.players].toSorted(
    (left, right) => left.seatIndex - right.seatIndex,
  );
  const runningTotals = new Map(orderedPlayers.map((player) => [player.playerId, 0]));

  const history: RoundHistoryEntry[] = [...args.completedRounds]
    .toSorted((left, right) => left.roundNumber - right.roundNumber)
    .map((round) => ({
      roundNumber: round.roundNumber,
      phase: "completed",
      isCurrentRound: false,
      scores: orderedPlayers.map((player) => {
        const roundScore = round.scoreByPlayerId.get(player.playerId) ?? 0;
        const totalScore = (runningTotals.get(player.playerId) ?? 0) + roundScore;
        runningTotals.set(player.playerId, totalScore);

        return {
          playerId: player.playerId,
          roundScore,
          totalScore,
          pointsToTarget: Math.max(args.targetScore - totalScore, 0),
          reachedTarget: totalScore >= args.targetScore,
        };
      }),
    }));

  if (args.matchStatus === "completed" || args.projectedRound === null) {
    return history;
  }

  history.push({
    roundNumber: args.currentRoundNumber,
    phase: "projected",
    isCurrentRound: true,
    scores: orderedPlayers.map((player) => {
      const roundScore = args.projectedRound?.pointsAtRiskByPlayerId.get(player.playerId) ?? 0;
      const totalScore = player.totalScore + roundScore;

      return {
        playerId: player.playerId,
        roundScore,
        totalScore,
        pointsToTarget: Math.max(args.targetScore - totalScore, 0),
        reachedTarget: totalScore >= args.targetScore,
      };
    }),
  });

  return history;
}

async function loadCompletedRoundSummary(
  ctx: Ctx,
  round: Doc<"rounds">,
): Promise<CompletedRoundSummary> {
  const breakdownDocs = await getManyFrom(
    ctx.db,
    "scoreBreakdowns",
    "by_round",
    round._id,
    "roundId",
  );

  return {
    roundNumber: round.roundNumber,
    scoreByPlayerId: new Map(
      breakdownDocs.map((breakdown) => [String(breakdown.playerId), breakdown.finalRoundScore]),
    ),
  };
}

async function loadProjectedRoundSummary(
  ctx: Ctx,
  round: Doc<"rounds">,
): Promise<ProjectedRoundSummary> {
  const stateDocs = await getManyFrom(
    ctx.db,
    "roundPlayerStates",
    "by_round",
    round._id,
    "roundId",
  );

  return {
    roundNumber: round.roundNumber,
    pointsAtRiskByPlayerId: new Map(
      stateDocs.map((playerState) => [String(playerState.playerId), playerState.pointsAtRisk]),
    ),
  };
}

export async function buildRoundHistory(
  ctx: Ctx,
  matchId: Id<"matches">,
  targetScore: number,
  currentRoundNumber: number,
  matchStatus: MatchStatus,
  players: PlayerScoreSummary[],
): Promise<RoundHistoryEntry[]> {
  const roundDocs = await getManyFrom(ctx.db, "rounds", "by_match", matchId, "matchId");
  const sortedRounds = roundDocs.toSorted((left, right) => left.roundNumber - right.roundNumber);
  const completedRounds = await Promise.all(
    sortedRounds.reduce<Array<Promise<CompletedRoundSummary>>>((summaries, round) => {
      if (round.phase === "completed") {
        summaries.push(loadCompletedRoundSummary(ctx, round));
      }
      return summaries;
    }, []),
  );

  const latestRound = sortedRounds.at(-1) ?? null;
  const projectedRound =
    latestRound && latestRound.phase !== "completed" && matchStatus !== "completed"
      ? await loadProjectedRoundSummary(ctx, latestRound)
      : null;

  return calculateRoundHistory({
    targetScore,
    currentRoundNumber,
    matchStatus,
    players,
    completedRounds,
    projectedRound,
  });
}
