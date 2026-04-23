import { describe, it } from "@effect/vitest";
import { assertEquals } from "@effect/vitest/utils";
import { Cause, Effect, Exit } from "effect";

import refs from "@/confect/_generated/refs";

import * as TestConfect from "./TestConfect";

describe("Confect matches", () => {
  it.effect("creates a match and reads it back through refs", () =>
    Effect.gen(function* () {
      const client = yield* TestConfect.TestConfect;

      const created = yield* client.mutation(refs.public.matches.createMatch, {
        hostName: "Host",
        hostColorId: "cyan",
        sessionId: "session-host",
      });

      assertEquals(created.status, "setup");
      assertEquals(created.players.length, 1);
      assertEquals(created.players[0]?.displayName, "Host");
      assertEquals(created.players[0]?.colorId, "cyan");

      const lookup = yield* client.query(refs.public.matches.getMatchByCode, {
        lobbyCode: created.lobbyCode,
      });

      assertEquals(lookup?.matchId, created.matchId);
      assertEquals(lookup?.status, "setup");
      assertEquals(JSON.stringify(lookup?.usedColorIds), JSON.stringify(["cyan"]));
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it.effect("joins an existing match and updates the guest snapshot", () =>
    Effect.gen(function* () {
      const client = yield* TestConfect.TestConfect;

      const created = yield* client.mutation(refs.public.matches.createMatch, {
        hostName: "Host",
        hostColorId: "cyan",
        sessionId: "session-host",
      });

      const joined = yield* client.mutation(refs.public.matches.joinMatch, {
        matchId: created.matchId,
        playerName: "Guest",
        playerColorId: "rose",
        sessionId: "session-guest",
      });

      assertEquals(joined.players.length, 2);
      assertEquals(joined.players[1]?.displayName, "Guest");
      assertEquals(joined.players[1]?.colorId, "rose");
      assertEquals(joined.viewerPlayerId, joined.players[1]?.playerId ?? null);
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it.effect("rejects a color already used by another player", () =>
    Effect.gen(function* () {
      const client = yield* TestConfect.TestConfect;

      const created = yield* client.mutation(refs.public.matches.createMatch, {
        hostName: "Host",
        hostColorId: "cyan",
        sessionId: "session-host",
      });

      const exit = yield* client
        .mutation(refs.public.matches.joinMatch, {
          matchId: created.matchId,
          playerName: "Guest",
          playerColorId: "cyan",
          sessionId: "session-guest",
        })
        .pipe(Effect.exit);

      if (Exit.isSuccess(exit)) {
        throw new Error("Expected joining with a taken color to fail");
      }

      assertEquals(Cause.pretty(exit.cause).includes("PlayerColorAlreadyTaken"), true);
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it.effect("starts a match and creates the first round snapshot", () =>
    Effect.gen(function* () {
      const client = yield* TestConfect.TestConfect;

      const created = yield* client.mutation(refs.public.matches.createMatch, {
        hostName: "Host",
        sessionId: "session-host",
      });

      yield* client.mutation(refs.public.matches.joinMatch, {
        matchId: created.matchId,
        playerName: "Guest",
        sessionId: "session-guest",
      });

      const started = yield* client.mutation(refs.public.matches.startMatch, {
        matchId: created.matchId,
        sessionId: "session-host",
      });

      assertEquals(started.status, "in_progress");
      assertEquals(started.currentRoundNumber, 1);
      assertEquals(started.players.length, 2);
      if (!started.roundStatus) {
        throw new Error("Expected round status after starting match");
      }
      if (!started.latestEvent) {
        throw new Error("Expected latest event after starting match");
      }
    }).pipe(Effect.provide(TestConfect.layer())),
  );
});
