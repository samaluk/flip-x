import { DatabaseSchema as $DatabaseSchema } from "@confect/server";

import idempotencyKeys from "./tables/idempotencyKeys";
import matches from "./tables/matches";
import playerSessions from "./tables/playerSessions";
import players from "./tables/players";
import roundEvents from "./tables/roundEvents";
import roundPlayerStates from "./tables/roundPlayerStates";
import rounds from "./tables/rounds";
import scoreBreakdowns from "./tables/scoreBreakdowns";

const databaseSchema: $DatabaseSchema.DatabaseSchema<
  typeof idempotencyKeys |
  typeof matches |
  typeof playerSessions |
  typeof players |
  typeof roundEvents |
  typeof roundPlayerStates |
  typeof rounds |
  typeof scoreBreakdowns
> = $DatabaseSchema.make({
  idempotencyKeys,
  matches,
  playerSessions,
  players,
  roundEvents,
  roundPlayerStates,
  rounds,
  scoreBreakdowns,
});

export default databaseSchema;
