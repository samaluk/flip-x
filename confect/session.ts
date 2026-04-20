import { Schema } from "effect";

export const SessionId = Schema.String;
export const SessionIdField = {
  sessionId: SessionId,
};
