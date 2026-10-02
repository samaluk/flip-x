import { defineSchema as $defineSchema } from "convex/server";
import { Table as $Table } from "@confect/server";

import idempotencyKeys from "./tables/idempotencyKeys";
import matches from "./tables/matches";
import playerSessions from "./tables/playerSessions";
import players from "./tables/players";
import roundEvents from "./tables/roundEvents";
import roundPlayerStates from "./tables/roundPlayerStates";
import rounds from "./tables/rounds";
import scoreBreakdowns from "./tables/scoreBreakdowns";

export default $defineSchema({
  idempotencyKeys: $Table.tableDefinition(idempotencyKeys),
  matches: $Table.tableDefinition(matches),
  playerSessions: $Table.tableDefinition(playerSessions),
  players: $Table.tableDefinition(players),
  roundEvents: $Table.tableDefinition(roundEvents),
  roundPlayerStates: $Table.tableDefinition(roundPlayerStates),
  rounds: $Table.tableDefinition(rounds),
  scoreBreakdowns: $Table.tableDefinition(scoreBreakdowns),
});
