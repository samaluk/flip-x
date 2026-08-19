import type { Card } from "../../game/logic/card-types";

export type DeterministicStartInput = {
  readonly roundSeed: { readonly drawPile: readonly Card[] };
};
export type DeterministicStartOutput = { roundSeed: { drawPile: Card[] } };

export function cloneDeterministicStart(
  deterministicStart?: DeterministicStartInput,
): DeterministicStartOutput | undefined {
  return deterministicStart
    ? { roundSeed: { drawPile: [...deterministicStart.roundSeed.drawPile] } }
    : undefined;
}
