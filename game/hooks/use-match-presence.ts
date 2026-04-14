"use client";

import usePresence from "@convex-dev/presence/react";
import { useSessionId, useSessionMutation } from "convex-helpers/react/sessions";
import { useEffect } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useMatchPresence(matchId: Id<"matches">, playerId: Id<"players"> | undefined) {
  const [sessionId] = useSessionId();
  const syncPlayer = useSessionMutation(api.presence.syncPlayer);
  const presence = usePresence(api.presence, String(matchId), sessionId ?? `pending:${String(matchId)}`);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    void syncPlayer({
      matchId,
      playerId,
    });
  }, [matchId, playerId, sessionId, syncPlayer]);

  return presence?.flatMap((entry) => {
    if (!entry.online || typeof entry.data !== "string") {
      return [];
    }

    return [entry.data as Id<"players">];
  });
}
