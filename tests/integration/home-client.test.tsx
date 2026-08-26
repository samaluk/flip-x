import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as Either from "effect/Either";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";

import { HomeClient } from "@/app/[locale]/home-client";
import refs from "@/confect/_generated/refs";
import { lobbyNotFound, nameAlreadyTaken } from "@/shared/lib/errors/domain";
import { withIntlEn } from "@/tests/test-intl";

const mockPrefetch = vi.fn();
const mockPush = vi.fn();
let mockSessionId: string | null = "test-session-id";
let mockInitialQueryCode: string | null = null;

const mockCreateMatch = vi.fn();
const mockJoinByCode = vi.fn();
const mockJoinMatch = vi.fn();

const mockToast = {
  error: vi.fn(),
  success: vi.fn(),
};

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToast.error(...args),
    success: (...args: unknown[]) => mockToast.success(...args),
  },
}));

vi.mock("@/shared/i18n/navigation", () => ({
  useRouter: () => ({ prefetch: mockPrefetch, push: mockPush }),
}));

vi.mock("convex-helpers/react/sessions", () => ({
  useSessionId: () => [mockSessionId],
}));

vi.mock("nuqs", () => ({
  parseAsString: {
    parse: (v: string) => v,
    serialize: (v: string) => v,
  },
  useQueryState: (_key: string, _options?: unknown) => {
    return useState<string | null>(mockInitialQueryCode);
  },
}));

vi.mock("@confect/react", () => ({
  QueryResult: {
    match: (
      result: { kind: string; value?: unknown },
      handlers: {
        onLoading: () => unknown;
        onSuccess: (val: unknown) => unknown;
        onFailure: () => unknown;
      },
    ) => {
      if (result?.kind === "success") {
        return handlers.onSuccess(result.value);
      }
      return handlers.onLoading();
    },
  },
  useQuery: () => ({ kind: "success", value: null }),
}));

vi.mock("@/shared/lib/confect-hooks", () => ({
  useSessionConfectMutation: (ref: unknown) => {
    if (ref === refs.public.matches.createMatch) return mockCreateMatch;
    if (ref === refs.public.matches.joinByCode) return mockJoinByCode;
    if (ref === refs.public.matches.joinMatch) return mockJoinMatch;
    return vi.fn();
  },
}));

describe("HomeClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionId = "test-session-id";
    mockInitialQueryCode = null;
    mockCreateMatch.mockReset();
    mockJoinByCode.mockReset();
    mockJoinMatch.mockReset();
    mockPush.mockReset();
    mockPrefetch.mockReset();
    mockToast.error.mockReset();
    mockToast.success.mockReset();
    window.localStorage.clear();
  });

  it("renders default create game flow and handles successful creation", async () => {
    mockCreateMatch.mockResolvedValue(Either.right({ matchId: "match-123" }));

    render(withIntlEn(<HomeClient />));

    expect(screen.getByRole("heading", { name: "flip-x" })).toBeInTheDocument();
    expect(screen.getByText("Create a game or join an existing one")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create New Game" })).toBeInTheDocument();

    const nameInput = screen.getByLabelText("Your name");
    fireEvent.change(nameInput, { target: { value: "Alex" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Create New Game" }));
    });

    expect(mockCreateMatch).toHaveBeenCalledWith({
      hostName: "Alex",
      hostColorId: "cyan",
    });

    await waitFor(() => {
      expect(mockPrefetch).toHaveBeenCalledWith("/game/match-123", { kind: PrefetchKind.FULL });
      expect(mockPush).toHaveBeenCalledWith("/game/match-123");
    });
  });

  it("switches to join flow, executes lookup then join, and navigates", async () => {
    mockJoinByCode.mockResolvedValue(
      Either.right({ matchId: "match-join-456", lobbyCode: "JOIN" }),
    );
    mockJoinMatch.mockResolvedValue(Either.right({ matchId: "match-join-456" }));

    render(withIntlEn(<HomeClient />));

    fireEvent.click(screen.getByRole("button", { name: "Join Existing Game" }));

    expect(screen.getByText("Enter your name and join the game")).toBeInTheDocument();
    expect(screen.getByLabelText("Lobby code")).toBeInTheDocument();

    const nameInput = screen.getByLabelText("Your name");
    fireEvent.change(nameInput, { target: { value: "Jordan" } });

    const codeInput = screen.getByLabelText("Lobby code");
    fireEvent.change(codeInput, { target: { value: "join" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Join Game" }));
    });

    expect(mockJoinByCode).toHaveBeenCalledWith({
      lobbyCode: "JOIN",
    });
    expect(mockJoinMatch).toHaveBeenCalledWith({
      matchId: "match-join-456",
      playerName: "Jordan",
      playerColorId: "cyan",
    });

    await waitFor(() => {
      expect(mockPrefetch).toHaveBeenCalledWith("/game/match-join-456", {
        kind: PrefetchKind.FULL,
      });
      expect(mockPush).toHaveBeenCalledWith("/game/match-join-456");
    });
  });

  it("cancels join flow and returns to create flow", () => {
    render(withIntlEn(<HomeClient />));

    fireEvent.click(screen.getByRole("button", { name: "Join Existing Game" }));
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Create New Game" })).toBeInTheDocument();
  });

  it("initializes in join mode when a query code is present", () => {
    mockInitialQueryCode = "CODE";

    render(withIntlEn(<HomeClient />));

    expect(screen.getByLabelText("Lobby code")).toHaveValue("CODE");
    expect(screen.getByRole("button", { name: "Join Game" })).toBeInTheDocument();
  });

  it("shows error toast when session is not available", async () => {
    mockSessionId = null;

    render(withIntlEn(<HomeClient />));

    const nameInput = screen.getByLabelText("Your name");
    fireEvent.change(nameInput, { target: { value: "Taylor" } });

    await act(async () => {
      fireEvent.submit(
        nameInput.closest("form") ?? screen.getByRole("button", { name: "Create New Game" }),
      );
    });

    expect(mockToast.error).toHaveBeenCalledWith("Session not available.");
    expect(mockCreateMatch).not.toHaveBeenCalled();
  });

  it("shows error toast when join code length is invalid", async () => {
    render(withIntlEn(<HomeClient />));

    fireEvent.click(screen.getByRole("button", { name: "Join Existing Game" }));

    const nameInput = screen.getByLabelText("Your name");
    fireEvent.change(nameInput, { target: { value: "Taylor" } });

    const codeInput = screen.getByLabelText("Lobby code");
    fireEvent.change(codeInput, { target: { value: "ABC" } });

    await act(async () => {
      fireEvent.submit(codeInput.closest("form")!);
    });

    expect(mockToast.error).toHaveBeenCalledWith("Please enter a 4-character code.");
    expect(mockJoinByCode).not.toHaveBeenCalled();
  });

  it("translates domain errors returned from create mutation", async () => {
    mockCreateMatch.mockResolvedValue(Either.left(nameAlreadyTaken({ name: "Alex" })));

    render(withIntlEn(<HomeClient />));

    const nameInput = screen.getByLabelText("Your name");
    fireEvent.change(nameInput, { target: { value: "Alex" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Create New Game" }));
    });

    expect(mockToast.error).toHaveBeenCalledWith("That name is already taken at this table.");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("translates domain errors returned from joinByCode mutation", async () => {
    mockJoinByCode.mockResolvedValue(Either.left(lobbyNotFound()));

    render(withIntlEn(<HomeClient />));

    fireEvent.click(screen.getByRole("button", { name: "Join Existing Game" }));

    const nameInput = screen.getByLabelText("Your name");
    fireEvent.change(nameInput, { target: { value: "Alex" } });

    const codeInput = screen.getByLabelText("Lobby code");
    fireEvent.change(codeInput, { target: { value: "NONE" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Join Game" }));
    });

    expect(mockToast.error).toHaveBeenCalledWith("No lobby found for that code.");
    expect(mockJoinMatch).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("translates domain errors returned from joinMatch mutation", async () => {
    mockJoinByCode.mockResolvedValue(Either.right({ matchId: "match-1", lobbyCode: "GAME" }));
    mockJoinMatch.mockResolvedValue(Either.left(nameAlreadyTaken({ name: "Alex" })));

    render(withIntlEn(<HomeClient />));

    fireEvent.click(screen.getByRole("button", { name: "Join Existing Game" }));

    const nameInput = screen.getByLabelText("Your name");
    fireEvent.change(nameInput, { target: { value: "Alex" } });

    const codeInput = screen.getByLabelText("Lobby code");
    fireEvent.change(codeInput, { target: { value: "GAME" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Join Game" }));
    });

    expect(mockToast.error).toHaveBeenCalledWith("That name is already taken at this table.");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows fallback toast error on unexpected mutation exceptions for create", async () => {
    mockCreateMatch.mockRejectedValue(new Error("Network disconnect"));

    render(withIntlEn(<HomeClient />));

    const nameInput = screen.getByLabelText("Your name");
    fireEvent.change(nameInput, { target: { value: "Alex" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Create New Game" }));
    });

    expect(mockToast.error).toHaveBeenCalledWith("Could not create the match.");
  });

  it("shows fallback toast error on unexpected mutation exceptions for join", async () => {
    mockJoinByCode.mockRejectedValue(new Error("Network disconnect"));

    render(withIntlEn(<HomeClient />));

    fireEvent.click(screen.getByRole("button", { name: "Join Existing Game" }));

    const nameInput = screen.getByLabelText("Your name");
    fireEvent.change(nameInput, { target: { value: "Alex" } });

    const codeInput = screen.getByLabelText("Lobby code");
    fireEvent.change(codeInput, { target: { value: "ABCD" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Join Game" }));
    });

    expect(mockToast.error).toHaveBeenCalledWith("Could not join the game.");
  });

  it("shows error toast when name exceeds maximum length", async () => {
    render(withIntlEn(<HomeClient />));

    const nameInput = screen.getByLabelText("Your name");
    fireEvent.change(nameInput, { target: { value: "A".repeat(21) } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Create New Game" }));
    });

    expect(mockToast.error).toHaveBeenCalledWith("Name must be 20 characters or less.");
    expect(mockCreateMatch).not.toHaveBeenCalled();
  });

  it("shows error toast when name is empty in join flow", async () => {
    render(withIntlEn(<HomeClient />));

    fireEvent.click(screen.getByRole("button", { name: "Join Existing Game" }));

    const codeInput = screen.getByLabelText("Lobby code");
    fireEvent.change(codeInput, { target: { value: "ABCD" } });

    await act(async () => {
      fireEvent.submit(codeInput.closest("form")!);
    });

    expect(mockToast.error).toHaveBeenCalledWith("Please enter your name.");
    expect(mockJoinByCode).not.toHaveBeenCalled();
  });
});
