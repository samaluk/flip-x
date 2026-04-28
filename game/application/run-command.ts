import { Effect } from "effect";
import type { SessionId } from "convex-helpers/server/sessions";

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

type RunGameCommandInput = {
  matchId: Id<"matches">;
  sessionId: SessionId;
  command: GameCommand;
};

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

    let transition: GameTransition;

    switch (input.command.type) {
      case "START_MATCH": {
        if (match.status !== "setup") {
          return yield* invalidMatchState();
        }
        if (!viewerPlayerId) {
          return yield* playerNotJoined();
        }
        if (match.hostPlayerId !== viewerPlayerId) {
          return yield* notHost();
        }
        if (players.length < 2) {
          return yield* insufficientPlayers({ minPlayers: 2 });
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
          return yield* invalidMatchState();
        }
        if (!viewerPlayerId) {
          return yield* playerNotJoined();
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
          return yield* matchNotFound({ matchId: String(input.matchId) });
        }
        if (!viewerPlayerId) {
          return yield* playerNotJoined();
        }
        if (roundRuntime.activePlayerId !== String(viewerPlayerId)) {
          return yield* invalidTurn();
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
          return yield* matchNotFound({ matchId: String(input.matchId) });
        }
        if (!viewerPlayerId) {
          return yield* playerNotJoined();
        }
        if (
          !roundRuntime.pendingAction ||
          roundRuntime.pendingAction.sourcePlayerId !== String(viewerPlayerId)
        ) {
          return yield* invalidAction();
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
