"use client";

import usePresence from "@convex-dev/presence/react";
import { useSessionId } from "convex-helpers/react/sessions";
import { useEffect } from "react";

import refs from "@/confect/_generated/refs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useSessionConfectMutation } from "@/shared/lib/confect-hooks";

export function useMatchPresence(matchId: string, playerId: Id<"players"> | undefined) {
  const [sessionId] = useSessionId();
  const syncPlayer = useSessionConfectMutation(refs.public.presence.syncPlayer);
  // Presence subscriptions still come from the Convex component client API.
  const presence = usePresence(api.presence, matchId, sessionId ?? `pending:${matchId}`);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    void syncPlayer({
      matchId: matchId as Id<"matches">,
      playerId,
    });
  }, [matchId, playerId, sessionId, syncPlayer]);

  return presence?.flatMap((entry) => {
    if (!entry.online || typeof entry.data !== "string") {
      return [];
    }

    return [entry.data];
  });
}
