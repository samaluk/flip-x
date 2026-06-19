import { renderHook } from "@testing-library/react";

import { useSessionConfectMutation } from "@/shared/lib/confect-hooks";

const mutate = vi.fn();

vi.mock("@confect/react", () => ({
  useMutation: () => Object.assign(mutate, { withOptimisticUpdate: vi.fn() }),
  useQuery: vi.fn(),
}));

vi.mock("convex-helpers/react/sessions", () => ({
  useSessionId: () => ["session-1"],
}));

describe("useSessionConfectMutation", () => {
  it("keeps the session-bound mutation stable across rerenders", () => {
    const ref = {} as Parameters<typeof useSessionConfectMutation>[0];
    const { result, rerender } = renderHook(() => useSessionConfectMutation(ref));
    const firstMutation = result.current;

    rerender();

    expect(result.current).toBe(firstMutation);
  });
});
