import type { LaneRoundStatus, SnapshotPlayer } from "@/game/ui/player-lane-compare";

export function getLaneStatus(player: SnapshotPlayer): LaneRoundStatus {
  return player.bustCard !== null ? "busted" : player.roundStatus;
}

export function getLanePose(status: LaneRoundStatus): "bust" | "stay" | null {
  if (status === "busted") return "bust";
  if (status === "stayed" || status === "frozen") return "stay";
  return null;
}

export function getTransitionPose(previous: LaneRoundStatus, next: LaneRoundStatus) {
  return previous === next ? null : getLanePose(next);
}
