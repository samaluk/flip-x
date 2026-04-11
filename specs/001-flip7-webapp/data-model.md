# Data Model: Flip 7 Web App

## Match

### Purpose

Represents a full game session from setup through final winner declaration.

### Fields

- `id`: unique match identifier
- `status`: `setup | in_progress | completed | abandoned`
- `targetScore`: winning threshold, default 200
- `createdAt`: creation timestamp
- `updatedAt`: last committed state change timestamp
- `dealerSeat`: seat index of the current dealer
- `currentRoundNumber`: 1-based round counter
- `winnerPlayerId`: optional winner reference once the match completes

### Relationships

- Has many `Player` records
- Has many `Round` records
- Has one active `Round` while `status = in_progress`

### Validation Rules

- Must contain 3-8 players before the first round can start
- Must not transition to `completed` until at least one round has ended
- `winnerPlayerId` must reference the highest-scoring player at the close of the
  deciding round

### State Transitions

- `setup -> in_progress` when the first round is created
- `in_progress -> completed` when at least one player reaches target score and the
  round winner check finishes
- `setup | in_progress -> abandoned` only through explicit administrative recovery

## Player

### Purpose

Represents a person participating in the match and their cumulative progress.

### Fields

- `id`: unique player identifier
- `matchId`: owning match reference
- `displayName`: player-visible name
- `seatIndex`: stable order around the table
- `totalScore`: cumulative score across rounds
- `hasWon`: whether the player is the match winner
- `connected`: whether the player is currently connected to the session
- `lastSeenAt`: last activity timestamp

### Relationships

- Belongs to one `Match`
- Has many `RoundPlayerState` records, one per round played

### Validation Rules

- `displayName` must be non-empty and unique within a match
- `seatIndex` must be unique within a match
- `totalScore` cannot be negative

## Round

### Purpose

Tracks a single round of Flip 7, including deck progression, active player order, and
the reason the round ended.

### Fields

- `id`: unique round identifier
- `matchId`: owning match reference
- `roundNumber`: sequential round number within the match
- `status`: `dealing | player_turns | resolving_action | scoring | completed`
- `activePlayerId`: player whose decision or forced resolution is currently pending
- `dealerSeat`: dealer seat for this round
- `drawPile`: ordered remaining deck state
- `discardPile`: cards discarded during or before the round
- `endedBy`: `all_inactive | flip7 | abandoned | unknown`
- `startedAt`: round start timestamp
- `endedAt`: round completion timestamp

### Relationships

- Belongs to one `Match`
- Has many `RoundPlayerState` records
- Has many `RoundEvent` records

### Validation Rules

- Only one round per match may be active at a time
- `activePlayerId` must reference a player still eligible to act unless the round is
  in scoring or completed status
- `endedBy = flip7` requires exactly one player to have seven unique number cards

### State Transitions

- `dealing -> resolving_action` when an action card interrupts dealing
- `resolving_action -> dealing` when initial action resolution completes
- `dealing -> player_turns` once all players receive the initial card state
- `player_turns -> resolving_action` when a dealt action card requires immediate effect
- `player_turns -> scoring` when no active players remain or a player hits Flip 7
- `scoring -> completed` when all round scores and summaries are persisted

## RoundPlayerState

### Purpose

Represents one player's state within a specific round.

### Fields

- `id`: unique round-player-state identifier
- `roundId`: owning round reference
- `playerId`: owning player reference
- `status`: `active | stayed | busted | frozen | completed`
- `numberCards`: revealed number cards currently in the line
- `modifierCards`: additive or multiplier modifier cards currently affecting score
- `heldActionCards`: retained action cards such as Second Chance
- `roundScore`: final score contribution for this round
- `pointsAtRisk`: current visible total if the player banks now
- `hasFlip7`: whether the player ended the round by revealing seven unique numbers

### Relationships

- Belongs to one `Round`
- Belongs to one `Player`

### Validation Rules

- A player may hold at most one active Second Chance card at a time
- `status = busted` implies `roundScore = 0`
- Duplicate numbers are allowed only if the triggering duplicate was immediately
  discarded by a valid Second Chance effect
- `hasFlip7 = true` requires seven distinct number cards in `numberCards`

### State Transitions

- `active -> stayed` when the player chooses to bank their points
- `active -> busted` when a duplicate number resolves without Second Chance protection
- `active -> frozen` when Freeze resolves against the player
- `stayed | busted | frozen -> completed` during round finalization

## CardInstance

### Purpose

Represents an individual card occurrence in the game deck and in player-visible state.

### Fields

- `id`: unique card instance identifier
- `roundId`: owning round reference
- `type`: `number | action | modifier`
- `label`: user-visible card label
- `numberValue`: optional numeric value for number cards
- `modifierValue`: optional additive value or multiplier descriptor
- `actionKind`: optional `flip_three | freeze | second_chance`
- `zone`: `draw_pile | discard_pile | player_line | held_action | revealed_event`
- `ownerPlayerId`: optional owning player reference when applicable

### Validation Rules

- Exactly one location zone must apply at a time
- `numberValue` is required only for number cards
- `actionKind` is required only for action cards

## RoundEvent

### Purpose

Stores the audit trail used for reconnect restoration, score explanations, and rule
transparency.

### Fields

- `id`: unique event identifier
- `roundId`: owning round reference
- `sequence`: monotonic order within the round
- `eventType`: descriptive action such as `initial_deal`, `hit`, `stay`,
  `duplicate_bust`, `freeze_applied`, `flip_three_started`, `second_chance_used`,
  `round_scored`
- `actorPlayerId`: optional player who initiated the action
- `targetPlayerId`: optional affected player
- `payload`: structured details needed to reconstruct the visible outcome
- `createdAt`: event timestamp

### Validation Rules

- `sequence` must be unique within a round and append-only
- Payload must include enough data to explain score changes and card effects to users

## ScoreBreakdown

### Purpose

Represents the human-readable scoring explanation shown at end of round.

### Fields

- `roundId`: round reference
- `playerId`: player reference
- `numberCardTotal`: sum of revealed number cards
- `multiplierApplied`: whether x2 was applied
- `multipliedTotal`: total after multiplier
- `additiveModifierTotal`: total from +2 to +10 cards
- `flip7Bonus`: additional Flip 7 bonus awarded
- `finalRoundScore`: final persisted round score

### Validation Rules

- If `multiplierApplied` is true, `multipliedTotal` must be derived before additive
  modifiers are added
- `flip7Bonus` must be 15 only when the player achieved Flip 7, otherwise 0
