import { Presence } from "@convex-dev/presence";
import { v } from "convex/values";
import * as Effect from "effect/Effect";

import { components } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { mutation, query } from "../convex/_generated/server";
import { playerIdFromConfectWire } from "./lib/convex-id-bridge";
import { mutationWithSession } from "./lib/session_functions";
import { ExternalComponentFailed } from "../shared/lib/errors/infrastructure";

const presence = new Presence(components.presence);

export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
  },
  handler: async (ctx, args) => {
    return await Effect.runPromise(
      Effect.tryPromise({
        try: () => presence.heartbeat(ctx, args.roomId, args.userId, args.sessionId, args.interval),
        catch: (cause) => new ExternalComponentFailed({ component: "presence", cause }),
      }),
    );
  },
});

export const list = query({
  args: {
    roomToken: v.string(),
  },
  handler: async (ctx, args) => {
    return await Effect.runPromise(
      Effect.tryPromise({
        try: () => presence.list(ctx, args.roomToken),
        catch: (cause) => new ExternalComponentFailed({ component: "presence", cause }),
      }),
    );
  },
});

export const disconnect = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    return await Effect.runPromise(
      Effect.tryPromise({
        try: () => presence.disconnect(ctx, args.sessionToken),
        catch: (cause) => new ExternalComponentFailed({ component: "presence", cause }),
      }),
    );
  },
});

export const syncPlayer = mutationWithSession({
  args: {
    matchId: v.id("matches"),
    playerId: v.optional(v.id("players")),
  },
  handler: async (ctx, args) => {
    return await Effect.runPromise(
      Effect.tryPromise({
        try: () =>
          presence.updateRoomUser(
            ctx,
            String(args.matchId),
            args.playerId ?? args.sessionId,
            args.playerId,
          ),
        catch: (cause) => new ExternalComponentFailed({ component: "presence", cause }),
      }),
    );
  },
});

export const listMatchPresence = query({
  args: {
    roomToken: v.string(),
  },
  handler: async (ctx, args): Promise<Array<{ playerId: Id<"players">; online: boolean }>> => {
    return await Effect.runPromise(
      Effect.gen(function* () {
        const states = yield* Effect.tryPromise({
          try: () => presence.list(ctx, args.roomToken),
          catch: (cause) => new ExternalComponentFailed({ component: "presence", cause }),
        });

        return states.flatMap((state) => {
          if (!state.online || typeof state.data !== "string") {
            return [];
          }

          return [{ playerId: playerIdFromConfectWire(state.data), online: true }];
        });
      }),
    );
  },
});
