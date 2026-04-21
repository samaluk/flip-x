import { customMutation, customQuery } from "convex-helpers/server/customFunctions";
import { SessionIdArg } from "convex-helpers/server/sessions";

import { mutation, query } from "../../convex/_generated/server";

export const queryWithSession = customQuery(query, {
  args: SessionIdArg,
  input: async (ctx, { sessionId }) => ({
    ctx,
    args: { sessionId },
  }),
});

export const mutationWithSession = customMutation(mutation, {
  args: SessionIdArg,
  input: async (ctx, { sessionId }) => ({
    ctx,
    args: { sessionId },
  }),
});
