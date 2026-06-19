import { Ref } from "@confect/core";
import type { DatabaseSchema, DataModel } from "@confect/server";
import { RegisteredConvexFunction } from "@confect/server";
import type { TestConvexForDataModel, TestConvexForDataModelAndIdentity } from "convex-test";
import { convexTest } from "convex-test";
import type { GenericMutationCtx, UserIdentity } from "convex/server";
import type { Value } from "convex/values";
import type { ParseResult } from "effect";
import { Context, Effect, Layer, Schema } from "effect";

import convexSchema from "../../confect/_generated/convexSchema";
import confectSchema from "../../confect/_generated/schema";
import migrationsComponentSchema from "../../node_modules/@convex-dev/migrations/dist/component/schema.js";
import presenceComponentSchema from "../../node_modules/@convex-dev/presence/dist/component/schema.js";
import rateLimiterComponentSchema from "../../node_modules/@convex-dev/rate-limiter/dist/component/schema.js";
import cascadingDeletesComponentSchema from "../../node_modules/@sholajegede/convex-cascading-deletes/dist/component/schema.js";

type ModuleGlob = Record<string, () => Promise<any>>;

interface ImportMetaWithGlob extends ImportMeta {
  glob: (pattern: string) => ModuleGlob;
}

type TestConfectWithoutIdentity<ConfectSchema extends DatabaseSchema.AnyWithProps> = {
  query: <QueryRef extends Ref.AnyQuery>(
    queryRef: QueryRef,
    args: Ref.Args<QueryRef>,
  ) => Effect.Effect<Ref.Returns<QueryRef>, ParseResult.ParseError>;
  mutation: <MutationRef extends Ref.AnyMutation>(
    mutationRef: MutationRef,
    args: Ref.Args<MutationRef>,
  ) => Effect.Effect<Ref.Returns<MutationRef>, ParseResult.ParseError>;
  action: <ActionRef extends Ref.AnyAction>(
    actionRef: ActionRef,
    args: Ref.Args<ActionRef>,
  ) => Effect.Effect<Ref.Returns<ActionRef>, ParseResult.ParseError>;
  run: {
    <E>(
      handler: Effect.Effect<void, E, RegisteredConvexFunction.MutationServices<ConfectSchema>>,
    ): Effect.Effect<void>;
    <A, B extends Value, E>(
      handler: Effect.Effect<A, E, RegisteredConvexFunction.MutationServices<ConfectSchema>>,
      returns: Schema.Schema<A, B>,
    ): Effect.Effect<A, ParseResult.ParseError>;
  };
  fetch: (pathQueryFragment: string, init?: RequestInit) => Effect.Effect<Response>;
  finishInProgressScheduledFunctions: () => Effect.Effect<void>;
  finishAllScheduledFunctions: (advanceTimers: () => void) => Effect.Effect<void>;
};

type TestConfectService<ConfectSchema extends DatabaseSchema.AnyWithProps> = {
  withIdentity: (userIdentity: Partial<UserIdentity>) => TestConfectWithoutIdentity<ConfectSchema>;
} & TestConfectWithoutIdentity<ConfectSchema>;

export const TestConfect = Context.GenericTag<TestConfectService<typeof confectSchema>>(
  "@/tests/confect/TestConfect",
);

class TestConfectImplWithoutIdentity<
  ConfectSchema extends DatabaseSchema.AnyWithProps,
> implements TestConfectWithoutIdentity<ConfectSchema> {
  constructor(
    private schema: ConfectSchema,
    private testConvex: TestConvexForDataModel<
      DataModel.ToConvex<DataModel.FromSchema<ConfectSchema>>
    >,
  ) {}

  readonly query = <QueryRef extends Ref.AnyQuery>(queryRef: QueryRef, args: Ref.Args<QueryRef>) =>
    Ref.runWithCodec(queryRef, args, (functionReference, encodedArgs) =>
      (this.testConvex.query as any)(functionReference, encodedArgs),
    ) as Effect.Effect<Ref.Returns<QueryRef>, ParseResult.ParseError>;

  readonly mutation = <MutationRef extends Ref.AnyMutation>(
    mutationRef: MutationRef,
    args: Ref.Args<MutationRef>,
  ) =>
    Ref.runWithCodec(mutationRef, args, (functionReference, encodedArgs) =>
      (this.testConvex.mutation as any)(functionReference, encodedArgs),
    ) as Effect.Effect<Ref.Returns<MutationRef>, ParseResult.ParseError>;

  readonly action = <ActionRef extends Ref.AnyAction>(
    actionRef: ActionRef,
    args: Ref.Args<ActionRef>,
  ) =>
    Ref.runWithCodec(actionRef, args, (functionReference, encodedArgs) =>
      (this.testConvex.action as any)(functionReference, encodedArgs),
    ) as Effect.Effect<Ref.Returns<ActionRef>, ParseResult.ParseError>;

  readonly run: TestConfectWithoutIdentity<ConfectSchema>["run"] = (<A, B extends Value, E>(
    handler: Effect.Effect<A, E, RegisteredConvexFunction.MutationServices<ConfectSchema>>,
    returns?: Schema.Schema<A, B>,
  ) => {
    const makeMutationLayer = (
      mutationCtx: GenericMutationCtx<DataModel.ToConvex<DataModel.FromSchema<ConfectSchema>>>,
    ): Layer.Layer<RegisteredConvexFunction.MutationServices<ConfectSchema>> =>
      RegisteredConvexFunction.mutationLayer(this.schema, mutationCtx) as Layer.Layer<
        RegisteredConvexFunction.MutationServices<ConfectSchema>
      >;

    return returns === undefined
      ? Effect.promise(() =>
          this.testConvex.run((mutationCtx) =>
            Effect.runPromise(
              handler.pipe(Effect.asVoid, Effect.provide(makeMutationLayer(mutationCtx))),
            ),
          ),
        )
      : Effect.promise(() =>
          this.testConvex.run((mutationCtx) =>
            Effect.runPromise(
              handler.pipe(
                Effect.andThen(Schema.encode(returns)),
                Effect.provide(makeMutationLayer(mutationCtx)),
              ),
            ),
          ),
        ).pipe(Effect.andThen(Schema.decode(returns)));
  }) as TestConfectWithoutIdentity<ConfectSchema>["run"];

  readonly fetch = (pathQueryFragment: string, init?: RequestInit) =>
    Effect.promise(() => this.testConvex.fetch(pathQueryFragment, init));

  readonly finishInProgressScheduledFunctions = () =>
    Effect.promise(() => this.testConvex.finishInProgressScheduledFunctions());

  readonly finishAllScheduledFunctions = (advanceTimers: () => void) =>
    Effect.promise(() => this.testConvex.finishAllScheduledFunctions(advanceTimers));
}

class TestConfectImpl<
  ConfectSchema extends DatabaseSchema.AnyWithProps,
> implements TestConfectService<ConfectSchema> {
  private readonly testConfectImplWithoutIdentity: TestConfectImplWithoutIdentity<ConfectSchema>;

  constructor(
    private schema: ConfectSchema,
    private testConvex: TestConvexForDataModelAndIdentity<
      DataModel.ToConvex<DataModel.FromSchema<ConfectSchema>>
    >,
  ) {
    this.testConfectImplWithoutIdentity = new TestConfectImplWithoutIdentity(schema, testConvex);
  }

  readonly withIdentity = (userIdentity: Partial<UserIdentity>) =>
    new TestConfectImplWithoutIdentity(this.schema, this.testConvex.withIdentity(userIdentity));

  readonly query = <QueryRef extends Ref.AnyQuery>(queryRef: QueryRef, args: Ref.Args<QueryRef>) =>
    this.testConfectImplWithoutIdentity.query(queryRef, args);

  readonly mutation = <MutationRef extends Ref.AnyMutation>(
    mutationRef: MutationRef,
    args: Ref.Args<MutationRef>,
  ) => this.testConfectImplWithoutIdentity.mutation(mutationRef, args);

  readonly action = <ActionRef extends Ref.AnyAction>(
    actionRef: ActionRef,
    args: Ref.Args<ActionRef>,
  ) => this.testConfectImplWithoutIdentity.action(actionRef, args);

  readonly run: TestConfectService<ConfectSchema>["run"] = ((handler: any, returns?: any) =>
    this.testConfectImplWithoutIdentity.run(
      handler,
      returns,
    )) as TestConfectService<ConfectSchema>["run"];

  readonly fetch = (pathQueryFragment: string, init?: RequestInit) =>
    this.testConfectImplWithoutIdentity.fetch(pathQueryFragment, init);

  readonly finishInProgressScheduledFunctions = () =>
    this.testConfectImplWithoutIdentity.finishInProgressScheduledFunctions();

  readonly finishAllScheduledFunctions = (advanceTimers: () => void) =>
    this.testConfectImplWithoutIdentity.finishAllScheduledFunctions(advanceTimers);
}

const appModules = (import.meta as ImportMetaWithGlob).glob(
  "../../convex/**/*.{ts,tsx,js,mjs,cjs}",
);
const migrationsModules = (import.meta as ImportMetaWithGlob).glob(
  "../../node_modules/@convex-dev/migrations/dist/component/**/*.{js,mjs,cjs}",
);
const presenceModules = (import.meta as ImportMetaWithGlob).glob(
  "../../node_modules/@convex-dev/presence/dist/component/**/*.{js,mjs,cjs}",
);
const rateLimiterModules = (import.meta as ImportMetaWithGlob).glob(
  "../../node_modules/@convex-dev/rate-limiter/dist/component/**/*.{js,mjs,cjs}",
);
const cascadingDeletesModules = (import.meta as ImportMetaWithGlob).glob(
  "../../node_modules/@sholajegede/convex-cascading-deletes/dist/component/**/*.{js,mjs,cjs}",
);

function registerAppComponents(
  testConvex: TestConvexForDataModelAndIdentity<
    DataModel.ToConvex<DataModel.FromSchema<typeof confectSchema>>
  >,
) {
  testConvex.registerComponent("migrations", migrationsComponentSchema, migrationsModules);
  testConvex.registerComponent("presence", presenceComponentSchema, presenceModules);
  testConvex.registerComponent("rateLimiter", rateLimiterComponentSchema, rateLimiterModules);
  testConvex.registerComponent(
    "convexCascadingDeletes",
    cascadingDeletesComponentSchema,
    cascadingDeletesModules,
  );
}

export const layer = () =>
  Layer.sync(TestConfect, () => {
    const testConvex = convexTest(convexSchema, appModules) as TestConvexForDataModelAndIdentity<
      DataModel.ToConvex<DataModel.FromSchema<typeof confectSchema>>
    >;

    registerAppComponents(testConvex);

    return new TestConfectImpl(confectSchema, testConvex);
  });
