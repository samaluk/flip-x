# Feature Specification: Desktop Player View with Dynamic Turn Order

**Feature Branch**: `002-desktop-player-view`  
**Created**: 2026-04-11  
**Status**: Draft  
**Input**: User description: "refactor the visuals of the game, optimizing it for desktop playing, having a clear view of the owns players lane at all times, letting players scroll through the list of others players lane in the order they are playing, the player currently playing is at the top, the list constantly reordering given the one currently playing"

## User Scenarios & Testing

### User Story 1 - View Own Player Lane Always Visible (Priority: P1)

As a player at a desktop device, I want my player lane to remain visible at all times while playing so that I can always see my cards and status without scrolling.

**Why this priority**: The core requirement for desktop optimization - players must never lose sight of their own cards and status while navigating the table.

**Independent Test**: Load the game on a desktop browser, scroll through other player lanes, and verify the viewer's own lane remains visible at the top fixed position at all times.

**Acceptance Scenarios**:

1. **Given** the player has claimed a seat and is viewing the game, **When** any amount of vertical scrolling occurs, **Then** the player's own lane remains in the pinned position at the top of the viewport.
2. **Given** the player is viewing the game, **When** the game state updates (cards dealt, turn taken), **Then** the pinned lane reflects current state immediately.

---

### User Story 2 - Active Player at Top of Scrollable List (Priority: P1)

As a player, I want the currently active player to be positioned at the top of the scrollable player list so that I don't need to scroll to see who is playing.

**Why this priority**: Ensures players can immediately see whose turn it is without searching through the list.

**Independent Test**: Start a round, observe turn transitions, and verify the active player always appears at the top of the player list below the pinned viewer lane.

**Acceptance Scenarios**:

1. **Given** the round is in progress and Player X is active, **When** the page loads, **Then** Player X is positioned at the top of the scrollable player list (below the pinned viewer lane).
2. **Given** the table has multiple players with Player Y's turn, **When** Player Y completes their turn and it becomes Player Z's turn, **Then** Player Z animates to the top position.

---

### User Story 3 - Own Lane Appears Twice When It's Your Turn (Priority: P1)

As a player, when it becomes my turn, I want to see my lane both pinned at the top AND highlighted at the top of the list below so that there is no ambiguity about whose turn it is.

**Why this priority**: Creates unambiguous visual confirmation when it's the viewer's own turn by showing their lane duplicated with both pinned position and active-highlight position.

**Independent Test**: Wait until it becomes the viewer's turn, observe the layout, and verify the viewer's lane appears twice - once pinned at top and once at top of the active list with golden highlight ring.

**Acceptance Scenarios**:

1. **Given** the viewer has claimed a seat and it is NOT their turn, **When** viewing the table, **Then** the viewer's lane appears only in the pinned position (not duplicated in the list).
2. **Given** the viewer has claimed a seat and it IS their turn, **When** viewing the table, **Then** the viewer's lane appears in both locations: (a) pinned at the top, and (b) at the top of the scrollable list with the active player visual treatment.

---

### User Story 4 - Smooth Reordering Animation on Turn Changes (Priority: P2)

As a player, I want the player list to smoothly animate when reordering so that the transition to the new active player feels natural.

**Why this priority**: Provides polished visual experience during turn transitions, helping players track whose turn it is through motion.

**Independent Test**: Observe multiple turn transitions and verify smooth reordering animation occurs between players.

**Acceptance Scenarios**:

1. **Given** Player A is active and Player B becomes active, **When** the turn changes, **Then** Player B animates into the top position (no abrupt jump).
2. **Given** the auto-scroll is enabled, **When** a new player becomes active, **Then** the view smoothly scrolls to bring the new active player into view.

---

### User Story 5 - List Resets to Seat Order at Round Start (Priority: P2)

As a player, I want the player list to reset to seat order (dealer first, then clockwise) when a new round starts, so that the table representation refreshes for the new round.

**Why this priority**: Maintains clarity about table positions when a new round begins, following the clockwise dealer progression rule.

**Independent Test**: Complete a round, start a new round, and verify the list has reset to seat order with dealer at the first position after the pinned viewer lane.

**Acceptance Scenarios**:

1. **Given** a round ends and the next round begins (dealer advances), **When** the new round starts, **Then** the player list resets to seat order with the new dealer in position 1 (after pinned viewer).
2. **Given** a new round is in progress, **When** the first turn is taken, **Then** the active player moves to the top of the list with animation.

---

### Edge Cases

- What happens when there are only 2 active players in the round (some players busted out)?
- How does the layout handle the dealer's position - is the dealer lane still shown separately at bottom, or integrated into the scrollable list?
- What happens when the viewer is also the dealer - does the duplicate lane logic apply?
- How does the system handle turn order when players are frozen/busted but still in the round?
- What is the scroll behavior on mobile devices where vertical space is limited?

## Requirements

### Functional Requirements

- **FR-001**: The game interface MUST display a pinned player lane for the viewer's own position that remains visible at all times during vertical scrolling.
- **FR-002**: The viewer's pinned lane MUST display the viewer's current cards (number cards, modifier cards, held action cards) and status (points at risk, round status).
- **FR-003**: The player list below the pinned viewer lane MUST display all other players in turn order with the currently active player positioned at the top.
- **FR-004**: The player list MUST dynamically reorder when the active player changes, moving the new active player to the top position.
- **FR-005**: When it is the viewer's turn, the viewer's lane MUST appear in both the pinned position and at the top of the scrollable list with active player visual treatment.
- **FR-006**: At the start of each new round, the player list MUST reset to seat order with the dealer in the first list position (after the pinned viewer lane).
- **FR-007**: The reordering transition MUST animate smoothly when the active player changes.
- **FR-008**: The interface MUST auto-scroll to bring the newly active player into view when the turn changes.

### User Experience Consistency Requirements

- **UX-001**: The pinned viewer lane MUST have visual differentiation from other lanes (distinct border treatment, "YOU" badge).
- **UX-002**: The active player position in the list MUST have the same golden ring highlight as currently used for the active player.
- **UX-003**: The feature MUST maintain responsive behavior across desktop viewport sizes.
- **UX-004**: Loading states MUST show skeleton loaders for both the pinned lane and the scrollable list.
- **UX-005**: Empty states MUST show appropriate messaging when no other players are in the round.

### Performance Requirements

- **PR-001**: Reordering animations MUST feel smooth and responsive to users.
- **PR-002**: Auto-scroll transitions MUST feel immediate when the active player changes.
- **PR-003**: The interface MUST handle up to 8 players without significant layout shift or performance degradation.

## Key Entities

- **MatchSnapshot**: Contains all player states, turn order, and round status (existing entity, modified display logic)
- **PlayerLane**: The visual component representing a single player's cards and status (existing component, new layout behavior)
- **ViewerLane**: A pinned instance of PlayerLane fixed at the top of the viewport
- **ActivePlayerHighlight**: Visual treatment (golden ring) indicating the currently active player

## Success Criteria

### Measurable Outcomes

- **SC-001**: Players can always see their own lane without scrolling.
- **SC-002**: The active player is positioned at the top of the scrollable list during all active turns.
- **SC-003**: The viewer's lane appears in duplicate positions when it's the viewer's turn.
- **SC-004**: Turn-to-turn reordering animation feels smooth and natural to users.
- **SC-005**: Players can identify whose turn it is within 1 second without manual scrolling.

## Assumptions

- The existing PlayerLane component can be extended with modified layout behavior.
- The turn order is determined by the existing `activePlayerId` in the game state.
- Seat order is determined by `seatIndex` ascending from 0.
- The dealer position advances clockwise each round following the existing game rules.
- The layout will use fixed positioning for the pinned lane and overflow scrolling for the player list.
- Animation will follow existing patterns already established in the UI.
- Mobile viewport behavior will follow existing responsive patterns (stacked layout retained for small screens).
