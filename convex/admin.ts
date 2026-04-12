import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx, MutationCtx } from "./_generated/server";
import { action, internalMutation } from "./_generated/server";

const DELETE_ALL_APP_DATA_CONFIRMATION = "DELETE_ALL_APP_DATA";
const DELETE_BATCH_SIZE = 128;

type ClearAllAppDataResult = {
  deleted: {
    scoreBreakdowns: number;
    roundEvents: number;
    roundPlayerStates: number;
    rounds: number;
    presence: number;
    playerSessions: number;
    players: number;
    matches: number;
  };
  confirmation: string;
};

export const clearAllAppData = internalMutation({
  args: {
    confirm: v.string(),
  },
  handler: async (ctx, args): Promise<ClearAllAppDataResult> => {
    if (args.confirm !== DELETE_ALL_APP_DATA_CONFIRMATION) {
      throw new Error("INVALID_CONFIRMATION");
    }

    const deleted = {
      scoreBreakdowns: await deleteScoreBreakdowns(ctx),
      roundEvents: await deleteRoundEvents(ctx),
      roundPlayerStates: await deleteRoundPlayerStates(ctx),
      rounds: await deleteRounds(ctx),
      presence: await deletePresence(ctx),
      playerSessions: await deletePlayerSessions(ctx),
      players: await deletePlayers(ctx),
      matches: await deleteMatches(ctx),
    };

    return {
      deleted,
      confirmation: DELETE_ALL_APP_DATA_CONFIRMATION,
    };
  },
});

export const clearAllAppDataViaCli = action({
  args: {
    confirm: v.string(),
  },
  handler: async (ctx, args): Promise<ClearAllAppDataResult> => {
    return await runClearAllAppData(ctx, args.confirm);
  },
});

async function runClearAllAppData(
  ctx: ActionCtx,
  confirm: string,
): Promise<ClearAllAppDataResult> {
  return await ctx.runMutation(internal.admin.clearAllAppData, { confirm });
}

async function deleteScoreBreakdowns(ctx: MutationCtx) {
  return await deleteInBatches(ctx, "scoreBreakdowns");
}

async function deleteRoundEvents(ctx: MutationCtx) {
  return await deleteInBatches(ctx, "roundEvents");
}

async function deleteRoundPlayerStates(ctx: MutationCtx) {
  return await deleteInBatches(ctx, "roundPlayerStates");
}

async function deleteRounds(ctx: MutationCtx) {
  return await deleteInBatches(ctx, "rounds");
}

async function deletePresence(ctx: MutationCtx) {
  return await deleteInBatches(ctx, "presence");
}

async function deletePlayerSessions(ctx: MutationCtx) {
  return await deleteInBatches(ctx, "playerSessions");
}

async function deletePlayers(ctx: MutationCtx) {
  return await deleteInBatches(ctx, "players");
}

async function deleteMatches(ctx: MutationCtx) {
  return await deleteInBatches(ctx, "matches");
}

async function deleteInBatches<
  TableName extends
    | "matches"
    | "players"
    | "playerSessions"
    | "presence"
    | "rounds"
    | "roundPlayerStates"
    | "roundEvents"
    | "scoreBreakdowns",
>(
  ctx: MutationCtx,
  tableName: TableName,
) {
  let deleted = 0;

  while (true) {
    const docs = await ctx.db.query(tableName).take(DELETE_BATCH_SIZE);
    if (docs.length === 0) {
      return deleted;
    }

    await Promise.all(docs.map((doc) => ctx.db.delete(doc._id as Id<TableName>)));
    deleted += docs.length;
  }
}
