# Research: Lobby Code System

**Date**: 2026-04-11  
**Feature**: 003-lobby-code-system

## Key Design Decisions

### Lobby Code Format

**Decision**: 4-character alphanumeric uppercase code (e.g., "ABCD", "X7K9")

**Rationale**:

- 4 characters with alphanumeric gives ~1.6M combinations (36^4), sufficient for casual use
- Easy to read and type on mobile
- Short enough to share verbally

**Alternatives considered**:

- 6-character code: Too long for verbal sharing, but more unique
- Numeric only: More prone to transcription errors

### Host Identification

**Decision**: Creator of the match is the host

**Rationale**:

- The user who creates the lobby and claims a seat should have host privileges
- Host is tracked via the session that created the match

**Alternatives considered**:

- First player to claim a seat: More complex to determine
- Explicit host assignment: Extra UI complexity

### Join Flow

**Decision**: Join by code input on homepage OR via shared URL with code param

**Rationale**:

- URL parameter provides seamless experience for shared links
- Code input provides manual entry option
- Both flows lead to same lobby

**Alternatives considered**:

- QR code: Requires additional scanning step
- Only URL-based: Excludes users receiving code via text/copy

## Technical Implementation Notes

### Database Changes

- Add `lobbyCode` field to matches table with index for fast lookups
- Add `hostSessionId` field to track who can start the game

### API Endpoints Needed

- `createMatch` → returns lobby code (already exists, needs update)
- `getMatchByCode` → new mutation for joining by code
- `startMatchByHost` → new mutation, validates host session

### UI Components

- HomePage: Two cards - "Create Game" and "Join Lobby"
- JoinLobbyDialog: Modal with code input
- LobbyCodeDisplay: Shows code in game page with copy button
- StartGameButton: Only visible to host in setup phase

## Dependencies

- Existing Convex matches schema
- Existing anonymous session system
- Existing UI components (shadcn)

No additional dependencies required.
