import { v } from "convex/values";
import { Presence } from "@convex-dev/presence";

import { components } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { mutationWithSession } from "./lib/session_functions";

const presence = new Presence(components.presence);

export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
  },
  handler: async (ctx, args) => {
    return await presence.heartbeat(ctx, args.roomId, args.userId, args.sessionId, args.interval);
  },
});

export const list = query({
  args: {
    roomToken: v.string(),
  },
  handler: async (ctx, args) => {
    return await presence.list(ctx, args.roomToken);
  },
});

export const disconnect = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    return await presence.disconnect(ctx, args.sessionToken);
  },
});

export const syncPlayer = mutationWithSession({
  args: {
    matchId: v.id("matches"),
    playerId: v.optional(v.id("players")),
  },
  handler: async (ctx, args) => {
    return await presence.updateRoomUser(ctx, String(args.matchId), args.sessionId, args.playerId);
  },
});

export const listMatchPresence = query({
  args: {
    roomToken: v.string(),
  },
  handler: async (ctx, args): Promise<Array<{ playerId: Id<"players">; online: boolean }>> => {
    const states = await presence.list(ctx, args.roomToken);

    return states.flatMap((state) => {
      if (!state.online || typeof state.data !== "string") {
        return [];
      }

      return [{ playerId: state.data as Id<"players">, online: true }];
    });
  },
});
