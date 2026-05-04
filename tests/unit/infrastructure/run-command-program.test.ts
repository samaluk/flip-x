import { Cause, Effect, Exit, Layer } from "effect";
import { describe, expect, it } from "vitest";

import { runGameCommandProgram } from "@/game/application/run-command";
import {
  AppClock,
  CommandResultStore,
  IdempotencyStore,
  MatchAggregateStore,
  MatchSnapshotStore,
  type RunGameCommandServices,
} from "@/game/application/services";
import { MatchNotFound, StaleGameState } from "@/shared/lib/errors/domain";
import type { Id } from "@/convex/_generated/dataModel";

type RunGameCommandInput = Parameters<typeof runGameCommandProgram>[0];

type TestCachedSnapshot = {
  matchId: string;
  status: string;
  version: number;
};

const matchId = "match-1" as Id<"matches">;

const snapshot: TestCachedSnapshot = {
  matchId: "match-1",
  status: "setup",
  version: 1,
};

const input: RunGameCommandInput = {
  matchId,
  sessionId: "session-1",
  command: {
    type: "START_MATCH",
    expectedVersion: 1,
    idempotencyKey: "key-1",
  },
};

function makeLayer(overrides: {
  load?: () => Effect.Effect<unknown>;
  cached?: TestCachedSnapshot | null;
  match?: Record<string, unknown> | null;
  onSave?: (input: unknown) => void;
  onPut?: (input: unknown, nowMillis: number) => void;
  builtSnapshot?: TestCachedSnapshot | null;
  nowMillis?: number;
}) {
  const aggregate = Layer.succeed(MatchAggregateStore, {
    load: overrides.load
      ? () => overrides.load!() as never
      : () =>
          Effect.succeed({
            match: overrides.match ?? null,
            players: [],
            orderedPlayers: [],
            playerIdMap: new Map(),
            viewerPlayerId: null,
            latestRound: null,
            roundRuntime: null,
            roundPlayerStateDocs: [],
            playerStates: {},
          } as never),
  });

  const commandResults = Layer.succeed(CommandResultStore, {
    save: (value) => Effect.sync(() => overrides.onSave?.(value)),
  });

  const snapshots = Layer.succeed(MatchSnapshotStore, {
    buildLatest: () => Effect.succeed(overrides.builtSnapshot ?? snapshot),
  });

  const idempotency = Layer.succeed(IdempotencyStore, {
    get: () => Effect.succeed(overrides.cached ?? null),
    put: (value, nowMillis) => Effect.sync(() => overrides.onPut?.(value, nowMillis)),
  });

  const clock = Layer.succeed(AppClock, {
    nowMillis: Effect.succeed(overrides.nowMillis ?? 1234),
  });

  return Layer.mergeAll(
    aggregate,
    commandResults,
    snapshots,
    idempotency,
    clock,
  ) as Layer.Layer<RunGameCommandServices>;
}

describe("runGameCommandProgram", () => {
  it("returns cached idempotent result without loading aggregate", async () => {
    const exit = await Effect.runPromiseExit(
      runGameCommandProgram(input).pipe(
        Effect.provide(
          makeLayer({
            cached: snapshot,
            load: () => Effect.die("aggregate should not load"),
          }),
        ),
      ),
    );

    expect(Exit.isSuccess(exit)).toBe(true);
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toBe(snapshot);
    }
  });

  it("fails with MatchNotFound when aggregate has no match", async () => {
    const exit = await Effect.runPromiseExit(
      runGameCommandProgram(input).pipe(Effect.provide(makeLayer({ match: null }))),
    );

    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      expect(Cause.failureOption(exit.cause).pipe((option) => option._tag)).toBe("Some");
      expect(Cause.squash(exit.cause)).toBeInstanceOf(MatchNotFound);
    }
  });

  it("fails with StaleGameState on version mismatch", async () => {
    const exit = await Effect.runPromiseExit(
      runGameCommandProgram(input).pipe(
        Effect.provide(
          makeLayer({
            match: {
              _id: matchId,
              status: "setup",
              version: 2,
            },
          }),
        ),
      ),
    );

    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      expect(Cause.squash(exit.cause)).toBeInstanceOf(StaleGameState);
    }
  });

  it("saves transition, rebuilds snapshot, and stores idempotent result on success", async () => {
    const saved: unknown[] = [];
    const stored: Array<{ value: unknown; nowMillis: number }> = [];
    const successInput: RunGameCommandInput = {
      ...input,
      command: {
        type: "START_MATCH",
        expectedVersion: 1,
        idempotencyKey: "success-key",
        deterministicStart: {
          roundSeed: {
            drawPile: [],
          },
        },
      },
    };
    const match = {
      _id: matchId,
      status: "setup",
      version: 1,
      hostPlayerId: "p1",
      dealerSeat: 0,
      currentRoundNumber: 0,
    };
    const players = [
      { _id: "p1", seatIndex: 0, totalScore: 0 },
      { _id: "p2", seatIndex: 1, totalScore: 0 },
    ];

    const layer = makeLayer({
      nowMillis: 999,
      load: () =>
        Effect.succeed({
          match,
          players,
          orderedPlayers: [
            { playerId: "p1", seatIndex: 0 },
            { playerId: "p2", seatIndex: 1 },
          ],
          playerIdMap: new Map([
            ["p1", "p1"],
            ["p2", "p2"],
          ]),
          viewerPlayerId: "p1",
          latestRound: null,
          roundRuntime: null,
          roundPlayerStateDocs: [],
          playerStates: {},
        }),
      onSave: (value) => saved.push(value),
      onPut: (value, nowMillis) => stored.push({ value, nowMillis }),
    });

    const exit = await Effect.runPromiseExit(
      runGameCommandProgram(successInput).pipe(Effect.provide(layer)),
    );

    expect(Exit.isSuccess(exit)).toBe(true);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      nowMillis: 999,
      transition: {
        command: "START_MATCH",
        roundWrite: {
          kind: "create",
          startedAt: 999,
        },
      },
    });
    expect(stored).toEqual([
      {
        value: {
          matchId,
          command: successInput.command,
          snapshot,
        },
        nowMillis: 999,
      },
    ]);
  });
});
