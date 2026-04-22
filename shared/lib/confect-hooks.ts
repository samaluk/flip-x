"use client";

import { Ref } from "@confect/core";
import {
  useAction as useConfectAction,
  useMutation as useConfectMutation,
  useQuery as useConfectQuery,
} from "@confect/react";
import { useSessionId } from "convex-helpers/react/sessions";

type SessionRef = Ref.AnyPublicQuery | Ref.AnyPublicMutation | Ref.AnyPublicAction;
type SessionArgs<T extends SessionRef> = Extract<Ref.Args<T>, { sessionId: string }>;
type SessionlessArgs<T extends SessionRef> = Omit<SessionArgs<T>, "sessionId">;

export function useSessionConfectQuery<Query extends Ref.AnyPublicQuery>(
  ref: Query,
  args: SessionlessArgs<Query> | "skip",
) {
  const [sessionId] = useSessionId();

  if (args === "skip" || !sessionId) {
    return useConfectQuery(ref, "skip");
  }

  return useConfectQuery(ref, {
    ...(args as object),
    sessionId,
  } as Ref.Args<Query>);
}

export function useSessionConfectMutation<Mutation extends Ref.AnyPublicMutation>(ref: Mutation) {
  const [sessionId] = useSessionId();
  const mutate = useConfectMutation(ref);

  return async (args: SessionlessArgs<Mutation>) => {
    if (!sessionId) {
      throw new Error("Session unavailable");
    }

    return await mutate({
      ...(args as object),
      sessionId,
    } as Ref.Args<Mutation>);
  };
}


