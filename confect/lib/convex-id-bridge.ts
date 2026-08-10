/* oxlint-disable typescript/no-unsafe-type-assertion --
   Convex document IDs are strings at runtime. Confect Effect specs use
   `Schema.String` for ids on the wire; Convex `v.id` validates at the handler
   boundary. These helpers are the single place we assert string to branded Id.
 */
import type { Id } from "../../convex/_generated/dataModel";

export function matchIdFromConfectWire(raw: string): Id<"matches"> {
  // oxlint-disable-next-line typescript/consistent-type-assertions
  return raw as Id<"matches">;
}

export function playerIdFromConfectWire(raw: string): Id<"players"> {
  // oxlint-disable-next-line typescript/consistent-type-assertions
  return raw as Id<"players">;
}
