"use client";

/* oxlint-disable typescript/no-unsafe-type-assertion -- merges SessionlessArgs with sessionId into Confect Ref.Args; types are validated by Ref at codegen */

import { Ref } from "@confect/core";
import {
  type OptimisticLocalStore,
  type InvokeReturn,
  type ReactMutation,
  useMutation as useConfectMutation,
  useQuery as useConfectQuery,
} from "@confect/react";
import { useSessionId } from "convex-helpers/react/sessions";
import * as Option from "effect/Option";
import { useMemo } from "react";

type SessionRef = Ref.AnyPublicQuery | Ref.AnyPublicMutation | Ref.AnyPublicAction;
type SessionArgs<T extends SessionRef> = Extract<Ref.Args<T>, { sessionId: string }>;
type SessionlessArgs<T extends SessionRef> = Omit<SessionArgs<T>, "sessionId">;
export type SessionConfectOptimisticLocalStore = {
  getQuery<Query extends Ref.AnyPublicQuery>(
    ref: Query,
    args: SessionlessArgs<Query>,
  ): Ref.Returns<Query> | undefined;
  getAllQueries<Query extends Ref.AnyPublicQuery>(
    ref: Query,
  ): Array<{
    args: SessionlessArgs<Query>;
    value: Ref.Returns<Query> | undefined;
  }>;
  setQuery<Query extends Ref.AnyPublicQuery>(
    ref: Query,
    args: SessionlessArgs<Query>,
    value: Ref.Returns<Query> | undefined,
  ): void;
};
type SessionConfectMutation<Mutation extends Ref.AnyPublicMutation> = ((
  args: SessionlessArgs<Mutation>,
) => InvokeReturn<Mutation>) & {
  withOptimisticUpdate(
    optimisticUpdate: (
      localStore: SessionConfectOptimisticLocalStore,
      args: SessionlessArgs<Mutation>,
    ) => void,
  ): SessionConfectMutation<Mutation>;
};

export function useSessionConfectQuery<Query extends Ref.AnyPublicQuery>(
  ref: Query,
  args: SessionlessArgs<Query> | "skip",
) {
  const [sessionId] = useSessionId();
  const queryArgs = args === "skip" || !sessionId ? "skip" : withSessionArgs(args, sessionId);

  return useConfectQuery(
    ref,
    ...(queryArgs === "skip" ? (["skip"] as const) : ([queryArgs] as const)),
  );
}

export function useSessionConfectMutation<Mutation extends Ref.AnyPublicMutation>(ref: Mutation) {
  const [sessionId] = useSessionId();
  const mutate = useConfectMutation(ref);

  return useMemo(() => wrapSessionConfectMutation(mutate, sessionId), [mutate, sessionId]);
}

function wrapSessionConfectMutation<Mutation extends Ref.AnyPublicMutation>(
  mutate: ReactMutation<Mutation>,
  sessionId: string | null | undefined,
): SessionConfectMutation<Mutation> {
  // oxlint-disable-next-line typescript/consistent-type-assertions
  const sessionMutation = (async (args: SessionlessArgs<Mutation>) => {
    if (!sessionId) {
      throw new Error("Session unavailable");
    }

    // oxlint-disable-next-line typescript/no-unsafe-return, typescript/consistent-type-assertions
    return await mutate({
      // oxlint-disable-next-line typescript/consistent-type-assertions
      ...(args as object),
      sessionId,
    } as Ref.Args<Mutation>);
  }) as SessionConfectMutation<Mutation>;

  sessionMutation.withOptimisticUpdate = (optimisticUpdate) =>
    wrapSessionConfectMutation(
      mutate.withOptimisticUpdate((localStore, args) => {
        optimisticUpdate(
          // oxlint-disable-next-line typescript/no-unsafe-argument, typescript/consistent-type-assertions
          wrapSessionOptimisticLocalStore(localStore, (args as SessionArgs<Mutation>).sessionId),
          withoutSessionArgs(args),
        );
      }),
      sessionId,
    );

  return sessionMutation;
}

function withSessionArgs<T extends SessionRef>(
  args: SessionlessArgs<T>,
  sessionId: string,
): Ref.Args<T> {
  // oxlint-disable-next-line typescript/no-unsafe-return, typescript/consistent-type-assertions
  return {
    // oxlint-disable-next-line typescript/consistent-type-assertions
    ...(args as object),
    sessionId,
  } as Ref.Args<T>;
}

function withoutSessionArgs<T extends SessionRef>(args: Ref.Args<T>): SessionlessArgs<T> {
  // oxlint-disable-next-line typescript/consistent-type-assertions
  const { sessionId: _sessionId, ...sessionlessArgs } = args as SessionArgs<T>;
  // oxlint-disable-next-line typescript/consistent-type-assertions, typescript/no-unnecessary-type-assertion
  return sessionlessArgs as SessionlessArgs<T>;
}

function wrapSessionOptimisticLocalStore(
  localStore: OptimisticLocalStore.OptimisticLocalStore,
  sessionId: string,
): SessionConfectOptimisticLocalStore {
  return {
    getQuery: (ref, args) =>
      // oxlint-disable-next-line typescript/no-unsafe-return
      Option.getOrUndefined(localStore.getQuery(ref, withSessionArgs(args, sessionId))),
    getAllQueries: (ref) =>
      localStore.getAllQueries(ref).map(({ args, value }) => ({
        args: withoutSessionArgs(args),
        value: Option.getOrUndefined(value),
      })),
    setQuery: (ref, args, value) =>
      localStore.setQuery(
        ref,
        withSessionArgs(args, sessionId),
        value === undefined ? Option.none() : Option.some(value),
      ),
  };
}
