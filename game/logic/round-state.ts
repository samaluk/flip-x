import type { ActionCard, ActionKind, Card, ModifierCard, NumberCard } from "./card-types";
import type { RngService } from "./rng";

type PlayerRoundStatus = "waiting" | "active" | "stayed" | "busted" | "frozen" | "completed";

type RoundPhase = "dealing" | "player_turns" | "resolving_action" | "scoring" | "completed";

export type OrderedPlayer = {
  playerId: string;
  seatIndex: number;
};

export type PendingAction = {
  sourcePlayerId: string;
  actionKind: Exclude<ActionKind, "second_chance">;
  eligibleTargetIds: readonly string[];
  resume: "dealing" | "turns";
};

type PendingFlip3 = {
  sourcePlayerId: string;
  targetPlayerId: string;
  cardsRemaining: number;
  deferredActionCards: ActionCard[];
};

export type PlayerRoundState = {
  playerId: string;
  status: PlayerRoundStatus;
  numberCards: NumberCard[];
  modifierCards: ModifierCard[];
  heldActionCards: ActionCard[];
  receivedActionCards: ActionCard[];
  roundScore: number;
  pointsAtRisk: number;
  hasFlip7: boolean;
  bustCard: NumberCard | null;
};

export type RoundRuntime = {
  phase: RoundPhase;
  roundNumber: number;
  dealerSeat: number;
  drawPile: Card[];
  discardPile: Card[];
  openingSeatIndex: number;
  turnSeatIndex: number;
  activePlayerId: string | null;
  endedBy: "all_inactive" | "flip7" | "unknown";
  pendingAction: PendingAction | null;
  pendingFlip3: PendingFlip3 | null;
};

export type CreateRoundRuntimeOptions = {
  drawPile?: Card[];
  discardPile?: Card[];
  openingSeatIndex?: number;
  turnSeatIndex?: number;
  activePlayerId?: string | null;
  endedBy?: RoundRuntime["endedBy"];
  pendingAction?: PendingAction | null;
  pendingFlip3?: PendingFlip3 | null;
  phase?: RoundPhase;
  rng?: RngService;
  maxNumberCardValue?: number;
};

export type ResolveResult = {
  round: RoundRuntime;
  playerStates: Record<string, PlayerRoundState>;
  events: import("./events").RoundEvent[];
};

function clonePlayerState(playerState: PlayerRoundState): PlayerRoundState {
  return {
    ...playerState,
    numberCards: [...playerState.numberCards],
    modifierCards: [...playerState.modifierCards],
    heldActionCards: [...playerState.heldActionCards],
    receivedActionCards: [...playerState.receivedActionCards],
    bustCard: playerState.bustCard,
  };
}

export function clonePlayerStates(
  playerStates: Record<string, PlayerRoundState>,
): Record<string, PlayerRoundState> {
  return Object.fromEntries(
    Object.entries(playerStates).map(([playerId, playerState]) => [
      playerId,
      clonePlayerState(playerState),
    ]),
  );
}

export function clonePendingFlip3(pendingFlip3: PendingFlip3 | null) {
  return pendingFlip3
    ? {
        ...pendingFlip3,
        deferredActionCards: [...pendingFlip3.deferredActionCards],
      }
    : null;
}

export function cloneRoundRuntime(roundInput: RoundRuntime): RoundRuntime {
  return {
    ...roundInput,
    drawPile: [...roundInput.drawPile],
    discardPile: [...roundInput.discardPile],
    pendingAction: roundInput.pendingAction ? { ...roundInput.pendingAction } : null,
    pendingFlip3: clonePendingFlip3(roundInput.pendingFlip3),
  };
}
