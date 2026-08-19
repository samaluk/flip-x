import type { Id } from "@/convex/_generated/dataModel";
import type { FlipXCardComparable } from "@/game/ui/flip-x-card";
import type { MatchSnapshot } from "@/game/logic/view-models";

/**
 * Comparison helpers for `PlayerLane` memoization. These live in their own
 * module so the lane component stays focused on rendering and the type-specific
 * comparison behavior is testable in isolation.
 */

export type SnapshotPlayer = MatchSnapshot["players"][number];

export type LaneRoundStatus = SnapshotPlayer["roundStatus"];

/**
 * The status shown in the lane UI: a lingering bust card always reads as
 * "busted" even after the round moves to "completed", so the resolved badge
 * and card pose stay stable while the bust card is on the table.
 */
export function getDisplayStatus(player: SnapshotPlayer): LaneRoundStatus {
  if (player.bustCard !== null) {
    return "busted";
  }
  return player.roundStatus;
}

const PLAYER_LANE_MEMO_SCALAR_KEYS = [
  "isActive",
  "isDealer",
  "isViewer",
  "isPinned",
  "compact",
  "disableCardFlip3d",
  "overlapCards",
  "isActionSource",
  "isTargetable",
  "isSelfTargeting",
  "incomingActionKind",
  "flip3Remaining",
] as const satisfies readonly (keyof PlayerLaneProps)[];

export type PlayerLaneProps = {
  player: SnapshotPlayer;
  isActive: boolean;
  isDealer?: boolean;
  isViewer?: boolean;
  isPinned?: boolean;
  compact?: boolean;
  /** No CSS 3D flip (reliable faces in headless screenshots). */
  disableCardFlip3d?: boolean;
  /** Overlap cards horizontally; fan out on lane hover (round table opponents). */
  overlapCards?: boolean;
  /** Player is the source of pending action (needs to pick target) */
  isActionSource?: boolean;
  /** This player lane is an eligible target */
  isTargetable?: boolean;
  /** Viewer can target themselves */
  isSelfTargeting?: boolean;
  /** Action being targeted at this player */
  incomingActionKind?: "flip_three" | "freeze" | null;
  /** Flip 3 cards remaining to draw */
  flip3Remaining?: number | null;
  /** Callback when player is clicked as target */
  onSelectTarget?: (playerId: Id<"players">) => void;
};

export function arePlayerLanePropsEqual(left: PlayerLaneProps, right: PlayerLaneProps) {
  for (const key of PLAYER_LANE_MEMO_SCALAR_KEYS) {
    if (left[key] !== right[key]) {
      return false;
    }
  }
  // why: only the presence of the callback matters for rendering (a new arrow
  // function is created on every parent render), not its identity.
  if (Boolean(left.onSelectTarget) !== Boolean(right.onSelectTarget)) {
    return false;
  }
  return arePlayersEqual(left.player, right.player);
}

export function arePlayersEqual(left: SnapshotPlayer, right: SnapshotPlayer) {
  return arePlayerSnapshotScalarsEqual(left, right) && arePlayerSnapshotCardsEqual(left, right);
}

// fallow-ignore-next-line code-duplication -- reviewed: mirrors the FlipXCard memo's 8-field shell comparison; kept separate because the lane compares different prop keys (player fields, not card shell props)
function arePlayerSnapshotScalarsEqual(left: SnapshotPlayer, right: SnapshotPlayer) {
  return (
    left.playerId === right.playerId &&
    left.displayName === right.displayName &&
    left.colorId === right.colorId &&
    left.seatIndex === right.seatIndex &&
    left.totalScore === right.totalScore &&
    left.isOnline === right.isOnline &&
    left.roundStatus === right.roundStatus &&
    // why: pointsAtRisk is derived from the drawn cards and changes exactly
    // when the compared card arrays (numberCards/modifierCards/bustCard)
    // change, so including it would duplicate that comparison.
    left.pointsAtRisk === right.pointsAtRisk
  );
}

function arePlayerSnapshotCardsEqual(left: SnapshotPlayer, right: SnapshotPlayer) {
  return (
    areNumberCardsEqual(left.numberCards, right.numberCards) &&
    areNumberCardEqual(left.bustCard, right.bustCard) &&
    areModifierCardsEqual(left.modifierCards, right.modifierCards) &&
    areActionCardsEqual(left.heldActionCards, right.heldActionCards) &&
    areActionCardsEqual(left.receivedActionCards, right.receivedActionCards)
  );
}

function areNumberCardEqual(left: SnapshotPlayer["bustCard"], right: SnapshotPlayer["bustCard"]) {
  return (
    left?.id === right?.id &&
    left?.label === right?.label &&
    left?.numberValue === right?.numberValue
  );
}

function areParallelSnapshotCardsEqual<A, B>(
  left: readonly A[],
  right: readonly B[],
  sameAtIndex: (a: A, b: B) => boolean,
): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let i = 0; i < left.length; i++) {
    if (!sameAtIndex(left[i], right[i])) {
      return false;
    }
  }
  return true;
}

export function areNumberCardsEqual(
  left: SnapshotPlayer["numberCards"],
  right: SnapshotPlayer["numberCards"],
) {
  return areParallelSnapshotCardsEqual(left, right, (a, b) =>
    // why: number cards compare by id, label, and value — same fields the
    // FlipXCard memo comparison uses for its number face.
    areNumberCardComparableEqual(a, b),
  );
}

export function areModifierCardsEqual(
  left: SnapshotPlayer["modifierCards"],
  right: SnapshotPlayer["modifierCards"],
) {
  return areParallelSnapshotCardsEqual(left, right, (a, b) =>
    // why: modifier cards compare by id, label, and value — same fields the
    // FlipXCard memo comparison uses for its modifier face.
    areModifierCardComparableEqual(a, b),
  );
}

export function areActionCardsEqual(
  left: SnapshotPlayer["heldActionCards"],
  right: SnapshotPlayer["heldActionCards"],
) {
  // why: action cards are identity-free (label + actionKind only) because the
  // lane renders them with composite keys derived from playerId + kind + label,
  // so two cards with the same label/kind are interchangeable in the memo.
  return areParallelSnapshotCardsEqual(left, right, (a, b) => areActionCardComparableEqual(a, b));
}

type NumberCardComparable = FlipXCardComparable & {
  id: string;
  numberValue: number;
};

type ModifierCardComparable = FlipXCardComparable & {
  id: string;
  modifierValue: number | "x2";
};

type ActionCardComparable = FlipXCardComparable & {
  actionKind: string;
};

function areNumberCardComparableEqual(a: NumberCardComparable, b: NumberCardComparable) {
  return a.id === b.id && a.label === b.label && a.numberValue === b.numberValue;
}

function areModifierCardComparableEqual(a: ModifierCardComparable, b: ModifierCardComparable) {
  return a.id === b.id && a.label === b.label && a.modifierValue === b.modifierValue;
}

function areActionCardComparableEqual(a: ActionCardComparable, b: ActionCardComparable) {
  return a.label === b.label && a.actionKind === b.actionKind;
}
