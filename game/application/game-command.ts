import type { Card } from "../logic/card-types";

export type GameCommand =
  | {
      type: "START_MATCH";
      deterministicStart?: { roundSeed: { drawPile: Card[] } };
    }
  | {
      type: "START_NEXT_ROUND";
      deterministicStart?: { roundSeed: { drawPile: Card[] } };
    }
  | {
      type: "TAKE_TURN";
      action: "hit" | "stay";
    }
  | {
      type: "RESOLVE_ACTION";
      targetPlayerId: string;
    };
