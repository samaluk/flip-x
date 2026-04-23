import { describe, it } from "@effect/vitest";
import { assertEquals, assertTrue } from "@effect/vitest/utils";
import { Effect, Schema } from "effect";
import { expect } from "vitest";

import refs from "@/confect/_generated/refs";
import { MatchSnapshot } from "@/confect/match-snapshot-schema";
import { MutationCtx } from "@/confect/_generated/services";
import { runGameCommand } from "@/game/application/run-command";
import { cloneSetupScenario } from "@/tests/fixtures/deterministic/setup-scenarios";
import type { DeterministicStartOptions } from "@/tests/fixtures/deterministic";

import * as TestConfect from "./TestConfect";
import {
  createStartedMatch,
  createStartedMatchWithOptions,
  getSnapshotForAnySession,
  type SessionRecord,
} from "./helpers";

function runCommand(
  matchId: string,
  sessionId: SessionRecord["sessionId"],
  command: Parameters<typeof runGameCommand>[1]["command"],
) {
  return Effect.gen(function* () {
    const client = yield* TestConfect.TestConfect;
    return yield* client.run(
      Effect.gen(function* () {
        const ctx = (yield* MutationCtx) as unknown as Parameters<typeof runGameCommand>[0];
        return yield* Effect.promise(() =>
          runGameCommand(ctx, {
            matchId: matchId as never,
            sessionId,
            command,
          }),
        );
      }),
      MatchSnapshot,
    );
  });
}

function readRoundState(matchId: string) {
  const RoundStateSummary = Schema.Struct({
    eventTypes: Schema.Array(Schema.String),
    scoreBreakdownCount: Schema.Number,
    matchStatus: Schema.String,
    winnerPlayerId: Schema.NullOr(Schema.String),
    players: Schema.Array(
      Schema.Struct({
        playerId: Schema.String,
        displayName: Schema.String,
        totalScore: Schema.Number,
        hasWon: Schema.Boolean,
      }),
    ),
  });

  return Effect.gen(function* () {
    const client = yield* TestConfect.TestConfect;
    return yield* client.run(
      Effect.gen(function* () {
        const ctx = (yield* MutationCtx) as unknown as Parameters<typeof runGameCommand>[0];
        const round = yield* Effect.promise(() =>
          ctx.db
            .query("rounds")
            .withIndex("by_match", (query) => query.eq("matchId", matchId as never))
            .order("desc")
            .first(),
        );

        const events = round
          ? yield* Effect.promise(() =>
              ctx.db
                .query("roundEvents")
                .withIndex("by_round", (query) => query.eq("roundId", round._id))
                .collect(),
            )
          : [];
        const scoreBreakdowns = round
          ? yield* Effect.promise(() =>
              ctx.db
                .query("scoreBreakdowns")
                .withIndex("by_round", (query) => query.eq("roundId", round._id))
                .collect(),
            )
          : [];
        const match = yield* Effect.promise(() => ctx.db.get(matchId as never));
        const players = yield* Effect.promise(() =>
          ctx.db
            .query("players")
            .withIndex("by_match", (query) => query.eq("matchId", matchId as never))
            .collect(),
        );

        return {
          eventTypes: events.map((event) => event.eventType),
          scoreBreakdownCount: scoreBreakdowns.length,
          matchStatus: match?.status ?? "missing",
          winnerPlayerId: match?.winnerPlayerId ? String(match.winnerPlayerId) : null,
          players: players
            .toSorted((left, right) => left.seatIndex - right.seatIndex)
            .map((player) => ({
              playerId: String(player._id),
              displayName: player.displayName,
              totalScore: player.totalScore,
              hasWon: player.hasWon,
            })),
        };
      }),
      RoundStateSummary,
    );
  });
}

describe("runGameCommand", () => {
  it.effect("START_MATCH with deterministic draw pile matches the existing opening snapshot", () =>
    Effect.gen(function* () {
      const client = yield* TestConfect.TestConfect;
      const scenario = cloneSetupScenario();
      const sessions = scenario.playerNames.map((name, index) => ({
        name,
        sessionId: `runner-start-${index}` as SessionRecord["sessionId"],
      }));

      const directCreated = yield* client.mutation(refs.public.matches.createMatch, {
        hostName: scenario.playerNames[0],
        sessionId: sessions[0]!.sessionId,
      });

      for (const [index, guestName] of scenario.playerNames.slice(1).entries()) {
        yield* client.mutation(refs.public.matches.joinMatch, {
          matchId: directCreated.matchId,
          playerName: guestName,
          sessionId: sessions[index + 1]!.sessionId,
        });
      }

      const directSnapshot = yield* runCommand(directCreated.matchId, sessions[0]!.sessionId, {
        type: "START_MATCH",
        deterministicStart: scenario.startMatch,
      });
      const openingValues = directSnapshot.players
        .flatMap((player) => player.numberCards.map((card) => card.numberValue))
        .toSorted((left, right) => left - right);

      assertEquals(directSnapshot.status, "in_progress");
      assertEquals(directSnapshot.currentRoundNumber, 1);
      assertTrue(directSnapshot.latestEvent !== null);
      expect(openingValues.slice(0, 2)).toEqual([1, 7]);
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it.effect("TAKE_TURN persists the updated round state and appended event", () =>
    Effect.gen(function* () {
      const deterministicStart: DeterministicStartOptions = {
        roundSeed: {
          drawPile: [
            { id: "runner-open-1", type: "number", label: "1", numberValue: 1 },
            { id: "runner-open-2", type: "number", label: "7", numberValue: 7 },
            { id: "runner-hit-1", type: "number", label: "4", numberValue: 4 },
          ],
        },
      };
      const { matchId, sessions } = yield* createStartedMatchWithOptions(["Host", "Guest"], {
        deterministicStart,
      });
      const snapshot = yield* getSnapshotForAnySession(matchId, sessions);

      if (!snapshot) {
        throw new Error("Expected snapshot before TAKE_TURN");
      }

      const activeSession = sessions.find(
        (session) =>
          snapshot.activePlayerId ===
          snapshot.players.find((player) => player.displayName === session.name)?.playerId,
      );

      if (!activeSession) {
        throw new Error("Expected an active session before TAKE_TURN");
      }

      const updated = yield* runCommand(matchId, activeSession.sessionId, {
        type: "TAKE_TURN",
        action: "hit",
      });
      const roundState = yield* readRoundState(matchId);

      assertEquals(updated.currentRoundNumber, 1);
      assertTrue(roundState.eventTypes.length > 0);
      assertEquals(updated.latestEvent?.type, roundState.eventTypes.at(-1) ?? null);
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it.effect("RESOLVE_ACTION updates pending-action state through the runner seam", () =>
    Effect.gen(function* () {
      const deterministicStart: DeterministicStartOptions = {
        roundSeed: {
          drawPile: [
            { id: "resolve-open-1", type: "number", label: "1", numberValue: 1 },
            { id: "resolve-open-2", type: "number", label: "2", numberValue: 2 },
            { id: "resolve-open-3", type: "number", label: "3", numberValue: 3 },
            { id: "resolve-freeze-1", type: "action", label: "freeze", actionKind: "freeze" },
          ],
        },
      };
      const { matchId, sessions } = yield* createStartedMatchWithOptions(
        ["Host", "Guest", "Third"],
        { deterministicStart },
      );

      const startingSnapshot = yield* getSnapshotForAnySession(matchId, sessions);

      if (!startingSnapshot) {
        throw new Error("Expected a snapshot before TAKE_TURN");
      }

      const activeSession = sessions.find(
        (session) =>
          startingSnapshot.activePlayerId ===
          startingSnapshot.players.find((player) => player.displayName === session.name)?.playerId,
      );

      if (!activeSession) {
        throw new Error("Expected an active session before TAKE_TURN");
      }

      const snapshot = yield* runCommand(matchId, activeSession.sessionId, {
        type: "TAKE_TURN",
        action: "hit",
      });

      if (!snapshot.pendingAction) {
        throw new Error("Expected a pending action before RESOLVE_ACTION");
      }

      const sourceSession = sessions.find(
        (session) =>
          snapshot.pendingAction?.sourcePlayerId ===
          snapshot.players.find((player) => player.displayName === session.name)?.playerId,
      );

      if (!sourceSession) {
        throw new Error("Expected a source session for RESOLVE_ACTION");
      }

      const updated = yield* runCommand(matchId, sourceSession.sessionId, {
        type: "RESOLVE_ACTION",
        targetPlayerId: snapshot.pendingAction.eligibleTargetIds[0]!,
      });

      assertEquals(updated.pendingAction, null);
      assertTrue(updated.latestEvent !== null);
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it.effect("finalization rewrites score breakdowns, carries totals, and marks the winner", () =>
    Effect.gen(function* () {
      const client = yield* TestConfect.TestConfect;
      const { matchId, sessions } = yield* createStartedMatch(["Host", "Guest"]);

      yield* client.run(
        Effect.gen(function* () {
          const ctx = (yield* MutationCtx) as unknown as Parameters<typeof runGameCommand>[0];
          yield* Effect.promise(() => ctx.db.patch(matchId as never, { targetScore: 0 }));
        }),
        Schema.Void,
      );

      let snapshot = yield* getSnapshotForAnySession(matchId, sessions);
      if (!snapshot) {
        throw new Error("Expected snapshot before finalization");
      }

      let finalSnapshot = snapshot;
      let guard = 0;

      while (guard < 50 && finalSnapshot.roundStatus !== "completed") {
        guard += 1;

        if (finalSnapshot.pendingAction) {
          const sourceSession = sessions.find(
            (session) =>
              finalSnapshot.pendingAction?.sourcePlayerId ===
              finalSnapshot.players.find((player) => player.displayName === session.name)?.playerId,
          );

          if (!sourceSession) {
            throw new Error("Expected a source session while completing the round");
          }

          finalSnapshot = yield* runCommand(matchId, sourceSession.sessionId, {
            type: "RESOLVE_ACTION",
            targetPlayerId: finalSnapshot.pendingAction.eligibleTargetIds[0]!,
          });
          continue;
        }

        const activeSession = sessions.find(
          (session) =>
            finalSnapshot.activePlayerId ===
            finalSnapshot.players.find((player) => player.displayName === session.name)?.playerId,
        );

        if (!activeSession) {
          break;
        }

        finalSnapshot = yield* runCommand(matchId, activeSession.sessionId, {
          type: "TAKE_TURN",
          action: "stay",
        });
      }

      const roundState = yield* readRoundState(matchId);
      const winningPlayers = roundState.players.filter((player) => player.hasWon);

      assertEquals(finalSnapshot.status, "completed");
      assertEquals(roundState.matchStatus, "completed");
      assertEquals(roundState.scoreBreakdownCount, roundState.players.length);
      assertTrue(roundState.players.every((player) => player.totalScore >= 0));
      assertEquals(winningPlayers.length, 1);
      assertEquals(roundState.winnerPlayerId, winningPlayers[0]?.playerId ?? null);
    }).pipe(Effect.provide(TestConfect.layer())),
  );
});
