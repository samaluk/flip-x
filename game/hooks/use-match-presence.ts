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
type SyncPlayerMutation = ReturnType<
  typeof useSessionConfectMutation<typeof refs.public.presence.syncPlayer>
>;

export function useMatchPresence(matchId: string, playerId: Id<"players"> | undefined) {
  const [sessionId] = useSessionId();
  const [presenceSessionId] = useState(() => crypto.randomUUID());
  const sessionTokenRef = useRef<string | null>(null);
  const syncPlayer = useSessionConfectMutation(refs.public.presence.syncPlayer);
  const { roomToken } = usePresenceHeartbeat({
    matchId,
    playerId,
    presenceSessionId,
    sessionId,
    sessionTokenRef,
    syncPlayer,
  });
  const presence = useQuery(api.presence.list, roomToken ? { roomToken } : "skip");
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
  syncPlayer: SyncPlayerMutation;
};

function usePresenceHeartbeat({
  matchId,
  playerId,
  presenceSessionId,
  sessionId,
  sessionTokenRef,
  syncPlayer,
}: PresenceHeartbeatArgs) {
  const heartbeat = useMutation(api.presence.heartbeat);
  const [roomToken, setRoomToken] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId || !sessionId) {
      return undefined;
    }

    const activePlayerId = playerId;
    let ignore = false;
    let timeoutId: number | undefined;

    const scheduleHeartbeat = () => {
      timeoutId = window.setTimeout(
        () => void sendHeartbeat().catch(() => {}),
        PRESENCE_INTERVAL_MS,
      );
    };

    const sendHeartbeat = async () => {
      try {
        const result = await heartbeat({
          roomId: matchId,
          userId: activePlayerId,
          sessionId: presenceSessionId,
          interval: PRESENCE_INTERVAL_MS,
        });

        if (!ignore) {
          sessionTokenRef.current = result.sessionToken;
          setRoomToken(result.roomToken);
        }

        await syncPresentPlayer({
          aborted: ignore,
          matchId,
          playerId: activePlayerId,
          sessionId,
          syncPlayer,
        });
      } catch {
        // heartbeat/sync failures are retried via the scheduled next tick
      }

      if (!ignore) {
        scheduleHeartbeat();
      }
    };

    void sendHeartbeat().catch(() => {});

    return () => {
      ignore = true;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
    // why: `heartbeat`, `sessionTokenRef`, and `syncPlayer` are stable across renders (mutation hook / ref). The linter infers them as dependencies, but changing them should not restart the presence heartbeat — only identity/room changes should.
    // oxlint-disable-next-line react-hooks/exhaustive-deps, react/exhaustive-effect-dependencies -- stable refs/setters intentionally omitted; see comment above
  }, [matchId, playerId, presenceSessionId, sessionId]);

  return { roomToken };
}

type SyncPresentPlayerArgs = {
  aborted: boolean;
  matchId: string;
  playerId: Id<"players"> | undefined;
  sessionId: string | undefined;
  syncPlayer: SyncPlayerMutation;
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
