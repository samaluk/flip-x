# Game Rules

> **Note:** flip-x is an unofficial fan-made implementation. These rules describe the
> gameplay modeled by this app, not an official rulebook.

flip-x models a press-your-luck card game where players collect face-up cards, trying to score points without drawing a duplicate number. The base deck has 94 cards: number cards from 0–12, with one 0, one 1, two 2s, three 3s, and so on up to twelve 12s; 3 Freeze cards, 3 Flip Three cards, 3 Second Chance cards; and modifier cards +2, +4, +6, +8, +10, and x2. The goal is to reach 200+ total points, but the winner is only decided at the end of a round.

A good implementation model is this: each player has a round state of active, stayed, frozen, or busted. Only active players can be asked “hit or stay?” and only active players can receive action cards. Stayed and frozen players are safe and will score at round end. Busted players score zero for the round.

At the start of a round, the dealer deals one card face-up to each player. If an action card appears during this opening deal, play pauses and the action card resolves immediately before the dealer continues the opening deal. This matters because a player can be frozen before ever receiving a normal starting card, and a Flip Three can also happen before the normal turn cycle begins.

On a normal turn, the dealer asks the next active player whether they want to hit or stay. If they stay, they stop receiving cards for the rest of the round and will score their current cards later. If they hit, they receive one face-up card. A number card is placed in their number row. A modifier card is placed with their scoring modifiers. An action card resolves immediately.

A player busts only when they receive a second number card matching a number already in their row. Modifier cards and action cards cannot directly bust a player. The 0 is a number card, so a second 0 would bust, even though its scoring value is zero. When a player busts, they are out of the round and score zero. In physical play, busted cards are left in front of the player, usually face-down, and moved to the discard pile at round end.

A player flips 7 when they have seven unique number cards in front of them. Modifier cards and action cards do not count toward the seven. As soon as anyone reaches seven unique number cards, the round ends immediately for everyone, and that player gets a +15 bonus. This can happen during a normal hit or during a Flip Three resolution; either way, stop drawing more cards immediately.

Freeze is an action card. The player who is dealt the Freeze chooses any active player, including themselves, to receive it. That target is frozen, meaning they are done for the round and will score their current cards. A frozen player is not busted. If the player dealt the Freeze is the only active player left, they must use it on themselves. A Second Chance cannot block Freeze; Second Chance only prevents busting from duplicate number cards.

Flip Three is the biggest edge-case generator. The player who is dealt Flip Three chooses any active player, including themselves, to resolve it. In this app, Flip Three remains a manual sequence: after the target is chosen, the target manually hits for each required Flip Three draw, matching how the physical table experience prompts each draw. The sequence still represents one pending Flip Three effect. The target draws up to three cards, one at a time. Every drawn card counts toward the three-card total, including modifiers, action cards, and Second Chance cards. If the target busts before three cards are drawn, stop immediately. If the target flips 7 before three cards are drawn, stop immediately and end the round for everyone.

During Flip Three, Second Chance cards resolve immediately. If the player does not already have a Second Chance, they may keep it and can even use it later during the same Flip Three if a duplicate number appears. If a duplicate number appears and Second Chance prevents the bust, the duplicate number and Second Chance are discarded, that draw still counts toward the three-card Flip Three total, and the Flip Three sequence continues if draws remain. If they already have a Second Chance, they cannot keep the new one; it must be assigned to another active player, or discarded if no valid active player exists.

During Flip Three, newly drawn Freeze or Flip Three cards are not resolved immediately. They are set aside until the original Flip Three finishes. If the target later busts or flips 7 during that Flip Three, the set-aside Freeze/Flip Three cards are discarded and never resolve. If the target successfully draws all three cards without busting or flipping 7, then the set-aside action cards are assigned in the order they were drawn and resolved in that order.

If multiple Freeze or Flip Three cards are drawn during a Flip Three, preserve draw order. Assign them in draw order, then resolve them in assignment order. The same player can receive multiple set-aside action cards. If a player receives Freeze first and Flip Three second, the Freeze resolves, that player becomes inactive, and the later Flip Three is discarded. If a player receives two Flip Three cards, they resolve the first; if they do not bust or flip 7, they must then resolve the second.

Second Chance is a protection card. When a player with a Second Chance would bust from a duplicate number card, they discard both the Second Chance and the duplicate number card. The player does not bust, but their turn ends immediately. They do not draw a replacement card right away; they wait until their next turn. A player may never have more than one Second Chance. Unused Second Chance cards are discarded at the end of the round.

Modifier cards affect scoring only. The +2, +4, +6, +8, and +10 cards add that many points if the player does not bust. The x2 card doubles only the sum of the number cards. It does not double plus modifiers or the +15 Flip 7 bonus. The scoring order is: sum number cards, apply x2 if present, add plus modifiers, then add the +15 Flip 7 bonus if applicable.

If a player ends the round with only plus modifiers and no number cards, the plus modifiers still score. If they only have x2 and no number cards, x2 contributes zero because there is no number-card sum to double. For example, +2, +6, and x2 with no number cards scores 8, not 16.

A round ends when there are no active players left because everyone has stayed, frozen, or busted; or immediately when someone flips 7. At round end, busted players score zero. All non-busted players score their number cards plus modifiers, following the scoring order above. Then all cards in front of players, including unused Second Chance cards, go to the discard pile.

The deck handling is slightly unusual. You do not fully reshuffle all cards every round. Cards used in a completed round go to a discard pile. The unused draw deck continues into later rounds. When the draw deck runs out, shuffle the discard pile to form a new draw deck. If the deck runs out mid-round, only shuffle cards already in the discard pile; cards currently in front of players remain unavailable. If both the draw pile and discard pile are empty when a draw is required, that is an invalid domain state and should surface as an error rather than silently scoring or inventing cards.

The game ends only after a round in which at least one player has 200+ total points. If one player has the highest score, they win. If multiple players are tied for the highest score at 200+, only those tied contender players continue playing additional rounds until there is one unique winner.

Important implementation edge cases:

A player who busts during Flip Three stops drawing immediately. Do not continue drawing until three cards have been drawn.

A player who flips 7 during Flip Three stops drawing immediately. The whole round ends immediately.

If a Flip Three is assigned to another player, turn order resumes from the player after the original player who was dealt the Flip Three, not from the player who resolved it.

If an action card appears during the opening deal, it resolves immediately. A Freeze can eliminate a player before they receive a starting number card.

If a player receives Flip Three during the opening deal and gives it to someone who has not yet received their initial card, that target begins the manual Flip Three sequence immediately. If they survive, they are not automatically forced to receive another “initial” card later; when reached, they should be asked hit or stay.

If the only active player draws Freeze or Flip Three, they must assign it to themselves.

A stayed, frozen, or busted player is not an active player and should not receive new action cards.

A Second Chance cannot stop Freeze, Flip Three, modifiers, or anything except a duplicate number bust.

After using Second Chance, both the Second Chance and duplicate number are discarded, and the player’s turn ends.

If a player already has Second Chance and draws another, they cannot keep it.

If a Second Chance is drawn during Flip Three and kept, it can be used later in that same Flip Three.

If Freeze or Flip Three is drawn during Flip Three, set it aside; do not resolve it until the original Flip Three finishes successfully.

If the original Flip Three ends by bust or Flip 7, discard all set-aside Freeze/Flip Three cards.

If several set-aside action cards exist, assign and resolve them in the order drawn.

If a player is assigned Freeze and then Flip Three, Freeze makes them inactive, so the later Flip Three is discarded.
