# Data Model: Lobby Code System

**Feature**: 003-lobby-code-system  
**Date**: 2026-04-11

## Entity Changes

### Existing: Match

The match entity is extended with lobby code functionality:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `lobbyCode` | string (4 chars) | Yes | Unique alphanumeric code for lobby |
| `hostSessionId` | string | Yes | Session ID of the user who created the match |
| `status` | enum: setup/in_progress/completed | Yes | setup = lobby, in_progress = game active |
| `targetScore` | number | Yes | Winning score (200) |
| `currentRoundNumber` | number | Yes | Current round |
| `dealerSeat` | number | Yes | Current dealer position |
| `winnerPlayerId` | id (players) | No | Winning player when completed |
| `createdAt` | number | Yes | Unix timestamp |
| `updatedAt` | number | Yes | Unix timestamp |

**Relationships**:
- One-to-many with Players (via matchId)
- One-to-many with Rounds (via matchId)

### Existing: Player

No changes required. Player is related to match via matchId.

## Validation Rules

### Lobby Code
- Must be exactly 4 characters
- Must be alphanumeric (A-Z, 0-9)
- Must be unique across all active (non-completed) matches
- Generated server-side to ensure uniqueness

### Start Game Validation
- Minimum 3 players must have claimed seats
- Only host (matching hostSessionId) can start
- Match status must be "setup"

## State Transitions

```
Match Status Flow:
setup → in_progress → completed

  setup:    Lobby exists, players can join
  in_progress: Game started, rounds active
  completed: Match finished, winner declared
```

## Indexes

- Add index on `matches.lobbyCode` for fast code lookups
- Add index on `matches.status` for filtering active lobbies