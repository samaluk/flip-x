import type { Ref } from "@confect/core";
import refs from "@/confect/_generated/refs";
import { Effect, type ParseResult } from "effect";

import { requireSourceSessionForPendingAction } from "./match-session-for-snapshot";
import type { ReplayHarness } from "./scenario-runner";
import type { DeterministicStartOptions } from "./scenario-types";

type TestClient = {
  mutation: <MutationRef extends Ref.AnyMutation>(
    mutationRef: MutationRef,
    args: Ref.Args<MutationRef>,
  ) => Effect.Effect<Ref.Returns<MutationRef>, ParseResult.ParseError>;
  query: <QueryRef extends Ref.AnyQuery>(
    queryRef: QueryRef,
    args: Ref.Args<QueryRef>,
  ) => Effect.Effect<Ref.Returns<QueryRef>, ParseResult.ParseError>;
};

/** Minimal harness for divergence scenarios (no round advancement). */
export function createDivergenceReplayHarness(
  client: TestClient,
  commandMetadata: (expectedVersion: number) => {
    expectedVersion: number;
    idempotencyKey: string;
  },
): ReplayHarness {
  const base = createDeterministicReplayHarness(client, commandMetadata);
  return {
    ...base,
    advanceUntilRoundBoundary: async () => {
      throw new Error("Not needed for this scenario");
    },
    startDeterministicNextRound: async () => {
      throw new Error("Not needed for this scenario");
    },
  };
}

/** Builds the imperative ReplayHarness used by deterministic replay tests (stay-only advance loop). */
export function createDeterministicReplayHarness(
  client: TestClient,
  commandMetadata: (expectedVersion: number) => {
    expectedVersion: number;
    idempotencyKey: string;
  },
): ReplayHarness {
  return {
    createStartedMatch: async (playerNames, options: { deterministicStart?: DeterministicStartOptions }) => {
      const [hostName, ...guestNames] = playerNames;
      const sessions = playerNames.map((name, index) => ({
        name,
        sessionId: `session-${index + 1}`,
      }));
      const created = await Effect.runPromise(
        client.mutation(refs.public.matches.createMatch, {
          hostName,
          sessionId: sessions[0]!.sessionId as never,
        }),
      );
      for (const [index, guestName] of guestNames.entries()) {
        await Effect.runPromise(
          client.mutation(refs.public.matches.joinMatch, {
            matchId: created.matchId,
            playerName: guestName,
            sessionId: sessions[index + 1]!.sessionId as never,
          }),
        );
      }
      const started = await Effect.runPromise(
        client.mutation(refs.public.matches.startMatch, {
          matchId: created.matchId,
          sessionId: sessions[0]!.sessionId as never,
          ...commandMetadata(created.version),
          deterministicStart: options.deterministicStart,
        }),
      );
      return { matchId: created.matchId, sessions, started };
    },
    advanceUntilRoundBoundary: async (matchId, sessions) => {
      for (let guard = 0; guard < 50; guard += 1) {
        let snapshot = null;
        for (const session of sessions) {
          snapshot = await Effect.runPromise(
            client.query(refs.public.matches.getMatchSnapshot, {
              matchId: matchId as never,
              sessionId: session.sessionId as never,
            }),
          );
          if (snapshot) break;
        }
        if (!snapshot) {
          throw new Error("Expected a match snapshot while resolving gameplay");
        }
        if (snapshot.roundStatus === "scoring" || snapshot.roundStatus === "completed") {
          return snapshot;
        }
        if (snapshot.pendingAction) {
          const sourceSession = requireSourceSessionForPendingAction(
            snapshot,
            sessions,
            "Expected a source session for pending action",
          );
          await Effect.runPromise(
            client.mutation(refs.public.turns.resolveAction, {
              matchId: matchId as never,
              targetPlayerId: snapshot.pendingAction.eligibleTargetIds[0]!,
              sessionId: sourceSession.sessionId as never,
              ...commandMetadata(snapshot.version),
            }),
          );
          continue;
        }
        const activeSession = sessions.find(
          (session) =>
            snapshot.activePlayerId ===
            snapshot.players.find((player) => player.displayName === session.name)?.playerId,
        );
        if (!activeSession) {
          throw new Error("Expected an active session while round is in progress");
        }
        await Effect.runPromise(
          client.mutation(refs.public.turns.takeTurn, {
            matchId: matchId as never,
            action: "stay",
            sessionId: activeSession.sessionId as never,
            ...commandMetadata(snapshot.version),
          }),
        );
      }
      throw new Error("Timed out while advancing round state");
    },
    startDeterministicNextRound: async (matchId, sessionId, expectedVersion, deterministicStart) =>
      await Effect.runPromise(
        client.mutation(refs.public.rounds.startNextRound, {
          matchId: matchId as never,
          sessionId: sessionId as never,
          ...commandMetadata(expectedVersion),
          deterministicStart,
        }),
      ),
    takeTurn: async (matchId, sessionId, action, expectedVersion) =>
      await Effect.runPromise(
        client.mutation(refs.public.turns.takeTurn, {
          matchId: matchId as never,
          sessionId: sessionId as never,
          ...commandMetadata(expectedVersion),
          action,
        }),
      ),
    resolveAction: async (matchId, sessionId, targetPlayerId, expectedVersion) =>
      await Effect.runPromise(
        client.mutation(refs.public.turns.resolveAction, {
          matchId: matchId as never,
          sessionId: sessionId as never,
          ...commandMetadata(expectedVersion),
          targetPlayerId: targetPlayerId as never,
        }),
      ),
  };
}
