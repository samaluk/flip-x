import type { Card } from "../../game/logic/card-types";

type DeterministicStartInput = { readonly roundSeed: { readonly drawPile: readonly Card[] } };
type DeterministicStartOutput = { roundSeed: { drawPile: Card[] } };

export function cloneDeterministicStart(
  deterministicStart?: DeterministicStartInput,
): DeterministicStartOutput | undefined {
  return deterministicStart
    ? { roundSeed: { drawPile: [...deterministicStart.roundSeed.drawPile] } }
    : undefined;
}
