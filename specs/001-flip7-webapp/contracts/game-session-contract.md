# Contract: Game Session Operations

## Purpose

Define the application-facing contract for creating, viewing, and progressing a Flip 7
match. These operations form the stable boundary between the interactive UI and the
authoritative game state.

## Shared Rules

- All state-changing operations validate that the match is active and the caller's
  requested action is legal for the current state.
- Every successful state-changing operation returns the updated match snapshot together
  with the latest resolved round event (`type` + structured `payload` for UI formatting).
- Every failed operation returns a user-safe error message and a machine-readable error
  code.

## Match Snapshot

### Shape

```ts
type MatchSnapshot = {
  matchId: string;
  status: "setup" | "in_progress" | "completed";
  targetScore: number;
  currentRoundNumber: number;
  dealerSeat: number;
  activePlayerId: string | null;
  players: Array<{
    playerId: string;
    displayName: string;
    seatIndex: number;
    totalScore: number;
    roundStatus: "active" | "stayed" | "busted" | "frozen" | "completed" | "waiting";
    pointsAtRisk: number;
    numberCards: Array<{ label: string; value: number }>;
    modifierCards: Array<{ label: string }>;
    heldActionCards: Array<{ label: string }>;
  }>;
  latestEvent: {
    type: string;
    payload: Record<string, unknown>;
    actorPlayerId?: string | null;
    targetPlayerId?: string | null;
    playerNames?: string;
  } | null;
};
```

## Operations

### `createMatch`

Creates a new match in setup state.

#### Input

```ts
{
  hostName: string;
  sessionId: string;
}
```

#### Rules

- `hostName` must be non-empty (max length enforced server-side)
- Creates the host at seat 0 only; each joiner claims an open seat or adds a new seat row (no fixed capacity)
- Initializes cumulative scores to zero
- Does not start round one automatically until the host starts from setup

#### Returns

- `MatchSnapshot`

### `startMatch`

Begins the first round and performs initial dealing.

#### Input

```ts
{
  matchId: string;
}
```

#### Rules

- Allowed only when match status is `setup`
- Creates round one and resolves any action cards encountered during the opening deal

#### Returns

- `MatchSnapshot`

### `getMatchSnapshot`

Returns the latest committed state for rendering or reconnection.

#### Input

```ts
{
  matchId: string;
}
```

#### Returns

- `MatchSnapshot`

### `takeTurnAction`

Resolves a player's explicit turn decision.

#### Input

```ts
{
  matchId: string;
  playerId: string;
  action: "hit" | "stay";
}
```

#### Rules

- Allowed only for the current active player
- `stay` is invalid after busting or freezing
- `hit` deals the next card and resolves action-card or duplicate-number effects before
  advancing the turn

#### Returns

- `MatchSnapshot`

### `resolveForcedAction`

Resolves an effect that requires a target selection or a forced follow-up.

#### Input

```ts
{
  matchId: string
  sourcePlayerId: string
  actionKind: 'freeze' | 'flip_three' | 'second_chance_pass'
  targetPlayerId?: string
}
```

#### Rules

- `targetPlayerId` is required when the rules demand a target
- `flip_three` on self is allowed when no other active player exists
- `second_chance_pass` requires the source player to already hold an extra Second
  Chance card and the target to be an eligible active player without one

#### Returns

- `MatchSnapshot`

### `startNextRound`

Creates the next round after round scoring is complete.

#### Input

```ts
{
  matchId: string;
}
```

#### Rules

- Allowed only after the current round is completed and the match is still in progress
- Rotates dealer seat and preserves cumulative scores

#### Returns

- `MatchSnapshot`

## Error Contract

### Shape

```ts
type GameActionError = {
  code:
    | "MATCH_NOT_FOUND"
    | "INVALID_MATCH_STATE"
    | "INVALID_TURN"
    | "INVALID_ACTION"
    | "INVALID_TARGET"
    | "RULE_VIOLATION";
  message: string;
};
```

## Contract Test Priorities

- Match creation rejects invalid host name; lobby grows as players join
- Initial dealing handles action-card interruptions correctly
- `takeTurnAction` rejects out-of-turn actions
- Duplicate-number resolution respects Second Chance before busting
- Round completion returns correct score summary and winner determination
