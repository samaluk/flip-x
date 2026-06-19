import * as Schema from "effect/Schema";

import { CardValue } from "./card-value-schema";

export const DeterministicStartOptions = Schema.Struct({
  roundSeed: Schema.Struct({
    drawPile: Schema.Array(CardValue),
  }),
});
