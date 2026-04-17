import {
  type ActionCard,
  type ActionKind,
  type Card,
  createDeck,
  isModifierCard,
  isNumberCard,
  type ModifierCard,
  type NumberCard,
} from "./card-types";
import { scoreRound } from "./scoring";

export type PlayerRoundStatus = "waiting" | "active" | "stayed" | "busted" | "frozen" | "completed";

export type RoundPhase = "dealing" | "player_turns" | "resolving_action" | "scoring" | "completed";

export type OrderedPlayer = {
  playerId: string;
  seatIndex: number;
};

export type PendingAction = {
  sourcePlayerId: string;
  actionKind: Exclude<ActionKind, "second_chance">;
  eligibleTargetIds: string[];
  resume: "dealing" | "turns";
};

export type PendingFlip3 = {
  sourcePlayerId: string;
  targetPlayerId: string;
  cardsRemaining: number;
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

export type RoundEvent = {
  eventType: string;
  actorPlayerId: string | null;
  targetPlayerId: string | null;
  payload: Record<string, unknown>;
};

export function cardEventPayload(card: Card): Record<string, unknown> {
  if (isNumberCard(card)) {
    return { cardKind: "number", numberValue: card.numberValue };
  }
  if (isModifierCard(card)) {
    return { cardKind: "modifier", modifierValue: card.modifierValue };
  }
  return { cardKind: "action", actionKind: card.actionKind };
}

export type ResolveResult = {
  round: RoundRuntime;
  playerStates: Record<string, PlayerRoundState>;
  events: RoundEvent[];
};

function clonePlayerState(playerState: PlayerRoundState): PlayerRoundState {
  return {
    ...playerState,
    numberCards: [...playerState.numberCards],
    modifierCards: [...playerState.modifierCards],
    heldActionCards: [...playerState.heldActionCards],
    receivedActionCards: [...playerState.receivedActionCards],
  };
}

function clonePlayerStates(
  playerStates: Record<string, PlayerRoundState>,
): Record<string, PlayerRoundState> {
  return Object.fromEntries(
    Object.entries(playerStates).map(([playerId, playerState]) => [
      playerId,
      clonePlayerState(playerState),
    ]),
  );
}

function orderedPlayerIds(players: OrderedPlayer[]) {
  return [...players].toSorted((left, right) => left.seatIndex - right.seatIndex);
}

function getPlayerBySeat(players: OrderedPlayer[], seatIndex: number) {
  const total = players.length;
  const normalized = ((seatIndex % total) + total) % total;
  return orderedPlayerIds(players)[normalized];
}

function nextActiveSeatIndex(
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
  seatIndex: number,
) {
  for (let offset = 1; offset <= players.length; offset += 1) {
    const player = getPlayerBySeat(players, seatIndex + offset);

    if (playerStates[player.playerId]?.status === "active") {
      return player.seatIndex;
    }
  }

  return null;
}

function activePlayerIds(players: OrderedPlayer[], playerStates: Record<string, PlayerRoundState>) {
  return orderedPlayerIds(players)
    .filter((player) => playerStates[player.playerId]?.status === "active")
    .map((player) => player.playerId);
}

function updatePointsAtRisk(playerState: PlayerRoundState) {
  const breakdown = scoreRound(
    playerState.numberCards,
    playerState.modifierCards,
    playerState.hasFlip7,
  );
  playerState.pointsAtRisk = breakdown.finalRoundScore;
  return breakdown;
}

function addEvent(events: RoundEvent[], event: RoundEvent) {
  events.push(event);
}

function discardCard(round: RoundRuntime, card: Card) {
  round.discardPile.push(card);
}

function drawCard(round: RoundRuntime) {
  return round.drawPile.shift() ?? null;
}

function createPendingTargetAction(
  round: RoundRuntime,
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
  sourcePlayerId: string,
  actionKind: PendingAction["actionKind"],
  resume: PendingAction["resume"],
  events: RoundEvent[],
) {
  const eligibleTargetIds = activePlayerIds(players, playerStates);

  if (eligibleTargetIds.length === 0) {
    return null;
  }

  if (resume === "dealing") {
    if (eligibleTargetIds.length === 1) {
      return eligibleTargetIds[0];
    }
    return null;
  }

  if (eligibleTargetIds.length === 1) {
    return eligibleTargetIds[0];
  }

  round.phase = "resolving_action";
  round.pendingAction = {
    sourcePlayerId,
    actionKind,
    eligibleTargetIds,
    resume,
  };

  addEvent(events, {
    eventType: "pending_action",
    actorPlayerId: sourcePlayerId,
    targetPlayerId: null,
    payload: { actionKind },
  });

  return null;
}

function applyHeldSecondChance(
  round: RoundRuntime,
  playerState: PlayerRoundState,
  duplicateCard: NumberCard,
  events: RoundEvent[],
) {
  const secondChanceIndex = playerState.heldActionCards.findIndex(
    (card) => card.actionKind === "second_chance",
  );

  if (secondChanceIndex === -1) {
    return false;
  }

  const [secondChance] = playerState.heldActionCards.splice(secondChanceIndex, 1);

  discardCard(round, secondChance);
  discardCard(round, duplicateCard);

  addEvent(events, {
    eventType: "second_chance_used",
    actorPlayerId: playerState.playerId,
    targetPlayerId: playerState.playerId,
    payload: { duplicate: duplicateCard.numberValue },
  });

  updatePointsAtRisk(playerState);
  return true;
}

function applyResolvedTargetAction(
  round: RoundRuntime,
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
  sourcePlayerId: string,
  actionKind: PendingAction["actionKind"],
  targetPlayerId: string,
  events: RoundEvent[],
) {
  const sourceState = playerStates[sourcePlayerId];
  const targetState = playerStates[targetPlayerId];

  if (!targetState) {
    return;
  }

  const cardIndex = sourceState.heldActionCards.findIndex(
    (c) => c.actionKind === actionKind,
  );
  if (cardIndex !== -1) {
    const [card] = sourceState.heldActionCards.splice(cardIndex, 1);
    targetState.receivedActionCards.push(card);
  }

  if (actionKind === "freeze") {
    targetState.status = "frozen";
    updatePointsAtRisk(targetState);
    addEvent(events, {
      eventType: "freeze_applied",
      actorPlayerId: sourcePlayerId,
      targetPlayerId,
      payload: {},
    });
    return;
  }

  addEvent(events, {
    eventType: "flip_three_targeted",
    actorPlayerId: sourcePlayerId,
    targetPlayerId,
    payload: { cardsRemaining: 3 },
  });

  round.pendingFlip3 = {
    sourcePlayerId,
    targetPlayerId,
    cardsRemaining: 3,
  };
}

function applyCardToPlayer(
  round: RoundRuntime,
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
  playerId: string,
  card: Card,
  resume: PendingAction["resume"],
  events: RoundEvent[],
) {
  const playerState = playerStates[playerId];

  if (!playerState) {
    return { pending: false };
  }

  if (isNumberCard(card)) {
    const alreadyHasNumber = playerState.numberCards.some(
      (existingCard) => existingCard.numberValue === card.numberValue,
    );

    if (alreadyHasNumber) {
      const preventedBust = applyHeldSecondChance(round, playerState, card, events);

      if (!preventedBust) {
        playerState.status = "busted";
        playerState.roundScore = 0;
        playerState.pointsAtRisk = 0;
        discardCard(round, card);
        addEvent(events, {
          eventType: "duplicate_bust",
          actorPlayerId: playerId,
          targetPlayerId: playerId,
          payload: { duplicate: card.numberValue },
        });
      }

      return { pending: false };
    }

    playerState.numberCards.push(card);
    playerState.hasFlip7 = playerState.numberCards.length >= 7;
    updatePointsAtRisk(playerState);

    addEvent(events, {
      eventType: "number_drawn",
      actorPlayerId: playerId,
      targetPlayerId: playerId,
      payload: { numberValue: card.numberValue },
    });

    if (playerState.hasFlip7) {
      round.endedBy = "flip7";
      round.phase = "scoring";
      round.activePlayerId = playerId;
      addEvent(events, {
        eventType: "flip7",
        actorPlayerId: playerId,
        targetPlayerId: playerId,
        payload: {},
      });
    }

    return { pending: false };
  }

  if (isModifierCard(card)) {
    playerState.modifierCards.push(card);
    updatePointsAtRisk(playerState);
    addEvent(events, {
      eventType: "modifier_drawn",
      actorPlayerId: playerId,
      targetPlayerId: playerId,
      payload: { modifierValue: card.modifierValue },
    });
    return { pending: false };
  }

  if (card.actionKind === "second_chance") {
    const alreadyHasSecondChance = playerState.heldActionCards.some(
      (heldCard) => heldCard.actionKind === "second_chance",
    );

    if (!alreadyHasSecondChance) {
      playerState.heldActionCards.push(card);
      addEvent(events, {
        eventType: "second_chance_held",
        actorPlayerId: playerId,
        targetPlayerId: playerId,
        payload: {},
      });
      return { pending: false };
    }

    const eligibleRecipients = activePlayerIds(players, playerStates).filter(
      (candidateId) =>
        candidateId !== playerId &&
        !playerStates[candidateId].heldActionCards.some(
          (heldCard) => heldCard.actionKind === "second_chance",
        ),
    );

    if (eligibleRecipients.length === 0) {
      discardCard(round, card);
      addEvent(events, {
        eventType: "second_chance_discarded",
        actorPlayerId: playerId,
        targetPlayerId: null,
        payload: {},
      });
      return { pending: false };
    }

    const recipient = eligibleRecipients[0];
    playerStates[recipient].heldActionCards.push(card);
    addEvent(events, {
      eventType: "second_chance_passed",
      actorPlayerId: playerId,
      targetPlayerId: recipient,
      payload: {},
    });
    return { pending: false };
  }

  const targetOrPending = createPendingTargetAction(
    round,
    players,
    playerStates,
    playerId,
    card.actionKind,
    resume,
    events,
  );

  playerState.heldActionCards.push(card);

  if (typeof targetOrPending === "string") {
    applyResolvedTargetAction(
      round,
      players,
      playerStates,
      playerId,
      card.actionKind,
      targetOrPending,
      events,
    );
    return { pending: false };
  }

  return { pending: Boolean(round.pendingAction) };
}

function maybeFinishRound(
  round: RoundRuntime,
  players: OrderedPlayer[],
  playerStates: Record<string, PlayerRoundState>,
) {
  if (round.phase === "scoring") {
    return;
  }

  const flip3 = round.pendingFlip3;
  if (flip3 && flip3.cardsRemaining > 0) {
    return;
  }

  if (activePlayerIds(players, playerStates).length === 0) {
    round.phase = "scoring";
    round.endedBy = "all_inactive";
    round.activePlayerId = null;
  }
}

export function createPlayerRoundStates(players: OrderedPlayer[]) {
  return Object.fromEntries(
    players.map((player) => [
      player.playerId,
      {
        playerId: player.playerId,
        status: "waiting",
        numberCards: [],
        modifierCards: [],
        heldActionCards: [],
        receivedActionCards: [],
        roundScore: 0,
        pointsAtRisk: 0,
        hasFlip7: false,
      } satisfies PlayerRoundState,
    ]),
  );
}

export function createRoundRuntime(
  players: OrderedPlayer[],
  roundNumber: number,
  dealerSeat: number,
) {
  const firstPlayer = getPlayerBySeat(players, dealerSeat);

  return {
    phase: "dealing",
    roundNumber,
    dealerSeat,
    drawPile: createDeck(),
    discardPile: [],
    openingSeatIndex: firstPlayer.seatIndex,
    turnSeatIndex: firstPlayer.seatIndex,
    activePlayerId: firstPlayer.playerId,
    endedBy: "unknown",
    pendingAction: null,
    pendingFlip3: null,
  } satisfies RoundRuntime;
}

export function continueRound(
  players: OrderedPlayer[],
  roundInput: RoundRuntime,
  playerStatesInput: Record<string, PlayerRoundState>,
) {
  const round: RoundRuntime = {
    ...roundInput,
    drawPile: [...roundInput.drawPile],
    discardPile: [...roundInput.discardPile],
    pendingAction: roundInput.pendingAction ? { ...roundInput.pendingAction } : null,
    pendingFlip3: roundInput.pendingFlip3 ? { ...roundInput.pendingFlip3 } : null,
  };
  const playerStates = clonePlayerStates(playerStatesInput);
  const events: RoundEvent[] = [];

  while (round.phase === "dealing" && !round.pendingAction && !round.pendingFlip3) {
    const player = getPlayerBySeat(players, round.openingSeatIndex);
    const playerState = playerStates[player.playerId];

    if (!playerState) {
      break;
    }

    if (playerState.status === "waiting") {
      playerState.status = "active";
    }

    const card = drawCard(round);

    if (!card) {
      break;
    }

    addEvent(events, {
      eventType: "initial_deal",
      actorPlayerId: player.playerId,
      targetPlayerId: player.playerId,
      payload: cardEventPayload(card),
    });

    applyCardToPlayer(round, players, playerStates, player.playerId, card, "dealing", events);

    if (round.phase !== "dealing") {
      break;
    }

    round.openingSeatIndex += 1;

    if (round.openingSeatIndex >= players.length) {
      round.phase = "player_turns";
      const firstActiveSeat = nextActiveSeatIndex(players, playerStates, round.dealerSeat - 1);
      round.turnSeatIndex = firstActiveSeat ?? round.dealerSeat;
      round.activePlayerId =
        firstActiveSeat === null ? null : getPlayerBySeat(players, firstActiveSeat).playerId;
      break;
    }
  }

  maybeFinishRound(round, players, playerStates);

  return { round, playerStates, events } satisfies ResolveResult;
}

export function takeTurnAction(
  players: OrderedPlayer[],
  roundInput: RoundRuntime,
  playerStatesInput: Record<string, PlayerRoundState>,
  playerId: string,
  action: "hit" | "stay",
) {
  const round: RoundRuntime = {
    ...roundInput,
    drawPile: [...roundInput.drawPile],
    discardPile: [...roundInput.discardPile],
    pendingAction: roundInput.pendingAction ? { ...roundInput.pendingAction } : null,
    pendingFlip3: roundInput.pendingFlip3 ? { ...roundInput.pendingFlip3 } : null,
  };
  const playerStates = clonePlayerStates(playerStatesInput);
  const events: RoundEvent[] = [];
  const currentState = playerStates[playerId];

  if (!currentState || round.phase !== "player_turns" || round.activePlayerId !== playerId) {
    throw new Error("INVALID_TURN");
  }

  if (action === "stay") {
    const flip3 = round.pendingFlip3;
    if (flip3 && flip3.targetPlayerId === playerId && flip3.cardsRemaining > 0) {
      addEvent(events, {
        eventType: "flip3_stayed",
        actorPlayerId: playerId,
        targetPlayerId: playerId,
        payload: { cardsRemaining: flip3.cardsRemaining },
      });
      round.pendingFlip3 = null;
    }
    currentState.status = "stayed";
    currentState.roundScore = currentState.pointsAtRisk;
    addEvent(events, {
      eventType: "stay",
      actorPlayerId: playerId,
      targetPlayerId: playerId,
      payload: {},
    });
  } else {
    const card = drawCard(round);

    if (!card) {
      round.phase = "scoring";
    } else {
      const flip3 = round.pendingFlip3;
      const isFlip3Turn = flip3 && flip3.targetPlayerId === playerId && flip3.cardsRemaining > 0;

      addEvent(events, {
        eventType: isFlip3Turn ? "flip3_hit" : "hit",
        actorPlayerId: playerId,
        targetPlayerId: playerId,
        payload: cardEventPayload(card),
      });

      applyCardToPlayer(round, players, playerStates, playerId, card, "turns", events);

      if (isFlip3Turn && round.pendingFlip3) {
        round.pendingFlip3.cardsRemaining -= 1;
        if (round.pendingFlip3.cardsRemaining <= 0) {
          round.pendingFlip3 = null;
        }
      } else if (isFlip3Turn && !round.pendingFlip3) {
        addEvent(events, {
          eventType: "flip3_completed",
          actorPlayerId: playerId,
          targetPlayerId: playerId,
          payload: {},
        });
      }
    }
  }

  maybeFinishRound(round, players, playerStates);

  if (round.phase === "player_turns" && !round.pendingAction) {
    const nextSeat = nextActiveSeatIndex(players, playerStates, round.turnSeatIndex);
    round.turnSeatIndex = nextSeat ?? round.turnSeatIndex;
    round.activePlayerId = nextSeat === null ? null : getPlayerBySeat(players, nextSeat).playerId;
    maybeFinishRound(round, players, playerStates);
  }

  return { round, playerStates, events } satisfies ResolveResult;
}

export function resolvePendingAction(
  players: OrderedPlayer[],
  roundInput: RoundRuntime,
  playerStatesInput: Record<string, PlayerRoundState>,
  targetPlayerId: string,
) {
  if (!roundInput.pendingAction) {
    throw new Error("INVALID_ACTION");
  }

  const round: RoundRuntime = {
    ...roundInput,
    drawPile: [...roundInput.drawPile],
    discardPile: [...roundInput.discardPile],
    pendingAction: { ...roundInput.pendingAction },
    pendingFlip3: roundInput.pendingFlip3 ? { ...roundInput.pendingFlip3 } : null,
  };
  const playerStates = clonePlayerStates(playerStatesInput);
  const events: RoundEvent[] = [];
  const pendingAction = round.pendingAction;

  if (!pendingAction) {
    throw new Error("INVALID_ACTION");
  }

  if (!pendingAction.eligibleTargetIds.includes(targetPlayerId)) {
    throw new Error("INVALID_TARGET");
  }

  round.pendingAction = null;
  round.phase = pendingAction.resume === "dealing" ? "dealing" : "player_turns";

  applyResolvedTargetAction(
    round,
    players,
    playerStates,
    pendingAction.sourcePlayerId,
    pendingAction.actionKind,
    targetPlayerId,
    events,
  );

  maybeFinishRound(round, players, playerStates);

  if (round.phase === "dealing" && !round.pendingAction) {
    const continued = continueRound(players, round, playerStates);
    return {
      round: continued.round,
      playerStates: continued.playerStates,
      events: [...events, ...continued.events],
    } satisfies ResolveResult;
  }

  return { round, playerStates, events } satisfies ResolveResult;
}

export function finalizeRound(
  roundInput: RoundRuntime,
  playerStatesInput: Record<string, PlayerRoundState>,
) {
  const round = {
    ...roundInput,
    drawPile: [...roundInput.drawPile],
    discardPile: [...roundInput.discardPile],
    pendingAction: null,
    pendingFlip3: null,
    phase: "completed" as const,
  };
  const playerStates = clonePlayerStates(playerStatesInput);
  const events: RoundEvent[] = [];

  for (const playerState of Object.values(playerStates)) {
    if (playerState.status === "busted") {
      playerState.roundScore = 0;
      playerState.pointsAtRisk = 0;
      playerState.status = "completed";
      continue;
    }

    const breakdown = scoreRound(
      playerState.numberCards,
      playerState.modifierCards,
      playerState.hasFlip7,
    );

    playerState.roundScore = breakdown.finalRoundScore;
    playerState.pointsAtRisk = breakdown.finalRoundScore;
    playerState.status = "completed";

    addEvent(events, {
      eventType: "round_scored",
      actorPlayerId: playerState.playerId,
      targetPlayerId: playerState.playerId,
      payload: { finalRoundScore: breakdown.finalRoundScore },
    });
  }

  return { round, playerStates, events } satisfies ResolveResult;
}
