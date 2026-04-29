import { describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { expect } from "vitest";

import * as TestConfect from "./TestConfect";
import {
  createStartedMatch,
  createStartedMatchWithOptions,
  requireActiveSessionForSnapshot,
  runCommand,
} from "./helpers";

describe("Confect command runner idempotency", () => {
  it.effect("rejects stale command versions", () =>
    Effect.gen(function* () {
      const { matchId, sessions, started } = yield* createStartedMatch(["Host", "Guest"]);
      const activeSession = requireActiveSessionForSnapshot(
        started,
        sessions,
        "Expected active session for stale command test",
      );

      yield* Effect.exit(
        runCommand(matchId, activeSession.sessionId, {
          type: "TAKE_TURN",
          expectedVersion: started.version - 1,
          idempotencyKey: "runner-stale-version",
          action: "stay",
        }),
      ).pipe(
        Effect.map((exit) => {
          expect(String(exit)).toContain("STALE_GAME_STATE");
        }),
      );
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it.effect("returns the cached snapshot for duplicate idempotency keys", () =>
    Effect.gen(function* () {
      const { matchId, sessions, started } = yield* createStartedMatchWithOptions(
        ["Host", "Guest"],
        {
          deterministicStart: {
            roundSeed: {
              drawPile: [
                { id: "idempotent-open-1", type: "number", label: "1", numberValue: 1 },
                { id: "idempotent-open-2", type: "number", label: "7", numberValue: 7 },
                { id: "idempotent-hit-1", type: "number", label: "4", numberValue: 4 },
              ],
            },
          },
        },
      );
      const activeSession = requireActiveSessionForSnapshot(
        started,
        sessions,
        "Expected active session for idempotency test",
      );

      const command = {
        type: "TAKE_TURN" as const,
        expectedVersion: started.version,
        idempotencyKey: "runner-idempotent-turn",
        action: "hit" as const,
      };
      const first = yield* runCommand(matchId, activeSession.sessionId, command);
      const second = yield* runCommand(matchId, activeSession.sessionId, command);

      expect(second).toEqual(first);
    }).pipe(Effect.provide(TestConfect.layer())),
  );
});
