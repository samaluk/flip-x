import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutationWithSession, queryWithSession } from "./lib/session_functions";

export const update = mutationWithSession({
  args: {
    matchId: v.id("matches"),
    playerId: v.optional(v.id("players")),
  },
  handler: async (ctx, args) => {
    const room = String(args.matchId);
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user_and_room", (query) => query.eq("user", args.sessionId).eq("room", room))
      .unique();

    const patch = {
      updated: Date.now(),
      data: {
        matchId: args.matchId,
        playerId: args.playerId,
      },
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return;
    }

    await ctx.db.insert("presence", {
      room,
      user: args.sessionId,
      ...patch,
    });
  },
});

export const heartbeat = mutationWithSession({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user_and_room", (query) =>
        query.eq("user", args.sessionId).eq("room", String(args.matchId)),
      )
      .unique();

    if (!existing) {
      return;
    }

    await ctx.db.patch(existing._id, {
      updated: Date.now(),
    });
  },
});

export const list = queryWithSession({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args): Promise<Array<{ playerId: Id<"players">; updated: number }>> => {
    const docs = await ctx.db
      .query("presence")
      .withIndex("by_room_and_updated", (query) => query.eq("room", String(args.matchId)))
      .order("desc")
      .take(20);

    const seen = new Set<string>();

    return docs.flatMap((doc) => {
      if (!doc.data.playerId) {
        return [];
      }

      const key = String(doc.data.playerId);
      if (seen.has(key)) {
        return [];
      }
      seen.add(key);

      return [{ playerId: doc.data.playerId, updated: doc.updated }];
    });
  },
});
