I would structure it as a deterministic game engine wrapped by Convex, not as “Convex mutations that contain game rules.”

The target shape should be:

```txt
apps/
  web/                         # Next.js 16 app
    app/
      game/[gameCode]/page.tsx
      game/[gameCode]/GameClient.tsx
    components/game/
    hooks/useGameCommand.ts

packages/
  flip7-engine/                # Pure game logic, no Convex imports
    src/
      model/
        card.ts
        game-state.ts
        player-state.ts
        commands.ts
        events.ts
        errors.ts
      rules/
        draw-card.ts
        resolve-card.ts
        resolve-action.ts
        score-round.ts
        turn-order.ts
        end-conditions.ts
      engine/
        handle-command.ts
        apply-event.ts
        project-public-view.ts
      testing/
        fixed-decks.ts
        command-script.ts

convex/
  schema.ts
  games.ts                    # Public queries/mutations
  internal/
    gamePersistence.ts
    authz.ts
    timers.ts
  lib/
    runEffect.ts
    projections.ts
```

The clean separation is:

`Next.js UI → Convex mutation/query → Effect game command handler → new state + events → Convex persists atomically → realtime UI updates`

Convex gives you a strong fit for this because queries are reactive/subscribable, mutations write transactionally, and actions are for external side effects rather than core game state changes. ([Convex Developer Hub][1]) Convex mutation reads and writes are atomic and isolated inside one mutation, so each game move should be one mutation that loads the current game, resolves the entire legal transition, and saves the result. ([Convex Developer Hub][2])

The most important backend rule: your game engine should not know Convex exists.

For Flip 7, the engine should expose something like this:

```ts
type GameCommand =
  | { type: "JoinGame"; playerName: string }
  | { type: "StartGame"; actorPlayerId: PlayerId }
  | { type: "Hit"; actorPlayerId: PlayerId }
  | { type: "Stay"; actorPlayerId: PlayerId }
  | { type: "ChooseActionTarget"; actorPlayerId: PlayerId; targetPlayerId: PlayerId }
  | { type: "ContinueRound"; reason: "initialDeal" | "forcedResolution" };

type CommandEnvelope = {
  command: GameCommand;
  expectedVersion: number; // match-level version from the latest snapshot
  idempotencyKey: string;
};

type TransitionResult = {
  state: GameState;
  events: GameEvent[];
  publicResult: ClientCommandResult;
};
```

Your Convex mutation should be thin:

```ts
export const hit = mutation({
    args: {
      gameId: v.id("games"),
      expectedVersion: v.number(),
      idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const existingCommand = await findCommandResult(ctx, {
      gameId: args.gameId,
      idempotencyKey: args.idempotencyKey,
    });
    if (existingCommand) {
      assertSameCommand(existingCommand, args);
      return await buildCurrentSnapshot(ctx, args.gameId);
    }

    const state = await loadGameState(ctx, args.gameId);
    assertMatchVersion(state.match.version, args.expectedVersion);
    const actor = await requirePlayerInGame(ctx, state);

    const result = await runGameEffect(
      handleCommand(state, {
        type: "Hit",
        actorPlayerId: actor.playerId,
      }),
    );

    await persistTransition(ctx, {
      gameId: args.gameId,
      expectedVersion: args.expectedVersion,
      idempotencyKey: args.idempotencyKey,
      result,
    });

    return result.publicResult;
  },
});
```

That mutation should not manually know how Second Chance, Freeze, Flip Three, scoring, or turn order works. It should only authenticate, authorize, load state, call the engine, persist the transition, and return a result.

For Effect.ts, use it mainly for typed validation, domain errors, dependency injection, and deterministic testing. Do not force every tiny pure rule into Effect if a normal pure function is clearer. Effect Schema is useful because it can define schemas that decode, encode, and assert data shapes. ([Effect][3]) Confect is specifically designed to integrate Effect with Convex schemas, function validators, and encode/decode flows, so it fits well at the Convex boundary. ([GitHub][4]) Effect Layers are useful for dependencies like clock, RNG, ID generation, and rule settings, because Layers describe how services are built and injected. ([Effect TS][5])

I would model these Effect services:

```ts
interface RngService {
  shuffle<T>(items: readonly T[]): T[];
}

interface ClockService {
  now(): number;
}

interface IdService {
  newId(prefix: string): string;
}

interface RulebookService {
  targetScore: number; // 200 by default
  flip7Bonus: number; // 15
}
```

Then your tests provide `FixedRng`, `FixedClock`, and `FixedIds`. Production provides server-side implementations. This is what lets you test: “given this deck, these players, and this sequence of commands, the game always ends in the same state.”

For the database, I would use a hybrid snapshot + event log model. Do not go full event sourcing unless you really want the complexity, but do keep events because they are excellent for debugging, replay, animations, and tests.

A practical Convex schema shape:

```ts
games
  code
  status: "lobby" | "playing" | "finished"
  hostPlayerId
  currentRoundId?
  targetScore
  version
  createdAt
  updatedAt

players
  gameId
  userId?              # optional if anonymous sessions are allowed
  sessionId?           # for guest players
  name
  seatIndex
  totalScore
  status: "joined" | "left"
  createdAt

rounds
  gameId
  roundNumber
  status: "dealing" | "awaitingDecision" | "awaitingActionTarget" | "scoring" | "finished"
  activeSeatIndex?
  pendingDecision?
  pendingAction?
  snapshot             # full private round state
  publicSnapshot       # optional denormalized public state
  version
  createdAt
  updatedAt

gameEvents
  gameId
  roundId?
  seq
  type
  actorPlayerId?
  payload
  idempotencyKey?
  createdAt

commandResults
  gameId
  idempotencyKey
  commandType
  actorPlayerId?
  requestHash
  resultingVersion
  createdAt
```

The `rounds.snapshot` can contain the authoritative private state: draw pile, discard pile, player round states, modifiers, action cards, pending action, and current turn. The public query should never return that raw snapshot, because the draw pile must remain hidden. Instead, return a projected view from `projectPublicView(state, viewerPlayerId)`.

For indexes, add at least:

```ts
players.by_gameId
players.by_gameId_seatIndex
players.by_gameId_userId
rounds.by_gameId
gameEvents.by_gameId_seq
gameEvents.by_roundId_seq
commandResults.by_gameId_idempotencyKey
games.by_code
```

Convex recommends using indexes instead of unbounded filtering for scalable queries, so design your common reads around `gameId`, `code`, `seatIndex`, and event sequence. ([Convex Developer Hub][6])

The engine state machine should persist only phases that need user input. Automatic rule resolution should happen inside one mutation, except for intentionally manual user-facing phases like Flip Three draws.

For Flip 7, I’d use these persisted phases:

```ts
type RoundPhase =
  | { type: "InitialDeal"; nextSeatIndex: number }
  | { type: "AwaitingDecision"; playerId: PlayerId }
  | { type: "AwaitingActionTarget"; sourcePlayerId: PlayerId; action: "Freeze" | "FlipThree" | "SecondChanceTransfer" }
  | { type: "AwaitingFlipThreeDraw"; sourcePlayerId: PlayerId; targetPlayerId: PlayerId; cardsRemaining: number }
  | { type: "RoundOver"; reason: "allInactive" | "flip7" }
  | { type: "GameOver"; winnerPlayerIds: PlayerId[] };
```

Do not persist phases like `ResolvingDraw`, `CheckingBust`, or `ApplyingModifier`. Those should be internal engine steps. A user hits; the mutation draws the card, resolves duplicates, Second Chance, modifiers, Flip 7, round end, and next turn before returning. During Flip Three, the target's manual hit resolves one draw and either keeps the pending Flip Three sequence active, completes it, or ends it due to bust/Flip 7.

The core engine should probably look like this:

```ts
export const handleCommand = (
  state: GameState,
  command: GameCommand,
): Effect.Effect<TransitionResult, GameError, RngService | ClockService | RulebookService> =>
  Effect.gen(function* () {
    const validCommand = yield* validateCommand(state, command);

    const transition = yield* matchCommand(validCommand, {
      Hit: handleHit,
      Stay: handleStay,
      ChooseActionTarget: handleChooseActionTarget,
      StartGame: handleStartGame,
      JoinGame: handleJoinGame,
    });

    return transition;
  });
```

Then each rule is pure and small:

```ts
resolveDraw(state, playerId)
resolveNumberCard(state, playerId, card)
resolveModifierCard(state, playerId, card)
resolveSecondChance(state, playerId)
resolveFreeze(state, sourcePlayerId, targetPlayerId)
startFlipThree(state, sourcePlayerId, targetPlayerId)
resolveFlipThreeDraw(state, targetPlayerId)
scoreRound(state)
advanceTurn(state)
checkRoundEnd(state)
checkGameEnd(state)
```

For Flip Three specifically, do not scatter its logic across several unrelated mutations. This app intentionally keeps Flip Three as a manual-hit sequence after the target is chosen, matching the physical table experience where each draw is prompted one at a time. Persist `pendingFlip3` while the target still has required draws remaining. Each manual hit during that pending sequence should draw exactly one card, count that card toward the Flip Three total, stop on bust, stop on Flip 7, and set aside nested Freeze/Flip Three cards until the original Flip Three completes successfully.

A good pattern is:

```ts
type PendingAction =
  | {
      type: "ChooseFreezeTarget";
      sourcePlayerId: PlayerId;
      cardId: CardInstanceId;
    }
  | {
      type: "ChooseFlipThreeTarget";
      sourcePlayerId: PlayerId;
      cardId: CardInstanceId;
    }
  | {
      type: "ChooseSecondChanceRecipient";
      sourcePlayerId: PlayerId;
      cardId: CardInstanceId;
    };
```

Your engine can return a state with `pendingAction`. The frontend simply renders the corresponding modal or target selector. The frontend should not decide whether the target is valid; it can filter for UX, but Convex must validate again.

Use an event log for explainability:

```ts
type GameEvent =
  | { type: "CardDrawn"; playerId: PlayerId; card: PublicCard }
  | { type: "PrivateCardDrawn"; playerId: PlayerId } // optional for hidden/audit-safe views
  | { type: "PlayerStayed"; playerId: PlayerId }
  | { type: "PlayerBusted"; playerId: PlayerId; duplicateNumber: number }
  | { type: "SecondChanceUsed"; playerId: PlayerId; duplicateNumber: number }
  | { type: "ActionTargetRequired"; sourcePlayerId: PlayerId; action: string }
  | { type: "ActionResolved"; sourcePlayerId: PlayerId; targetPlayerId: PlayerId; action: string }
  | { type: "RoundEnded"; reason: "flip7" | "allInactive" }
  | { type: "RoundScored"; scores: Array<{ playerId: PlayerId; roundScore: number; totalScore: number }> }
  | { type: "GameEnded"; winnerPlayerIds: PlayerId[] };
```

This event log is not just for UI animation. It gives you a perfect test oracle. Your unit tests can assert the exact event sequence for a fixed deck and command script.

For idempotency and concurrency, every client command should include `idempotencyKey` and match-level `expectedVersion`. In the mutation, check whether that idempotency key already produced a result for the match. If yes and the request hash matches, do not apply the command again; rebuild and return the latest snapshot. If the same key is reused with different command data, reject with `DuplicateCommandConflict`. If the version is stale, reject with `StaleGameState`. Convex transactions already protect the write boundary, but explicit versions make errors easier to understand and test. ([Convex Developer Hub][2])

For Next.js 16, use the App Router, but keep the actual game screen as a Client Component subscribed to Convex. Convex’s Next.js App Router docs explicitly note that Client Components are needed to keep the UI automatically reactive to database changes because the Convex React client maintains the live connection. ([Convex Developer Hub][7]) Server rendering can preload Convex queries with `preloadQuery`, but Convex’s docs mark Next.js server rendering support as beta and warn that multiple `preloadQuery` calls on the same page may not be consistent with each other. ([Convex Developer Hub][8])

So I would do this:

```tsx
// app/game/[code]/page.tsx
export default async function GamePage({ params }) {
  const preloadedGame = await preloadQuery(api.games.getPublicGameByCode, {
    code: params.code,
  });

  return <GameClient preloadedGame={preloadedGame} />;
}
```

Then inside `GameClient`:

```tsx
"use client";

export function GameClient({ preloadedGame }) {
  const game = usePreloadedQuery(preloadedGame);
  const hit = useMutation(api.games.hit);
  const stay = useMutation(api.games.stay);
  const chooseTarget = useMutation(api.games.chooseActionTarget);

  return <GameBoard game={game} commands={{ hit, stay, chooseTarget }} />;
}
```

Avoid Next.js Server Actions for core moves. Let Convex own the game command path directly. Server Actions are fine for non-realtime account/profile flows, but a multiplayer game wants the Convex client subscription and mutation path.

Use Convex actions only for external or non-transactional work: analytics export, AI bot players, webhooks, emails, or background cleanup. Convex docs state that query/mutation functions cannot make external `fetch` calls, while actions are the way to access the external world. ([Convex Developer Hub][9]) Also, Convex’s React docs say directly calling actions from clients is usually an anti-pattern; prefer a mutation that records intent and schedules the action. ([Convex Developer Hub][10])

For timers, such as “auto-stay if player takes too long,” use scheduled functions, not client timers as authority. Convex scheduled functions are stored in the database and can be scheduled with `runAfter` or `runAt`. ([Convex Developer Hub][11]) Still include a `timerToken` or `phaseVersion` in the scheduled function args, so an old timer does nothing if the turn has already advanced.

The testing structure should be:

```txt
packages/flip7-engine/src/**/*.test.ts
  Fast deterministic rule tests.
  No Convex.
  No React.
  Fixed deck.
  Fixed command script.
  Snapshot final state and event log.

convex/**/*.test.ts
  Persistence and authorization tests.
  Does hit reject stale version?
  Does chooseTarget reject non-active target?
  Does public query hide drawPile?

apps/web/**/*.test.tsx
  Component rendering tests.
  Given public game view, does UI show the correct buttons/modal?

e2e/*.spec.ts
  Small number of Playwright happy-path tests.
  Two or three browser sessions.
  Do not use Playwright to exhaustively test rules.
```

The biggest architectural mistake would be making each card effect a separate Convex mutation. For example, avoid:

```txt
hit → drawCard mutation
    → checkBust mutation
    → applySecondChance mutation
    → advanceTurn mutation
```

That creates race conditions, partial state, and scattered rules. Prefer:

```txt
hit mutation
  load state
  engine.handle(Hit)
    draw
    resolve card
    resolve automatic effects
    maybe create pending action
    maybe end round
    maybe end game
  save new snapshot + events atomically
```

For your current stack, the best mental model is:

Convex is the authoritative multiplayer runtime.

Effect is the deterministic domain engine and typed error system.

Confect is the schema/validator bridge between Effect and Convex.

Next.js 16 is the realtime presentation shell.

The core design principle: every player action should become one command, every command should produce one atomic transition, and every transition should be replayable from a fixed initial state.

[1]: https://docs.convex.dev/functions "Functions | Convex Developer Hub"
[2]: https://docs.convex.dev/api/interfaces/server.GenericMutationCtx "Interface: GenericMutationCtx<DataModel> | Convex Developer Hub"
[3]: https://effect.website/docs/schema/introduction/ "Introduction to Effect Schema | Effect Documentation"
[4]: https://github.com/rjdellecese/confect "GitHub - rjdellecese/confect: Use Effect with Convex! · GitHub"
[5]: https://effect-ts.github.io/effect/effect/Layer.ts.html "Layer.ts - effect"
[6]: https://docs.convex.dev/understanding/best-practices "Best Practices | Convex Developer Hub"
[7]: https://docs.convex.dev/client/nextjs/app-router/ "Next.js | Convex Developer Hub"
[8]: https://docs.convex.dev/client/nextjs/app-router/server-rendering "Next.js Server Rendering | Convex Developer Hub"
[9]: https://docs.convex.dev/tutorial/actions "Convex Tutorial: Calling External Services | Convex Developer Hub"
[10]: https://docs.convex.dev/api/modules/react "Module: react | Convex Developer Hub"
[11]: https://docs.convex.dev/scheduling/scheduled-functions "Scheduled Functions | Convex Developer Hub"
