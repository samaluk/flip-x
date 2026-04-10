# Feature Specification: Flip 7 Web App

**Feature Branch**: `001-flip7-webapp`  
**Created**: 2026-04-10  
**Status**: Draft  
**Input**: User description: "build a webappapp to play the card game flip7 https://cdn.shopify.com/s/files/1/0611/3958/3198/files/25_FLIP_7_TB_RULES_C_Rev_9_2_25_ND.pdf?v=1756935535"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Play a Round of Flip 7 (Priority: P1)

As a group of players, we want the web app to run a complete round of Flip 7 so that
we can deal cards, choose Hit or Stay, resolve action and modifier cards, and score
the round according to the official rules.

**Why this priority**: The product has no value unless players can complete the core
gameplay loop correctly.

**Independent Test**: Start a new game with at least three players, play through a
round that includes number cards, a duplicate-number bust, an action card, and at
least one score modifier, then verify the round ends and scores are calculated
correctly.

**Acceptance Scenarios**:

1. **Given** a new round has started, **When** each player receives their initial card
   and later chooses Hit or Stay in turn, **Then** the app updates the visible game
   state after every deal and enforces only legal choices for the active player.
2. **Given** a player receives a second copy of a number already in their active line
   and has no usable Second Chance card, **When** the duplicate is revealed,
   **Then** that player is marked busted, scores nothing for the round, and takes no
   further actions in that round.
3. **Given** a player reveals seven unique number cards, **When** the seventh unique
   number is added to their line, **Then** the round ends immediately and that player
   earns the Flip 7 bonus.

---

### User Story 2 - Complete a Full Match to 200 Points (Priority: P2)

As returning players in the same session, we want the app to carry scores across
rounds until someone reaches the winning threshold so that we can play a full match
without manual scorekeeping.

**Why this priority**: A round-by-round experience is useful, but a full match is the
expected way the game is played and removes the need for paper scoring.

**Independent Test**: Play multiple rounds, confirm dealer rotation and discard/deck
management between rounds, and verify the match ends with the correct winner once at
least one player reaches 200 points.

**Acceptance Scenarios**:

1. **Given** a round has ended, **When** the next round begins, **Then** the app keeps
   each player's cumulative score, resets round-specific state, and advances the
   dealer to the next player.
2. **Given** at least one player reaches 200 or more points at the end of a round,
   **When** final scores are compared, **Then** the app declares the player with the
   highest total score as the winner.

---

### User Story 3 - Understand Why the App Made a Game Decision (Priority: P3)

As a player who may not know every rule detail, I want the app to explain current
turn options, card effects, and score breakdowns so that I can trust the results and
learn the game while playing.

**Why this priority**: Clarity reduces disputes and helps players adopt the digital
experience without needing to reference the printed rules constantly.

**Independent Test**: During play, inspect a turn involving an action card, a score
modifier, and an end-of-round scoring summary, then verify the app explains the
effect on the player state and final points.

**Acceptance Scenarios**:

1. **Given** a player is deciding whether to Hit or Stay, **When** their turn is
   active, **Then** the app shows their current points-at-risk, whether they are still
   active in the round, and the effects of cards already in front of them.
2. **Given** a round has ended, **When** scores are displayed, **Then** each player's
   result includes a readable breakdown of number-card totals, multiplier effects,
   bonus modifiers, and any Flip 7 bonus awarded.

### Edge Cases

- If the opening deal reveals an action card, the app must pause normal dealing,
  resolve the action, then continue the initial deal for the remaining players.
- If a player has a Second Chance card and later receives a duplicate number, the app
  must discard the duplicate and the Second Chance instead of busting that player.
- If a player already holds a Second Chance card and receives another one, the app
  must require that card to be passed to another eligible active player or discarded
  when no eligible recipient exists.
- If Flip Three is played and the player busts or achieves Flip 7 before all three
  cards are revealed, the app must stop resolving additional forced flips.
- If Freeze is played on a player with no number cards yet, the app must still end
  that player's participation in the round and bank only the points they have
  legitimately earned.
- If a player chooses to Stay with only modifier cards and no number cards, the app
  must score only the modifiers that produce a non-zero result.
- If the draw pile runs out during a round, the app must preserve all cards already in
  front of players, rebuild the deck from prior discards, and continue the round.
- If the session is loading or reconnecting to an in-progress game state, the app must
  show the current players, active turn, and latest resolved action before allowing
  further input.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow players to start a new Flip 7 match with named
  participants and begin the first round without external scorekeeping.
- **FR-002**: The system MUST represent the official Flip 7 deck composition,
  including number cards, action cards, and score modifier cards.
- **FR-003**: The system MUST deal cards and advance turns according to the official
  round flow, including the opening deal, Hit/Stay decisions, active-player tracking,
  and dealer rotation between rounds.
- **FR-004**: The system MUST enforce bust rules when a player receives a duplicate
  number unless a valid Second Chance effect prevents the bust.
- **FR-005**: The system MUST resolve Flip Three, Freeze, Second Chance, and score
  modifier cards according to the official rules and clearly show their effect on the
  affected player.
- **FR-006**: The system MUST end the round when no active players remain or when a
  player reveals seven unique number cards.
- **FR-007**: The system MUST calculate round scores correctly by combining number-card
  values, multiplier effects, additive modifiers, and the Flip 7 bonus when earned.
- **FR-008**: The system MUST carry cumulative scores across rounds and end the match
  when at least one player reaches 200 points, awarding the win to the highest score
  at the end of that round.
- **FR-009**: Players MUST be able to view a round summary showing who stayed, who
  busted, which card effects changed the outcome, and how each score was calculated.
- **FR-010**: The system MUST prevent invalid actions, including taking a turn out of
  order, staying after busting, keeping more than one Second Chance card, or applying
  an action card to an ineligible player.
- **FR-011**: The system MUST preserve an in-progress match if a player refreshes or
  briefly disconnects, restoring the latest committed game state when they return.
- **FR-012**: The system MUST provide rules help that explains card types, end-of-round
  conditions, and scoring without requiring players to leave the app.

### User Experience Consistency Requirements

- **UX-001**: The feature MUST present a single, consistent shared game table with the
  same card layout, action controls, and player ordering throughout setup, round play,
  and scoring.
- **UX-002**: The feature MUST define loading, empty, success, and error states for
  match creation, joining or restoring a match, taking a turn, and ending a round.
- **UX-003**: The feature MUST make the active player, available choices, and most
  recent card effect visually distinct so players can understand the game state at a
  glance on both desktop and mobile screens.
- **UX-004**: The feature MUST provide accessible text alternatives for card effects,
  preserve readable contrast, and avoid interactions that depend only on color.

### Performance Requirements

- **PR-001**: The feature MUST update the visible game state within 1 second for at
  least 95% of turn actions measured during normal gameplay sessions.
- **PR-002**: The feature MUST allow a new match or restored match to become playable
  within 3 seconds for at least 95% of attempts on a standard consumer connection.
- **PR-003**: The feature MUST support matches of up to 8 players without degraded turn
  clarity, delayed score calculation, or missed state updates during a full match.
- **PR-004**: The feature MUST validate performance with repeatable gameplay scenarios
  covering match creation, turn resolution, round scoring, and multi-round play.

### Key Entities *(include if feature involves data)*

- **Match**: A full game session containing players, cumulative scores, dealer order,
  deck state, discard state, match status, and the winning outcome.
- **Player**: A participant with a display name, seating order, cumulative score,
  current round state, and eligibility for actions such as Hit, Stay, or receiving a
  passed card.
- **Round**: A single scoring cycle within a match containing turn order, active and
  inactive players, dealt cards, revealed card effects, and the round-ending reason.
- **Card**: A deck item with a type, visible label, effect rules, and score impact.
- **Score Breakdown**: A readable summary of how a player's round total was derived,
  including number totals, multiplier calculations, additive modifiers, and bonuses.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing, 100% of scripted gameplay scenarios based on the
  official rules produce the expected round outcome and score totals.
- **SC-002**: At least 90% of first-time players in evaluation sessions can complete a
  full round without referencing the external rule sheet.
- **SC-003**: At least 95% of turn actions display the updated game state in 1 second
  or less during standard gameplay sessions.
- **SC-004**: At least 90% of evaluated matches reach a completed result without a
  manual score correction or rule dispute.

## Assumptions

- The initial release supports 3 to 8 human players in a single shared match, aligned
  with the official game's standard multiplayer focus.
- Computer-controlled opponents, matchmaking, and tournament features are out of scope
  for the initial release.
- The app follows the official Flip 7 rules referenced in the supplied rule document,
  including the 200-point win condition and the described action and modifier cards.
- Players are willing to use the app as the source of truth for turn order, card
  effects, and scoring during the match.
