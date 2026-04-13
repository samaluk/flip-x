import { ConvexTestingHelper } from "convex-helpers/testing";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { SessionId } from "convex-helpers/server/sessions";

const DELETE_ALL_APP_DATA_CONFIRMATION = "DELETE_ALL_APP_DATA";

export function asSessionId(value: string) {
  return value as SessionId;
}

export function createTestClient() {
  return new ConvexTestingHelper();
}

export async function resetTestClient(client: ConvexTestingHelper) {
  await client.action(api.admin.clearAllAppDataViaCli, {
    confirm: DELETE_ALL_APP_DATA_CONFIRMATION,
  });
  await client.close();
}

export async function createStartedMatch(
  client: ConvexTestingHelper,
  names: readonly [string, string, ...string[]] = ["Host", "Guest"],
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
  });

  return {
    matchId,
    sessions,
    started,
  };
}
