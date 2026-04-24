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
  StaleGameState,
} from "../../shared/lib/errors/domain";
import {
  continueRound,
  createPlayerRoundStates,
  createRoundRuntime,
  resolvePendingAction,
  takeTurnAction,
} from "../logic/command-handler";
import { finalizeRound } from "../logic/round-finalization";
import type { GameCommand } from "./game-command";
import type { MatchSnapshot } from "../logic/view-models";
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

const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000;

async function getIdempotentResult(
  ctx: MutationCtx,
  matchId: Id<"matches">,
  idempotencyKey: string,
) {
  const existing = await ctx.db
    .query("idempotencyKeys")
    .withIndex("by_idempotency_key", (query) => query.eq("idempotencyKey", idempotencyKey))
    .first();

  if (!existing) {
    return null;
  }

  if (existing.matchId !== matchId) {
    return null;
  }

  if (existing.expiresAt <= Date.now()) {
    await ctx.db.delete(existing._id);
    return null;
  }

  return existing.commandResult as MatchSnapshot;
}

async function storeIdempotentResult(
  ctx: MutationCtx,
  matchId: Id<"matches">,
  command: GameCommand,
  snapshot: MatchSnapshot,
) {
  await ctx.db.insert("idempotencyKeys", {
    matchId,
    idempotencyKey: command.idempotencyKey,
    commandType: command.type,
    commandResult: snapshot,
    expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
    createdAt: Date.now(),
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
  const idempotentResult = await getIdempotentResult(
    ctx,
    input.matchId,
    input.command.idempotencyKey,
  );
  if (idempotentResult) {
    return idempotentResult;
  }

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

  if (!match) {
    throw new MatchNotFound({ matchId: String(input.matchId) });
  }

  if (match.version !== input.command.expectedVersion) {
    throw new StaleGameState({
      expectedVersion: input.command.expectedVersion,
      actualVersion: match.version,
    });
  }

  let transition: GameTransition;

  switch (input.command.type) {
    case "START_MATCH": {
      if (match.status !== "setup") {
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
      if (match.status !== "in_progress") {
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
      if (!latestRound || !roundRuntime) {
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
      if (!latestRound || !roundRuntime) {
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

  await storeIdempotentResult(ctx, input.matchId, input.command, snapshot);

  return snapshot;
}
