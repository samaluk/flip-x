import { useEffect, useMemo, useRef, useState } from "react";

import type { LaneRoundStatus, SnapshotPlayer } from "@/game/ui/player-lane-compare";
import { getTransitionPose, getLanePose } from "@/game/ui/player-lane-status";

/**
 * Orchestrates the two transient card animations in a lane:
 *
 * - `dealing`: newly added card IDs flash a dealing state for 750ms.
 * - `cardStateAnimation`: a one-shot bust/stay pose on status transitions.
 *
 * Extracted from the `PlayerLane` body so the lane stays focused on rendering
 * and the animation timing can be reasoned about independently.
 */
export function usePlayerLaneAnimations(
  player: SnapshotPlayer,
  displayStatus: LaneRoundStatus,
): { dealingIdSet: ReadonlySet<string>; cardStateAnimation: "bust" | "stay" | null } {
  const previousCardIds = useRef<string[]>([]);
  const initialCardSyncDone = useRef(false);
  const previousStatus = useRef(displayStatus);
  const [dealingIds, setDealingIds] = useState<string[]>([]);
  const [stateAnimation, setStateAnimation] = useState<"bust" | "stay" | null>(null);

  // why: previousIds is a Set so the `includes`-style lookup in the diff below
  // stays O(1) instead of O(n²) over the card list.
  const cardIds = useMemo(
    () => [
      ...player.modifierCards.map((card) => card.id),
      ...player.numberCards.map((card) => card.id),
      ...(player.bustCard ? [player.bustCard.id] : []),
      ...player.heldActionCards.map(
        (card) => `${player.playerId}-${card.actionKind}-${card.label}`,
      ),
      ...player.receivedActionCards.map(
        (card) => `${player.playerId}-received-${card.actionKind}-${card.label}`,
      ),
    ],
    [
      player.heldActionCards,
      player.receivedActionCards,
      player.modifierCards,
      player.numberCards,
      player.bustCard,
      player.playerId,
    ],
  );
  const dealingIdSet = useMemo(() => new Set(dealingIds), [dealingIds]);

  useEffect(() => {
    let timeout: number | undefined;
    if (!initialCardSyncDone.current) {
      initialCardSyncDone.current = true;
      previousCardIds.current = cardIds;
    } else {
      const previousIds = new Set(previousCardIds.current);
      const newIds = cardIds.filter((id) => !previousIds.has(id));
      if (newIds.length > 0) {
        setDealingIds(newIds);
        timeout = window.setTimeout(() => setDealingIds([]), 750);
        previousCardIds.current = cardIds;
      } else {
        previousCardIds.current = cardIds;
      }
    }
    return () => {
      window.clearTimeout(timeout);
    };
  }, [cardIds]);

  // why: transient one-shot bust/stay pose — must trigger synchronously when `displayStatus` transitions (derived from external snapshot, not a local event) and auto-clear after 900ms. Deriving during render would require `setState` in render; deferring to timeout would miss the frame.
  // oxlint-disable react/set-state-in-effect -- intentional status-transition animation; see comment above
  useEffect(() => {
    let timeout: number | undefined;
    if (previousStatus.current !== displayStatus) {
      const nextPose = getTransitionPose(previousStatus.current, displayStatus);
      setStateAnimation(nextPose);
      previousStatus.current = displayStatus;
      if (nextPose !== null) {
        timeout = window.setTimeout(() => setStateAnimation(null), 900);
      }
    }
    return () => {
      window.clearTimeout(timeout);
    };
  }, [displayStatus]);
  // oxlint-enable react/set-state-in-effect

  return { dealingIdSet, cardStateAnimation: stateAnimation ?? getLanePose(displayStatus) };
}
