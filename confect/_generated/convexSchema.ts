import { defineSchema as $defineSchema } from "convex/server";

import idempotencyKeys from "./tables/idempotencyKeys";
import matches from "./tables/matches";
import playerSessions from "./tables/playerSessions";
import players from "./tables/players";
import roundEvents from "./tables/roundEvents";
import roundPlayerStates from "./tables/roundPlayerStates";
import rounds from "./tables/rounds";
import scoreBreakdowns from "./tables/scoreBreakdowns";

export default $defineSchema({
  idempotencyKeys: idempotencyKeys.tableDefinition,
  matches: matches.tableDefinition,
  playerSessions: playerSessions.tableDefinition,
  players: players.tableDefinition,
  roundEvents: roundEvents.tableDefinition,
  roundPlayerStates: roundPlayerStates.tableDefinition,
  rounds: rounds.tableDefinition,
  scoreBreakdowns: scoreBreakdowns.tableDefinition,
});
