# Feature Specification: Lobby Code System

**Feature Branch**: `003-lobby-code-system`  
**Created**: 2026-04-11  
**Status**: Draft  
**Input**: User description: "refactor the lobby creation steps to be like the usual online lobby games, a player on the homepage has two options, create game and join lobby, with that they need a code to join (theres also a link inside the lobby to share so others can join directly), then in the lobby the host must start the game"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create a New Game Lobby (Priority: P1)

As a player who wants to host a new game, I want to create a lobby with a unique code so that I can share it with friends to join.

**Why this priority**: This is the primary entry point for hosts to start a new game session.

**Independent Test**: A user clicks "Create Game", enters player names, and receives a lobby code that can be shared with others.

**Acceptance Scenarios**:

1. **Given** the homepage is displayed, **When** a user clicks "Create Game", **Then** a new lobby is created with a unique code and the user is taken to the lobby page.
2. **Given** a lobby is created, **When** the host views the lobby, **Then** the lobby code is displayed prominently with a copy button.
3. **Given** the host wants to invite friends, **When** they share the lobby link, **Then** visitors who open the link are taken directly to the lobby with the code pre-filled.

---

### User Story 2 - Join an Existing Game via Code (Priority: P1)

As a player receiving a game code from a friend, I want to enter the code on the homepage and join their lobby.

**Why this priority**: This is the primary entry point for guests to join an existing game session.

**Independent Test**: A user enters a valid lobby code on the homepage, claims a seat in the lobby, and sees the game state.

**Acceptance Scenarios**:

1. **Given** the homepage is displayed, **When** a user clicks "Join Lobby" and enters a valid code, **Then** they are taken to the matching lobby.
2. **Given** a user enters an invalid code, **When** they submit the code, **Then** an error message displays indicating the lobby was not found.
3. **Given** a user joins via a shared link, **When** they open the link, **Then** the lobby code is automatically extracted from the URL and the user joins that lobby.

---

### User Story 3 - Host Starts the Game (Priority: P1)

As a lobby host, I want to explicitly start the game once all players have joined so that the match begins.

**Why this priority**: This gives the host control over game timing and ensures players are ready.

**Independent Test**: A host clicks "Start Game" in the lobby and the first round begins immediately.

**Acceptance Scenarios**:

1. **Given** a lobby has at least three players, **When** the host clicks "Start Game", **Then** the game transitions to active state and the first round begins.
2. **Given** a lobby has fewer than three claimed seats, **When** the host clicks "Start Game", **Then** an error message explains the minimum player requirement.
3. **Given** the game is in progress, **When** a user views the lobby, **Then** the "Start Game" button is no longer visible.

---

### User Story 4 - Share Lobby with Others (Priority: P2)

As a host or player in a lobby, I want to share a direct link so others can join the game easily.

**Why this priority**: Direct links reduce friction for players to join without needing to manually enter codes.

**Independent Test**: A user clicks "Copy Invite Link" and the link is copied to their clipboard.

**Acceptance Scenarios**:

1. **Given** a user is in an active lobby, **When** they click "Copy Invite Link", **Then** a shareable link is copied to their clipboard with a success toast.
2. **Given** a user opens a shared lobby link, **Then** the lobby code is automatically extracted from the URL and the user joins that lobby.

---

### Edge Cases

- What happens when a user tries to join a lobby that no longer exists?
- How does the system handle a user who claims a seat but never starts?
- What happens when the host leaves the lobby before starting?
- How should the UI handle a lobby that has been "started" by another user on a different device?
- What happens if two users try to start the game simultaneously?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST provide a "Create Game" button on the homepage that initiates a new lobby.
- **FR-002**: The system MUST generate a unique, human-readable code (4-6 characters) for each lobby.
- **FR-003**: The system MUST provide a "Join Lobby" input on the homepage where users can enter a lobby code.
- **FR-004**: The system MUST validate lobby codes and redirect users to the matching lobby or show an error.
- **FR-005**: The system MUST include a shareable link in the lobby that encodes the lobby code.
- **FR-006**: The system MUST only allow the lobby host to start the game.
- **FR-007**: The system MUST enforce a minimum of three players before allowing the game to start.
- **FR-008**: The system MUST display the lobby code prominently in the lobby for easy sharing.

### User Experience Consistency Requirements

- **UX-001**: The feature MUST use established product patterns for navigation, naming, and interaction unless the spec explicitly approves a new pattern.
- **UX-002**: The feature MUST define loading, empty, success, and error states for each affected user flow.
- **UX-003**: The feature MUST maintain accessibility and responsive behavior for supported contexts.

### Performance Requirements

- **PR-001**: The lobby creation and code validation MUST respond within 1 second.
- **PR-002**: The feature MUST identify how those targets will be validated.

### Key Entities

- **Lobby**: A temporary game session container with a unique code, player list, and host assignment. Status: setup, active, completed.
- **Lobby Code**: A unique 4-6 character alphanumeric identifier for a lobby.
- **Host**: The user who created the lobby and has permission to start the game.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can create a lobby and receive a shareable code within 2 seconds of clicking "Create Game".
- **SC-002**: Users can successfully join a lobby by entering a valid code, with a clear error for invalid codes.
- **SC-003**: At least 90% of users can successfully start a game once they have claimed the host seat and met the minimum player requirement.
- **SC-004**: The lobby link correctly resolves to the intended lobby 99% of the time.

## Assumptions

- Users have stable internet connectivity.
- The lobby code format will be alphanumeric (4-6 characters) to balance usability and uniqueness.
- The host is the user who created the lobby (first to claim a seat after creation).
- Once a game starts, the lobby transitions to an active match state and cannot accept new players.
- The existing authentication system (anonymous session via localStorage) will be reused.
