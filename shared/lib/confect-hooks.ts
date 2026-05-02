"use client";

import { Ref } from "@confect/core";
import {
  type ConfectMutation,
  type ConfectOptimisticLocalStore,
  useMutation as useConfectMutation,
  useQuery as useConfectQuery,
} from "@confect/react";
import { useSessionId } from "convex-helpers/react/sessions";

type SessionRef = Ref.AnyPublicQuery | Ref.AnyPublicMutation | Ref.AnyPublicAction;
type SessionArgs<T extends SessionRef> = Extract<Ref.Args<T>, { sessionId: string }>;
type SessionlessArgs<T extends SessionRef> = Omit<SessionArgs<T>, "sessionId">;
type SessionConfectMutation<Mutation extends Ref.AnyPublicMutation> = ((
  args: SessionlessArgs<Mutation>,
) => Promise<Ref.Returns<Mutation>>) & {
  withOptimisticUpdate(
    optimisticUpdate: (
      localStore: ConfectOptimisticLocalStore,
      args: SessionlessArgs<Mutation>,
    ) => void,
  ): SessionConfectMutation<Mutation>;
};

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

  return wrapSessionConfectMutation(mutate, sessionId);
}

function wrapSessionConfectMutation<Mutation extends Ref.AnyPublicMutation>(
  mutate: ConfectMutation<Mutation>,
  sessionId: string | null | undefined,
): SessionConfectMutation<Mutation> {
  const sessionMutation = (async (args: SessionlessArgs<Mutation>) => {
    if (!sessionId) {
      throw new Error("Session unavailable");
    }

    return await mutate({
      ...(args as object),
      sessionId,
    } as Ref.Args<Mutation>);
  }) as SessionConfectMutation<Mutation>;

  sessionMutation.withOptimisticUpdate = (optimisticUpdate) =>
    wrapSessionConfectMutation(
      mutate.withOptimisticUpdate((localStore, args) => {
        const { sessionId: _sessionId, ...sessionlessArgs } = args as SessionArgs<Mutation>;
        optimisticUpdate(localStore, sessionlessArgs as SessionlessArgs<Mutation>);
      }),
      sessionId,
    );

  return sessionMutation;
}
