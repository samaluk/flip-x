import type { MutationCtx } from "../../convex/_generated/server";
import type { Id } from "../../convex/_generated/dataModel";
import {
  InvalidAction,
  InvalidMatchState,
  InvalidTurn,
  InsufficientPlayers,
  MatchNotFound,
  NotHost,
  PlayerNotJoined,
} from "../../shared/lib/errors/domain";
import {
  continueRound,
  createPlayerRoundStates,
  createRoundRuntime,
  finalizeRound,
  resolvePendingAction,
  takeTurnAction,
} from "../logic/turn-resolution";
import type { GameCommand } from "./game-command";
import { loadMatchAggregate } from "../infrastructure/load-match-aggregate";
import { saveCommandResult, type GameTransition } from "../infrastructure/save-command-result";
import { buildLatestMatchSnapshot } from "../infrastructure/snapshot-store";

function finalizeIfNeeded(transition: Omit<GameTransition, "finalized">): GameTransition {
  const finalizedRound = transition.roundWrite.round.phase === "scoring";

  if (!finalizedRound) {
    return transition;
  }

  const finalized = finalizeRound(transition.roundWrite.round, transition.playerStates);
  return {
    ...transition,
    finalized,
  };
}

function buildStartRoundTransition(
  input: {
    command: Extract<GameCommand, { type: "START_MATCH" | "START_NEXT_ROUND" }>;
    roundNumber: number;
    dealerSeat: number;
    matchUpdateContext: GameTransition["matchUpdateContext"];
  },
  players: Parameters<typeof createPlayerRoundStates>[0],
) {
  const playerStates = createPlayerRoundStates(players);
  const baseRound = createRoundRuntime(players, input.roundNumber, input.dealerSeat, {
    drawPile: input.command.deterministicStart?.roundSeed.drawPile,
  });
  const resolved = continueRound(players, baseRound, playerStates);

  return finalizeIfNeeded({
    command: input.command.type,
    roundWrite: {
      kind: "create",
      roundNumber: input.roundNumber,
      startedAt: Date.now(),
      round: resolved.round,
    },
    playerStates: resolved.playerStates,
    events: resolved.events,
    matchUpdateContext: input.matchUpdateContext,
  });
}

export async function runGameCommand(
  ctx: MutationCtx,
  input: {
    matchId: Id<"matches">;
    sessionId: string;
    command: GameCommand;
  },
) {
  const aggregate = await loadMatchAggregate(ctx, input.matchId, input.sessionId as never);
  const {
    latestRound,
    match,
    orderedPlayers,
    playerIdMap,
    playerStates,
    players,
    roundRuntime,
    viewerPlayerId,
  } = aggregate;

  let transition: GameTransition;

  switch (input.command.type) {
    case "START_MATCH": {
      if (!match || match.status !== "setup") {
        throw new InvalidMatchState();
      }
      if (!viewerPlayerId) {
        throw new PlayerNotJoined();
      }
      if (match.hostPlayerId !== viewerPlayerId) {
        throw new NotHost();
      }
      if (players.length < 2) {
        throw new InsufficientPlayers({ minPlayers: 2 });
      }

      transition = buildStartRoundTransition(
        {
          command: input.command,
          roundNumber: 1,
          dealerSeat: match.dealerSeat,
          matchUpdateContext: {
            nextMatchStatus: "in_progress",
            nextCurrentRoundNumber: 1,
          },
        },
        orderedPlayers,
      );
      break;
    }

    case "START_NEXT_ROUND": {
      if (!match || match.status !== "in_progress") {
        throw new InvalidMatchState();
      }
      if (!viewerPlayerId) {
        throw new PlayerNotJoined();
      }

      const nextDealerSeat = (match.dealerSeat + 1) % players.length;
      transition = buildStartRoundTransition(
        {
          command: input.command,
          roundNumber: match.currentRoundNumber + 1,
          dealerSeat: nextDealerSeat,
          matchUpdateContext: {
            nextCurrentRoundNumber: match.currentRoundNumber + 1,
            nextDealerSeat,
          },
        },
        orderedPlayers,
      );
      break;
    }

    case "TAKE_TURN": {
      if (!match || !latestRound || !roundRuntime) {
        throw new MatchNotFound({ matchId: String(input.matchId) });
      }
      if (!viewerPlayerId) {
        throw new PlayerNotJoined();
      }
      if (roundRuntime.activePlayerId !== String(viewerPlayerId)) {
        throw new InvalidTurn();
      }

      const resolved = takeTurnAction(
        orderedPlayers,
        roundRuntime,
        playerStates,
        String(viewerPlayerId),
        input.command.action,
      );
      transition = finalizeIfNeeded({
        command: input.command.type,
        roundWrite: {
          kind: "update",
          roundId: latestRound._id,
          round: resolved.round,
        },
        playerStates: resolved.playerStates,
        events: resolved.events,
        matchUpdateContext: {},
      });
      break;
    }

    case "RESOLVE_ACTION": {
      if (!match || !latestRound || !roundRuntime) {
        throw new MatchNotFound({ matchId: String(input.matchId) });
      }
      if (!viewerPlayerId) {
        throw new PlayerNotJoined();
      }
      if (
        !roundRuntime.pendingAction ||
        roundRuntime.pendingAction.sourcePlayerId !== String(viewerPlayerId)
      ) {
        throw new InvalidAction();
      }

      const resolved = resolvePendingAction(
        orderedPlayers,
        roundRuntime,
        playerStates,
        input.command.targetPlayerId,
      );
      transition = finalizeIfNeeded({
        command: input.command.type,
        roundWrite: {
          kind: "update",
          roundId: latestRound._id,
          round: resolved.round,
        },
        playerStates: resolved.playerStates,
        events: resolved.events,
        matchUpdateContext: {},
      });
      break;
    }
  }

  if (!match) {
    throw new MatchNotFound({ matchId: String(input.matchId) });
  }

  await saveCommandResult(ctx, {
    match,
    players,
    playerIdMap,
    transition,
  });

  const snapshot = await buildLatestMatchSnapshot(ctx, input.matchId, input.sessionId as never);
  if (!snapshot) {
    throw new MatchNotFound({ matchId: String(input.matchId) });
  }

  return snapshot;
}
