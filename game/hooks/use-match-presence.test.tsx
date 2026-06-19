import { act, renderHook } from "@testing-library/react";

import type { Id } from "@/convex/_generated/dataModel";

import { useMatchPresence } from "./use-match-presence";

const heartbeat = vi.fn();
const syncPlayer = vi.fn();

vi.mock("convex/react", () => ({
  useConvex: () => ({ url: "https://example.convex.cloud" }),
  useMutation: () => heartbeat,
  useQuery: () => [],
}));

vi.mock("convex-helpers/react/sessions", () => ({
  useSessionId: () => ["session-1"],
}));

vi.mock("@/shared/lib/confect-hooks", () => ({
  useSessionConfectMutation: () => syncPlayer,
}));

describe("useMatchPresence", () => {
  const playerId = "player-1" as Id<"players">;

  beforeEach(() => {
    vi.useFakeTimers();
    heartbeat.mockReset();
    syncPlayer.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits for the active heartbeat before scheduling the next one", async () => {
    let resolveHeartbeat:
      | ((value: { roomToken: string; sessionToken: string }) => void)
      | undefined;
    heartbeat.mockImplementation(
      () =>
        new Promise<{ roomToken: string; sessionToken: string }>((resolve) => {
          resolveHeartbeat = resolve;
        }),
    );

    renderHook(() => useMatchPresence("match-1", playerId));

    expect(heartbeat).toHaveBeenCalledTimes(1);

    await act(() => vi.advanceTimersByTimeAsync(30_000));

    expect(heartbeat).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveHeartbeat?.({ roomToken: "room-1", sessionToken: "session-token-1" });
      await Promise.resolve();
    });
    await act(() => vi.advanceTimersByTimeAsync(10_000));

    expect(heartbeat).toHaveBeenCalledTimes(2);
  });

  it("retries a failed heartbeat without leaking an unhandled rejection", async () => {
    heartbeat
      .mockRejectedValueOnce(new Error("presence unavailable"))
      .mockResolvedValue({ roomToken: "room-1", sessionToken: "session-token-1" });

    renderHook(() => useMatchPresence("match-1", playerId));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(heartbeat).toHaveBeenCalledTimes(1);

    await act(() => vi.advanceTimersByTimeAsync(10_000));

    expect(heartbeat).toHaveBeenCalledTimes(2);
  });

  it("waits for the viewer player identity before joining presence", () => {
    heartbeat.mockResolvedValue({ roomToken: "room-1", sessionToken: "session-token-1" });
    const { rerender } = renderHook(
      ({ viewerPlayerId }: { viewerPlayerId: Id<"players"> | undefined }) =>
        useMatchPresence("match-1", viewerPlayerId),
      { initialProps: { viewerPlayerId: undefined } },
    );

    expect(heartbeat).not.toHaveBeenCalled();
    expect(syncPlayer).not.toHaveBeenCalled();

    act(() => rerender({ viewerPlayerId: playerId }));

    expect(heartbeat).toHaveBeenCalledTimes(1);
  });
});
