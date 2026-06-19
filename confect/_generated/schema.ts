import { DatabaseSchema as $DatabaseSchema } from "@confect/server";

import idempotencyKeys from "./tables/idempotencyKeys";
import matches from "./tables/matches";
import playerSessions from "./tables/playerSessions";
import players from "./tables/players";
import roundEvents from "./tables/roundEvents";
import roundPlayerStates from "./tables/roundPlayerStates";
import rounds from "./tables/rounds";
import scoreBreakdowns from "./tables/scoreBreakdowns";

export default $DatabaseSchema.make({
  idempotencyKeys,
  matches,
  playerSessions,
  players,
  roundEvents,
  roundPlayerStates,
  rounds,
  scoreBreakdowns,
});
