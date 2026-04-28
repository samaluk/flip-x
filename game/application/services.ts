import { Context, Effect, Layer } from "effect";
import type { SessionId } from "convex-helpers/server/sessions";

import type { Id } from "../../convex/_generated/dataModel";
import type { MutationCtx } from "../../convex/_generated/server";
import type { AppError } from "../../shared/lib/errors/domain";
import { buildLatestMatchSnapshot } from "../infrastructure/snapshot-store";
import { loadMatchAggregate, type MatchAggregate } from "../infrastructure/load-match-aggregate";
import { saveCommandResult, type SaveCommandResultInput } from "../infrastructure/save-command-result";
import type { MatchSnapshot } from "../logic/view-models";
import type { GameCommand } from "./game-command";

type IdempotencyInput = {
  matchId: Id<"matches">;
  command: GameCommand;
  snapshot: MatchSnapshot;
};

export class MatchAggregateStore extends Context.Tag("MatchAggregateStore")<
  MatchAggregateStore,
  {
    load: (matchId: Id<"matches">, sessionId: SessionId) => Effect.Effect<MatchAggregate, AppError>;
  }
>() {}

export class CommandResultStore extends Context.Tag("CommandResultStore")<
  CommandResultStore,
  {
    save: (input: SaveCommandResultInput) => Effect.Effect<void, AppError>;
  }
>() {}

export class MatchSnapshotStore extends Context.Tag("MatchSnapshotStore")<
  MatchSnapshotStore,
  {
    buildLatest: (
      matchId: Id<"matches">,
      sessionId: SessionId,
    ) => Effect.Effect<MatchSnapshot | null, AppError>;
  }
>() {}

export class IdempotencyStore extends Context.Tag("IdempotencyStore")<
  IdempotencyStore,
  {
    get: (
      matchId: Id<"matches">,
      idempotencyKey: string,
      nowMillis: number,
    ) => Effect.Effect<MatchSnapshot | null, AppError>;
    put: (input: IdempotencyInput, nowMillis: number) => Effect.Effect<void, AppError>;
  }
>() {}

export class AppClock extends Context.Tag("AppClock")<
  AppClock,
  {
    nowMillis: Effect.Effect<number>;
  }
>() {}

export type RunGameCommandServices =
  | MatchAggregateStore
  | CommandResultStore
  | MatchSnapshotStore
  | IdempotencyStore
  | AppClock;

export const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000;

export function makeProductionCommandLayer(ctx: MutationCtx): Layer.Layer<RunGameCommandServices> {
  const aggregate = Layer.succeed(MatchAggregateStore, {
    load: (matchId, sessionId) => Effect.promise(() => loadMatchAggregate(ctx, matchId, sessionId)),
  });

  const commandResults = Layer.succeed(CommandResultStore, {
    save: (input) => Effect.promise(() => saveCommandResult(ctx, input)).pipe(Effect.asVoid),
  });

  const snapshots = Layer.succeed(MatchSnapshotStore, {
    buildLatest: (matchId, sessionId) =>
      Effect.promise(() => buildLatestMatchSnapshot(ctx, matchId, sessionId)),
  });

  const idempotency = Layer.succeed(IdempotencyStore, {
    get: (matchId, idempotencyKey, nowMillis) =>
      Effect.promise(async () => {
        const existing = await ctx.db
          .query("idempotencyKeys")
          .withIndex("by_idempotency_key", (query) => query.eq("idempotencyKey", idempotencyKey))
          .first();

        if (!existing || existing.matchId !== matchId) {
          return null;
        }

        if (existing.expiresAt <= nowMillis) {
          await ctx.db.delete(existing._id);
          return null;
        }

        return existing.commandResult;
      }),
    put: ({ matchId, command, snapshot }, nowMillis) =>
      Effect.promise(() =>
        ctx.db.insert("idempotencyKeys", {
          matchId,
          idempotencyKey: command.idempotencyKey,
          commandType: command.type,
          commandResult: snapshot,
          expiresAt: nowMillis + IDEMPOTENCY_TTL_MS,
          createdAt: nowMillis,
        }),
      ).pipe(Effect.asVoid),
  });

  const clock = Layer.succeed(AppClock, {
    nowMillis: Effect.sync(() => Date.now()),
  });

  return Layer.mergeAll(aggregate, commandResults, snapshots, idempotency, clock);
}
