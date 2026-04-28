import { Schema } from "effect";

import { CardValue } from "./card-value-schema";

export const DeterministicStartOptions = Schema.Struct({
  roundSeed: Schema.Struct({
    drawPile: Schema.Array(CardValue),
  }),
});
