import { execFileSync } from "node:child_process";
import path from "node:path";

import { ConvexTestingHelper } from "convex-helpers/testing";

import { expect, vi } from "vitest";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { createIdempotencyCounter } from "@/tests/builders/idempotency";
import type { DeterministicStartOptions } from "@/tests/fixtures/deterministic";
import type { SessionId } from "convex-helpers/server/sessions";

export const commandMetadata = createIdempotencyCounter("backend-test");

export function asSessionId(value: string) {
  return value as SessionId;
}

export async function expectRejectWithCode(
  action: Promise<unknown> | (() => Promise<unknown>),
  expectedCode: string,
) {
  const spy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    const text = args.map(String).join(" ");
    if (text.includes(expectedCode) || text.includes("ConvexError")) {
      return;
    }
    spy.mockRestore();
    console.error(...args);
  });

  try {
    const promise = typeof action === "function" ? action() : action;
    await expect(promise).rejects.toThrow(expectedCode);
  } finally {
    spy.mockRestore();
  }
}

export function createTestClient() {
  return new ConvexTestingHelper({
    backendUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
  });
}

export async function resetTestClient(client: ConvexTestingHelper) {
  execFileSync("node", [path.resolve(process.cwd(), "scripts/clear-convex-app-data.mjs")], {
    stdio: "inherit",
    env: process.env,
  });
  await client.close();
}

export async function createStartedMatch(
  client: ConvexTestingHelper,
  names: readonly [string, string, ...string[]] = ["Host", "Guest"],
  options: { deterministicStart?: DeterministicStartOptions } = {},
) {
  const sessions = names.map((name, index) => ({
    name,
    sessionId: asSessionId(`session-${index}-${name.toLowerCase()}`),
  }));

  const host = sessions[0];
  const created = await client.mutation(api.matches.createMatch, {
    hostName: host.name,
    sessionId: host.sessionId,
  });
  const matchId = created.matchId as Id<"matches">;

  for (const player of sessions.slice(1)) {
    await client.mutation(api.matches.joinMatch, {
      matchId,
      playerName: player.name,
      sessionId: player.sessionId,
    });
  }

  const started = await client.mutation(api.matches.startMatch, {
    matchId,
    sessionId: host.sessionId,
    ...commandMetadata(created.version),
    deterministicStart: options.deterministicStart,
  });

  return {
    matchId,
    sessions,
    started,
  };
}
