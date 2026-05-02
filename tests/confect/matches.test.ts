import { describe, it } from "@effect/vitest";
import { assertEquals } from "@effect/vitest/utils";
import { Cause, Effect, Exit } from "effect";

import refs from "@/confect/_generated/refs";

import * as TestConfect from "./TestConfect";

function createHostMatch() {
  return Effect.gen(function* () {
    const client = yield* TestConfect.TestConfect;
    return yield* client.mutation(refs.public.matches.createMatch, {
      hostName: "Host",
      sessionId: "session-host",
    });
  });
}

function createTwoPlayerMatch() {
  return Effect.gen(function* () {
    const client = yield* TestConfect.TestConfect;
    const created = yield* createHostMatch();

    yield* client.mutation(refs.public.matches.joinMatch, {
      matchId: created.matchId,
      playerName: "Guest",
      sessionId: "session-guest",
    });

    return created;
  });
}

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

      const created = yield* createTwoPlayerMatch();

      const started = yield* client.mutation(refs.public.matches.startMatch, {
        matchId: created.matchId,
        sessionId: "session-host",
        expectedVersion: created.version,
        idempotencyKey: "matches-start-match",
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

  it.effect("lets the host update setup settings and publishes them in snapshots", () =>
    Effect.gen(function* () {
      const client = yield* TestConfect.TestConfect;

      const created = yield* createTwoPlayerMatch();

      const updated = yield* client.mutation(refs.public.matches.updateMatchSettings, {
        matchId: created.matchId,
        sessionId: "session-host",
        expectedVersion: created.version,
        patch: {
          targetScore: 250,
          maxNumberCardValue: 14,
        },
      });

      assertEquals(updated.version, created.version + 1);
      assertEquals(updated.targetScore, 250);
      assertEquals(updated.settings.targetScore, 250);
      assertEquals(updated.settings.maxNumberCardValue, 14);
      assertEquals(updated.settings.modifierRange.max, 12);

      const guestSnapshot = yield* client.query(refs.public.matches.getMatchSnapshot, {
        matchId: created.matchId,
        sessionId: "session-guest",
      });

      assertEquals(guestSnapshot?.settings.targetScore, 250);
      assertEquals(guestSnapshot?.settings.maxNumberCardValue, 14);
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it.effect("does not increment version when host repeats the same settings", () =>
    Effect.gen(function* () {
      const client = yield* TestConfect.TestConfect;

      const created = yield* createHostMatch();

      const unchanged = yield* client.mutation(refs.public.matches.updateMatchSettings, {
        matchId: created.matchId,
        sessionId: "session-host",
        expectedVersion: created.version,
        patch: {
          targetScore: 200,
          maxNumberCardValue: 12,
        },
      });

      assertEquals(unchanged.version, created.version);
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it.effect("rejects non-host, stale, invalid, and started-match settings updates", () =>
    Effect.gen(function* () {
      const client = yield* TestConfect.TestConfect;

      const created = yield* createTwoPlayerMatch();

      const nonHostExit = yield* client
        .mutation(refs.public.matches.updateMatchSettings, {
          matchId: created.matchId,
          sessionId: "session-guest",
          expectedVersion: created.version,
          patch: { targetScore: 250 },
        })
        .pipe(Effect.exit);
      if (Exit.isSuccess(nonHostExit)) {
        throw new Error("Expected non-host settings update to fail");
      }
      assertEquals(Cause.pretty(nonHostExit.cause).includes("NotHost"), true);

      const staleExit = yield* client
        .mutation(refs.public.matches.updateMatchSettings, {
          matchId: created.matchId,
          sessionId: "session-host",
          expectedVersion: created.version + 1,
          patch: { targetScore: 250 },
        })
        .pipe(Effect.exit);
      if (Exit.isSuccess(staleExit)) {
        throw new Error("Expected stale settings update to fail");
      }
      assertEquals(Cause.pretty(staleExit.cause).includes("StaleGameState"), true);

      const invalidExit = yield* client
        .mutation(refs.public.matches.updateMatchSettings, {
          matchId: created.matchId,
          sessionId: "session-host",
          expectedVersion: created.version,
          patch: { maxNumberCardValue: 13 },
        })
        .pipe(Effect.exit);
      if (Exit.isSuccess(invalidExit)) {
        throw new Error("Expected invalid settings update to fail");
      }
      assertEquals(Cause.pretty(invalidExit.cause).includes("InvalidGameSettings"), true);

      const started = yield* client.mutation(refs.public.matches.startMatch, {
        matchId: created.matchId,
        sessionId: "session-host",
        expectedVersion: created.version,
        idempotencyKey: "matches-settings-start",
      });

      const startedExit = yield* client
        .mutation(refs.public.matches.updateMatchSettings, {
          matchId: created.matchId,
          sessionId: "session-host",
          expectedVersion: started.version,
          patch: { targetScore: 300 },
        })
        .pipe(Effect.exit);
      if (Exit.isSuccess(startedExit)) {
        throw new Error("Expected started-match settings update to fail");
      }
      assertEquals(Cause.pretty(startedExit.cause).includes("InvalidMatchState"), true);
    }).pipe(Effect.provide(TestConfect.layer())),
  );
});
