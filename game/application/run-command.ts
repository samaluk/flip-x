import { Effect } from "effect";
import type { SessionId } from "convex-helpers/server/sessions";

import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { MutationCtx } from "../../convex/_generated/server";
import {
  type AppError,
  insufficientPlayers,
  invalidAction,
  invalidMatchState,
  invalidTurn,
  matchNotFound,
  notHost,
  playerNotJoined,
  staleGameState,
} from "../../shared/lib/errors/domain";
import {
  continueRound,
  createPlayerRoundStates,
  createRoundRuntime,
  resolvePendingAction,
  takeTurnAction,
} from "../logic/command-handler";
import { finalizeRound } from "../logic/round-finalization";
import type { MatchAggregate } from "../infrastructure/load-match-aggregate";
import type { RoundRuntime } from "../logic/round-state";
import type { GameCommand } from "./game-command";
import type { MatchSnapshot } from "../logic/view-models";
import type { GameTransition } from "../infrastructure/save-command-result";
import {
  AppClock,
  CommandResultStore,
  IdempotencyStore,
  makeProductionCommandLayer,
  MatchAggregateStore,
  MatchSnapshotStore,
  type RunGameCommandServices,
} from "./services";

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
    nowMillis: number;
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
      startedAt: input.nowMillis,
      round: resolved.round,
    },
    playerStates: resolved.playerStates,
    events: resolved.events,
    matchUpdateContext: input.matchUpdateContext,
  });
}

type RunGameCommandInput = {
  matchId: Id<"matches">;
  sessionId: SessionId;
  command: GameCommand;
};

type CommandHandlerContext = Pick<
  MatchAggregate,
  | "latestRound"
  | "orderedPlayers"
  | "playerIdMap"
  | "playerStates"
  | "players"
  | "roundRuntime"
  | "viewerPlayerId"
> & {
  match: Doc<"matches">;
};

function handleStartMatchCommand(
  ctx: CommandHandlerContext,
  command: Extract<GameCommand, { type: "START_MATCH" }>,
  nowMillis: number,
): Effect.Effect<GameTransition, AppError> {
  return Effect.gen(function* () {
    if (ctx.match.status !== "setup") {
      return yield* invalidMatchState();
    }
    if (!ctx.viewerPlayerId) {
      return yield* playerNotJoined();
    }
    if (ctx.match.hostPlayerId !== ctx.viewerPlayerId) {
      return yield* notHost();
    }
    if (ctx.players.length < 2) {
      return yield* insufficientPlayers({ minPlayers: 2 });
    }

    return buildStartRoundTransition(
      {
        command,
        roundNumber: 1,
        dealerSeat: ctx.match.dealerSeat,
        nowMillis,
        matchUpdateContext: {
          nextMatchStatus: "in_progress",
          nextCurrentRoundNumber: 1,
        },
      },
      ctx.orderedPlayers,
    );
  });
}

function handleStartNextRoundCommand(
  ctx: CommandHandlerContext,
  command: Extract<GameCommand, { type: "START_NEXT_ROUND" }>,
  nowMillis: number,
): Effect.Effect<GameTransition, AppError> {
  return Effect.gen(function* () {
    if (ctx.match.status !== "in_progress") {
      return yield* invalidMatchState();
    }
    if (!ctx.viewerPlayerId) {
      return yield* playerNotJoined();
    }

    const nextDealerSeat = (ctx.match.dealerSeat + 1) % ctx.players.length;
    return buildStartRoundTransition(
      {
        command,
        roundNumber: ctx.match.currentRoundNumber + 1,
        dealerSeat: nextDealerSeat,
        nowMillis,
        matchUpdateContext: {
          nextCurrentRoundNumber: ctx.match.currentRoundNumber + 1,
          nextDealerSeat,
        },
      },
      ctx.orderedPlayers,
    );
  });
}

type ActiveRoundViewer = {
  latestRound: Doc<"rounds">;
  roundRuntime: RoundRuntime;
  viewerPlayerId: Id<"players">;
};

function requireActiveRoundAndViewer(
  ctx: CommandHandlerContext,
  matchId: Id<"matches">,
): Effect.Effect<ActiveRoundViewer, AppError> {
  return Effect.gen(function* () {
    if (!ctx.latestRound || !ctx.roundRuntime) {
      return yield* matchNotFound({ matchId: String(matchId) });
    }
    if (!ctx.viewerPlayerId) {
      return yield* playerNotJoined();
    }
    return {
      latestRound: ctx.latestRound,
      roundRuntime: ctx.roundRuntime,
      viewerPlayerId: ctx.viewerPlayerId,
    };
  });
}

function handleTakeTurnCommand(
  ctx: CommandHandlerContext,
  matchId: Id<"matches">,
  command: Extract<GameCommand, { type: "TAKE_TURN" }>,
): Effect.Effect<GameTransition, AppError> {
  return Effect.gen(function* () {
    const { latestRound, roundRuntime, viewerPlayerId } = yield* requireActiveRoundAndViewer(
      ctx,
      matchId,
    );
    if (roundRuntime.activePlayerId !== String(viewerPlayerId)) {
      return yield* invalidTurn();
    }

    const resolved = takeTurnAction(
      ctx.orderedPlayers,
      roundRuntime,
      ctx.playerStates,
      String(viewerPlayerId),
      command.action,
    );
    return finalizeIfNeeded({
      command: command.type,
      roundWrite: {
        kind: "update",
        roundId: latestRound._id,
        round: resolved.round,
      },
      playerStates: resolved.playerStates,
      events: resolved.events,
      matchUpdateContext: {},
    });
  });
}

function handleResolveActionCommand(
  ctx: CommandHandlerContext,
  matchId: Id<"matches">,
  command: Extract<GameCommand, { type: "RESOLVE_ACTION" }>,
): Effect.Effect<GameTransition, AppError> {
  return Effect.gen(function* () {
    const { latestRound, roundRuntime, viewerPlayerId } = yield* requireActiveRoundAndViewer(
      ctx,
      matchId,
    );
    if (
      !roundRuntime.pendingAction ||
      roundRuntime.pendingAction.sourcePlayerId !== String(viewerPlayerId)
    ) {
      return yield* invalidAction();
    }

    const resolved = resolvePendingAction(
      ctx.orderedPlayers,
      roundRuntime,
      ctx.playerStates,
      command.targetPlayerId,
    );
    return finalizeIfNeeded({
      command: command.type,
      roundWrite: {
        kind: "update",
        roundId: latestRound._id,
        round: resolved.round,
      },
      playerStates: resolved.playerStates,
      events: resolved.events,
      matchUpdateContext: {},
    });
  });
}

function resolveCommandToTransition(
  input: RunGameCommandInput,
  nowMillis: number,
  ctx: CommandHandlerContext,
): Effect.Effect<GameTransition, AppError> {
  const cmd = input.command;
  switch (cmd.type) {
    case "START_MATCH":
      return handleStartMatchCommand(ctx, cmd, nowMillis);
    case "START_NEXT_ROUND":
      return handleStartNextRoundCommand(ctx, cmd, nowMillis);
    case "TAKE_TURN":
      return handleTakeTurnCommand(ctx, input.matchId, cmd);
    case "RESOLVE_ACTION":
      return handleResolveActionCommand(ctx, input.matchId, cmd);
  }
}

export function runGameCommand(
  ctx: MutationCtx,
  input: RunGameCommandInput,
): Effect.Effect<MatchSnapshot, AppError> {
  return runGameCommandProgram(input).pipe(Effect.provide(makeProductionCommandLayer(ctx)));
}

export function runGameCommandProgram(
  input: RunGameCommandInput,
): Effect.Effect<MatchSnapshot, AppError, RunGameCommandServices> {
  return Effect.gen(function* () {
    const aggregateStore = yield* MatchAggregateStore;
    const commandResultStore = yield* CommandResultStore;
    const snapshotStore = yield* MatchSnapshotStore;
    const idempotencyStore = yield* IdempotencyStore;
    const clock = yield* AppClock;
    const nowMillis = yield* clock.nowMillis;

    const idempotentResult = yield* idempotencyStore.get(
      input.matchId,
      input.command.idempotencyKey,
      nowMillis,
    );
    if (idempotentResult) {
      return idempotentResult;
    }

    const aggregate = yield* aggregateStore.load(input.matchId, input.sessionId);
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
      return yield* matchNotFound({ matchId: String(input.matchId) });
    }

    if (match.version !== input.command.expectedVersion) {
      return yield* staleGameState({
        expectedVersion: input.command.expectedVersion,
        actualVersion: match.version,
      });
    }

    const transition = yield* resolveCommandToTransition(input, nowMillis, {
      latestRound,
      match,
      orderedPlayers,
      playerIdMap,
      playerStates,
      players,
      roundRuntime,
      viewerPlayerId,
    });

    yield* commandResultStore.save({
      match,
      players,
      playerIdMap,
      transition,
      nowMillis,
    });

    const snapshot = yield* snapshotStore.buildLatest(input.matchId, input.sessionId);
    if (!snapshot) {
      return yield* matchNotFound({ matchId: String(input.matchId) });
    }

    yield* idempotencyStore.put(
      {
        matchId: input.matchId,
        command: input.command,
        snapshot,
      },
      nowMillis,
    );

    return snapshot;
  });
}
