import { customMutation, customQuery } from "convex-helpers/server/customFunctions";
import { SessionIdArg, type SessionId } from "convex-helpers/server/sessions";

import { mutation, query } from "../../convex/_generated/server";

export const queryWithSession = customQuery(query, {
  args: SessionIdArg,
  input: async (ctx, { sessionId }) => ({
    ctx,
    args: { sessionId: sessionId satisfies SessionId },
  }),
});

export const mutationWithSession = customMutation(mutation, {
  args: SessionIdArg,
  input: async (ctx, { sessionId }) => ({
    ctx,
    args: { sessionId: sessionId satisfies SessionId },
  }),
});

export function toSessionId(sessionId: string): SessionId {
  return sessionId as SessionId;
}
