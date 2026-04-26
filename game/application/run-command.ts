import { Effect } from "effect";

import type { MutationCtx } from "../../convex/_generated/server";
import {
  type AppError,
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
import type { GameTransition } from "../infrastructure/save-command-result";
import type { Id } from "../../convex/_generated/dataModel";
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

export type RunGameCommandInput = {
  matchId: Id<"matches">;
  sessionId: string;
  command: GameCommand;
};

export async function runGameCommand(ctx: MutationCtx, input: RunGameCommandInput) {
  return await Effect.runPromise(runGameCommandEffect(ctx, input));
}

export function runGameCommandEffect(
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
      return yield* new MatchNotFound({ matchId: String(input.matchId) });
    }

    if (match.version !== input.command.expectedVersion) {
      return yield* new StaleGameState({
        expectedVersion: input.command.expectedVersion,
        actualVersion: match.version,
      });
    }

    let transition: GameTransition;

    switch (input.command.type) {
      case "START_MATCH": {
        if (match.status !== "setup") {
          return yield* new InvalidMatchState();
        }
        if (!viewerPlayerId) {
          return yield* new PlayerNotJoined();
        }
        if (match.hostPlayerId !== viewerPlayerId) {
          return yield* new NotHost();
        }
        if (players.length < 2) {
          return yield* new InsufficientPlayers({ minPlayers: 2 });
        }

        transition = buildStartRoundTransition(
          {
            command: input.command,
            roundNumber: 1,
            dealerSeat: match.dealerSeat,
            nowMillis,
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
          return yield* new InvalidMatchState();
        }
        if (!viewerPlayerId) {
          return yield* new PlayerNotJoined();
        }

        const nextDealerSeat = (match.dealerSeat + 1) % players.length;
        transition = buildStartRoundTransition(
          {
            command: input.command,
            roundNumber: match.currentRoundNumber + 1,
            dealerSeat: nextDealerSeat,
            nowMillis,
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
          return yield* new MatchNotFound({ matchId: String(input.matchId) });
        }
        if (!viewerPlayerId) {
          return yield* new PlayerNotJoined();
        }
        if (roundRuntime.activePlayerId !== String(viewerPlayerId)) {
          return yield* new InvalidTurn();
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
          return yield* new MatchNotFound({ matchId: String(input.matchId) });
        }
        if (!viewerPlayerId) {
          return yield* new PlayerNotJoined();
        }
        if (
          !roundRuntime.pendingAction ||
          roundRuntime.pendingAction.sourcePlayerId !== String(viewerPlayerId)
        ) {
          return yield* new InvalidAction();
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

    yield* commandResultStore.save({
      match,
      players,
      playerIdMap,
      transition,
      nowMillis,
    });

    const snapshot = yield* snapshotStore.buildLatest(input.matchId, input.sessionId);
    if (!snapshot) {
      return yield* new MatchNotFound({ matchId: String(input.matchId) });
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
