import type { RoundEvent } from "./events";

export type LatestRoundEvent = {
  [TEvent in RoundEvent as TEvent["eventType"]]: {
    type: TEvent["eventType"];
    payload: TEvent["payload"];
    actorPlayerId?: TEvent["actorPlayerId"];
    targetPlayerId?: TEvent["targetPlayerId"];
    playerNames?: string;
  };
}[RoundEvent["eventType"]];

type LatestBase = {
  actorPlayerId: RoundEvent["actorPlayerId"];
  targetPlayerId: RoundEvent["targetPlayerId"];
  playerNames: string | undefined;
};

type TryLatest = (event: RoundEvent, base: LatestBase) => LatestRoundEvent | null;

function buildLatestBase(event: RoundEvent, playerNames: string | undefined): LatestBase {
  return {
    actorPlayerId: event.actorPlayerId,
    targetPlayerId: event.targetPlayerId,
    playerNames,
  };
}

const tryCardTripletLatest: TryLatest = (event, base) => {
  if (
    event.eventType === "initial_deal" ||
    event.eventType === "hit" ||
    event.eventType === "flip3_hit"
  ) {
    return { ...base, type: event.eventType, payload: event.payload };
  }
  return null;
};

const tryNumberDrawnLatest: TryLatest = (event, base) => {
  if (event.eventType !== "number_drawn") {
    return null;
  }
  return { ...base, type: "number_drawn", payload: event.payload };
};

const tryModifierDrawnLatest: TryLatest = (event, base) => {
  if (event.eventType !== "modifier_drawn") {
    return null;
  }
  return { ...base, type: "modifier_drawn", payload: event.payload };
};

const tryEmptyPayloadBlockLatest: TryLatest = (event, base) => {
  const t = event.eventType;
  if (
    t !== "second_chance_held" &&
    t !== "second_chance_discarded" &&
    t !== "flip7" &&
    t !== "freeze_applied" &&
    t !== "stay" &&
    t !== "flip3_completed"
  ) {
    return null;
  }
  return { ...base, type: event.eventType, payload: event.payload };
};

const trySecondChancePassedLatest: TryLatest = (event, base) => {
  if (event.eventType !== "second_chance_passed") {
    return null;
  }
  return { ...base, type: "second_chance_passed", payload: event.payload };
};

const tryDuplicateFamilyLatest: TryLatest = (event, base) => {
  if (event.eventType !== "second_chance_used" && event.eventType !== "duplicate_bust") {
    return null;
  }
  return { ...base, type: event.eventType, payload: event.payload };
};

const tryDeferredPairLatest: TryLatest = (event, base) => {
  if (event.eventType !== "deferred_action" && event.eventType !== "pending_action") {
    return null;
  }
  return { ...base, type: event.eventType, payload: event.payload };
};

const tryFlipThreeTargetedLatest: TryLatest = (event, base) => {
  if (event.eventType !== "flip_three_targeted") {
    return null;
  }
  return { ...base, type: "flip_three_targeted", payload: event.payload };
};

const tryRoundScoredLatest: TryLatest = (event, base) => {
  if (event.eventType !== "round_scored") {
    return null;
  }
  return { ...base, type: "round_scored", payload: event.payload };
};

const latestAttempts: readonly TryLatest[] = [
  tryCardTripletLatest,
  tryNumberDrawnLatest,
  tryModifierDrawnLatest,
  tryEmptyPayloadBlockLatest,
  trySecondChancePassedLatest,
  tryDuplicateFamilyLatest,
  tryDeferredPairLatest,
  tryFlipThreeTargetedLatest,
  tryRoundScoredLatest,
];

export function toLatestRoundEvent(
  event: RoundEvent,
  playerNames: string | undefined,
): LatestRoundEvent {
  const base = buildLatestBase(event, playerNames);
  for (const attempt of latestAttempts) {
    const result = attempt(event, base);
    if (result !== null) {
      return result;
    }
  }
  throw new Error(`Unexpected round event for latest mapping: ${event.eventType}`);
}
