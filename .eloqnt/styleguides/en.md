# English styleguide

## Audience

Players at a shared table using flip-x to run a press-your-luck card game with live scoring, turn tracking, and action-card resolution. Copy should feel clear at a glance during play.

## Voice and tone

- Friendly, direct, and concise — players are mid-game.
- Address the user as "you" and prefer active voice.
- Use sentence case for UI labels and short status lines unless a proper noun requires otherwise.
- Keep error and toast messages actionable: say what happened and what to do next when possible.

## Branding

- Always write the product name as **flip-x** (lowercase, hyphenated).
- Do not translate or localize the brand name.

## Game terminology

Keep these terms consistent across English source strings and translations:

| Term | Usage |
| --- | --- |
| flip-x | The game-ending bonus when a player collects seven unique number cards in a round |
| action card | A card that triggers a special effect (not a number card) |
| number card | A scored card showing a value |
| round | One scoring cycle before cards reset |
| turn | One player's draw/play sequence |
| bust | Losing round points after drawing a duplicate number |
| freeze | Action card that locks a player's lane |
| second chance | Action card that can negate a bust |
| flip three | Action card that forces extra draws |
| lane | A player's row of cards on the table |
| lobby | Pre-game waiting room before the match starts |
| match | A full game session toward 200 points |

When the UI names an action card, match the Title Case labels used in source (`Flip Three`, `Freeze`, `Second Chance`).

## Formatting

- Preserve ICU placeholders exactly (`{name}`, `{count}`, `{duplicate}`, etc.).
- Do not add, remove, or rename placeholders.
- Prefer typographic ellipsis `…` where the English source uses it.

## Do not translate

- flip-x
- Player-chosen display names passed through as `{name}` or similar placeholders
