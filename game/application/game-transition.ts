import type { Id } from "../../convex/_generated/dataModel";
import type { RoundEvent } from "../logic/events";
import type { PlayerRoundState, RoundRuntime } from "../logic/round-state";
import type { GameCommand } from "./game-command";
import type { RoundCompletionOutcome } from "./round-completion";

export type GameTransition = {
  command: GameCommand["type"];
  roundWrite:
    | {
        kind: "create";
        roundNumber: number;
        startedAt: number;
        round: RoundRuntime;
      }
    | {
        kind: "update";
        roundId: Id<"rounds">;
        round: RoundRuntime;
      };
  playerStates: Record<string, PlayerRoundState>;
  events: RoundEvent[];
  finalized?: RoundCompletionOutcome;
  matchUpdateContext: {
    nextMatchStatus?: "in_progress" | "completed";
    nextCurrentRoundNumber?: number;
    nextDealerSeat?: number;
  };
};
