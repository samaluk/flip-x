import type { Card } from "../logic/card-types";

type CommandMetadata = {
  expectedVersion: number;
  idempotencyKey: string;
};

export type GameCommand =
  | (CommandMetadata & {
      type: "START_MATCH";
      deterministicStart?: { roundSeed: { drawPile: Card[] } };
    })
  | (CommandMetadata & {
      type: "START_NEXT_ROUND";
      deterministicStart?: { roundSeed: { drawPile: Card[] } };
    })
  | (CommandMetadata & {
      type: "TAKE_TURN";
      action: "hit" | "stay";
    })
  | (CommandMetadata & {
      type: "RESOLVE_ACTION";
      targetPlayerId: string;
    });
