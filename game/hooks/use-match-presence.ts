"use client";

import { useSessionId } from "convex-helpers/react/sessions";
import { useMutation, useQuery, useConvex } from "convex/react";
import { useEffect, useRef, useState } from "react";

import refs from "@/confect/_generated/refs";
import { matchIdFromConfectWire } from "@/confect/lib/convex-id-bridge";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useSessionConfectMutation } from "@/shared/lib/confect-hooks";

const PRESENCE_INTERVAL_MS = 10_000;

export function useMatchPresence(matchId: string, playerId: Id<"players"> | undefined) {
  const [sessionId] = useSessionId();
  const [presenceSessionId] = useState(() => crypto.randomUUID());
  const [roomToken, setRoomToken] = useState<string | null>(null);
  const sessionTokenRef = useRef<string | null>(null);
  const syncPlayer = useSessionConfectMutation(refs.public.presence.syncPlayer);
  const presence = useQuery(api.presence.list, roomToken ? { roomToken } : "skip");

  usePresenceHeartbeat({
    matchId,
    playerId,
    presenceSessionId,
    sessionId,
    sessionTokenRef,
    setRoomToken,
    syncPlayer,
  });
  usePageHideDisconnect(sessionTokenRef);

  useEffect(() => {
    if (!sessionId || !playerId) {
      return;
    }

    void syncPlayer({
      matchId: matchIdFromConfectWire(matchId),
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

type PresenceHeartbeatArgs = {
  matchId: string;
  playerId: Id<"players"> | undefined;
  presenceSessionId: string;
  sessionId: string | undefined;
  sessionTokenRef: React.RefObject<string | null>;
  setRoomToken: (roomToken: string) => void;
  syncPlayer: ReturnType<typeof useSessionConfectMutation>;
};

function usePresenceHeartbeat({
  matchId,
  playerId,
  presenceSessionId,
  sessionId,
  sessionTokenRef,
  setRoomToken,
  syncPlayer,
}: PresenceHeartbeatArgs) {
  const heartbeat = useMutation(api.presence.heartbeat);

  useEffect(() => {
    if (!playerId || !sessionId) {
      return undefined;
    }

    const activePlayerId = playerId;
    const abortController = new AbortController();
    let timeoutId: number | undefined;

    const sendHeartbeat = async () => {
      try {
        const result = await heartbeat({
          roomId: matchId,
          userId: activePlayerId,
          sessionId: presenceSessionId,
          interval: PRESENCE_INTERVAL_MS,
        });

        if (!abortController.signal.aborted) {
          sessionTokenRef.current = result.sessionToken;
          setRoomToken(result.roomToken);
        }

        await syncPresentPlayer({
          aborted: abortController.signal.aborted,
          matchId,
          playerId: activePlayerId,
          sessionId,
          syncPlayer,
        });
      } finally {
        if (!abortController.signal.aborted) {
          timeoutId = window.setTimeout(
            () => void sendHeartbeat().catch(() => {}),
            PRESENCE_INTERVAL_MS,
          );
        }
      }
    };

    void sendHeartbeat().catch(() => {});

    return () => {
      abortController.abort();
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [
    heartbeat,
    matchId,
    playerId,
    presenceSessionId,
    sessionId,
    sessionTokenRef,
    setRoomToken,
    syncPlayer,
  ]);
}

type SyncPresentPlayerArgs = {
  aborted: boolean;
  matchId: string;
  playerId: Id<"players"> | undefined;
  sessionId: string | undefined;
  syncPlayer: ReturnType<typeof useSessionConfectMutation>;
};

async function syncPresentPlayer({
  aborted,
  matchId,
  playerId,
  sessionId,
  syncPlayer,
}: SyncPresentPlayerArgs) {
  if (aborted || !sessionId || !playerId) {
    return;
  }

  await syncPlayer({
    matchId: matchIdFromConfectWire(matchId),
    playerId,
  });
}

function usePageHideDisconnect(sessionTokenRef: React.RefObject<string | null>) {
  const convex = useConvex();

  useEffect(() => {
    const handlePageHide = () => {
      const sessionToken = sessionTokenRef.current;
      if (!sessionToken) {
        return;
      }

      const blob = new Blob(
        [
          JSON.stringify({
            path: "presence:disconnect",
            args: { sessionToken },
          }),
        ],
        { type: "application/json" },
      );
      navigator.sendBeacon(`${convex.url}/api/mutation`, blob);
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [convex.url, sessionTokenRef]);
}
