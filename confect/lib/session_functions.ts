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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- SessionId is a string brand from convex-helpers
  return sessionId as SessionId;
}
