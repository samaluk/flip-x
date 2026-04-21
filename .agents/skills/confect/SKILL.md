---
name: confect
description: Build, review, debug, and extend apps that use Confect, the Effect-plus-Convex framework. Use this whenever the user mentions Confect, `confect/` directories, Effect schemas with Convex, `GroupSpec` or `FunctionSpec`, `GroupImpl` or `FunctionImpl`, generated `refs` or services, `confect codegen`, `confect dev`, or wants help wiring typed queries, mutations, actions, schema, HTTP APIs, or React hooks in a Confect project, even if they mostly talk about Convex or Effect rather than naming Confect directly.
---

# Confect Dev

Confect projects look similar to ordinary Convex apps, but the important constraints are different: the `confect/` directory is the source of truth, `confect/_generated/` is codegen output, and each API change usually spans schema, spec, impl, codegen, and sometimes client refs. Use this skill to keep those pieces aligned.

## When this skill matters

Reach for this skill when the task involves any of the following:

- Adding or changing tables in `confect/schema.ts` or `confect/tables/*`
- Defining or editing `GroupSpec`, `FunctionSpec`, `Spec.make()`, `GroupImpl`, `FunctionImpl`, or `Impl.finalize`
- Using generated `api`, `refs`, or `services`
- Running or fixing `confect codegen` and `confect dev`
- Adding React usage with `@confect/react`
- Adding HTTP endpoints with Confect's HTTP API support
- Debugging mismatches between schema/spec/impl/client code

## Working rules

1. Start by locating the Confect entry points.
Check for `confect/schema.ts`, `confect/spec.ts`, `confect/impl.ts`, optional `confect/http.ts`, `confect/nodeSpec.ts`, and `confect/nodeImpl.ts`. Read the surrounding group files before editing so your change matches the project's structure.

2. Treat `confect/` as the authored code and `confect/_generated/` as derived output.
Do not hand-edit files under `confect/_generated/`. If generated types or refs are stale, update source files and run `confect codegen` or `confect dev` instead.

3. Keep the spec and impl in sync.
If you add or rename a function in a `GroupSpec`, update the matching `FunctionImpl` and the top-level `spec.ts` or `impl.ts` wiring when needed. A Confect change is usually incomplete if only one side moved.

4. Prefer Confect primitives over generic Convex patterns.
When the project is using Confect, define tables with `Table.make`, schemas with Effect `Schema`, APIs with `FunctionSpec` and `GroupSpec`, implementations with `FunctionImpl` and `GroupImpl`, and handlers that return `Effect`s.

5. Use generated services inside handlers.
For server logic, prefer `DatabaseReader`, `DatabaseWriter`, `QueryRunner`, `MutationRunner`, `ActionRunner`, `Auth`, `Scheduler`, or storage services from `confect/_generated/services` instead of ad hoc wiring.

6. Preserve the project's naming conventions.
Use `.spec.ts` and `.impl.ts` files for groups unless the project already does something different. Keep nested groups and node actions organized the same way the repo already does.

7. Call out cross-file consequences.
When responding, mention which other Confect layers the user should expect to touch: schema, group spec, impl, codegen, React client, HTTP router, tests, or Convex deployment.

## Default workflow

1. Inspect structure.
Find the relevant files under `confect/` and check how the current group or feature is organized.

2. Identify the layer being changed.
Decide whether the task is primarily about database schema, function interface, implementation logic, client usage, HTTP API, or codegen.

3. Make the smallest consistent change.
Update the minimum set of authored files needed to keep the project coherent. Avoid introducing generic abstractions unless the existing codebase already uses them.

4. Regenerate derived artifacts when needed.
If the task changes schema, specs, refs, or generated services, run `confect codegen` or `confect dev` as appropriate and verify the generated output compiles.

5. Verify from the user-facing edge.
When possible, test the change where it is consumed: a React hook call, a function invocation, an HTTP endpoint, or a server-side Effect.

## Common patterns

### Add a new table

- Define the table with `Table.make(...)`
- Add indexes or search/vector indexes as needed
- Add it to `DatabaseSchema.make().addTable(...)`
- Use the table's `Fields` or `Doc` schema in specs and implementations where appropriate

### Add a new query or mutation

- Add a `FunctionSpec.publicQuery`, `publicMutation`, or another appropriate function spec to the relevant group
- Ensure the group's export is added to the top-level `Spec`
- Implement the function with `FunctionImpl.make(api, groupName, functionName, handler)`
- Provide the function layer from the appropriate `GroupImpl`
- Ensure the group impl is wired into the top-level `Impl` and finalized
- Regenerate code so `refs`, `api`, and services stay current

### Add React usage

- Use `@confect/react` hooks such as `useQuery` and `useMutation`
- Import from generated `confect/_generated/refs`
- Pass decoded arguments that match the spec's Effect schema, not the raw Convex validator style

### Add HTTP endpoints

- Define endpoints with `@effect/platform` HTTP API modules
- Use generated runner services such as `QueryRunner` in handlers
- Mount the API with `HttpApi.make` in `confect/http.ts`
- Remember that docs are served under the configured prefix plus `docs`

## Debugging checklist

If something is broken, check these in order:

- The table or schema field exists in the authored Confect schema
- The function exists in the relevant spec and is wired into `confect/spec.ts`
- The function impl exists and is wired into `confect/impl.ts`
- `Impl.finalize` is still present
- Generated `refs`, `api`, or services were refreshed after the change
- Client code is importing generated refs from the right location
- No one edited `confect/_generated/` directly

## Response style

- Be explicit about which Confect files need to change
- Prefer code that matches Confect docs and local project conventions
- If a user asks for plain Convex code inside a Confect project, explain the mismatch and only do it if they clearly want to step outside Confect
- If the repo appears half-migrated between Convex and Confect, say so and describe the safest path before editing heavily

## Reference files

- Read `references/core-concepts.md` when you need a compact refresher on schema/spec/impl/codegen
- Read `references/workflows.md` when the task involves React hooks, HTTP APIs, or day-to-day change patterns
