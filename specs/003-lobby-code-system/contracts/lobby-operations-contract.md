# Contract: Lobby Operations

## Purpose

Define the contract for creating, joining, and starting a Flip 7 game lobby. These operations handle the pre-game setup flow where players join via code and the host starts the game.

## Shared Rules

- All lobby operations validate that the match is in "setup" state
- Lobby codes are generated server-side and must be unique across active matches
- Only the host (creator) can start the game
- Minimum 3 players required to start

## Operations

### `createMatch`

Creates a new match in setup state with a generated lobby code.

#### Input

```ts
{
  playerNames: string[];
}
```

#### Rules

- Requires 3-8 non-empty unique player names
- Generates a unique 4-character alphanumeric lobby code
- Sets the creating session as the host
- Initializes status to "setup"

#### Returns

```ts
{
  matchId: string;
  lobbyCode: string;
  players: PlayerInfo[];
  status: "setup";
}
```

### `joinByCode`

Joins an existing lobby by its code.

#### Input

```ts
{
  lobbyCode: string;
}
```

#### Rules

- Lobby code must exist and match must be in "setup" status
- Returns match ID if valid, error if not found

#### Returns

```ts
{
  matchId: string;
  lobbyCode: string;
  status: "setup";
} | null
```

### `startMatchByHost`

Starts the game (transitions from setup to in_progress).

#### Input

```ts
{
  matchId: string;
  sessionId: string;
}
```

#### Rules

- Only allowed when match status is "setup"
- Only the host (matching hostSessionId) can start
- Minimum 3 players must have claimed seats

#### Returns

- `MatchSnapshot` with status "in_progress"

### `getMatchSnapshot`

Returns the current match state for rendering.

#### Input

```ts
{
  matchId: string;
  sessionId?: string;
}
```

#### Returns

```ts
{
  matchId: string;
  lobbyCode: string;
  status: "setup" | "in_progress" | "completed";
  isHost: boolean;
  players: PlayerInfo[];
  // ... existing snapshot fields
}
```

## Error Contract

### Shape

```ts
type LobbyError = {
  code:
    | "INVALID_LOBBY_CODE"
    | "LOBBY_NOT_FOUND"
    | "NOT_HOST"
    | "INSUFFICIENT_PLAYERS"
    | "GAME_ALREADY_STARTED";
  message: string;
};
```

## Contract Test Priorities

- `createMatch` generates unique lobby codes
- `joinByCode` returns null for invalid codes
- `startMatchByHost` rejects non-host callers
- `startMatchByHost` rejects when fewer than 3 players
- URL with code param correctly joins lobby