# Confect Core Concepts

## Purpose

Confect integrates Effect schemas and Effect-based handlers with Convex. In practice, this means authored code lives in `confect/`, generated glue lives in `confect/_generated/`, and changes often span more than one file.

## Entry points

- `confect/schema.ts`: authored database schema
- `confect/spec.ts`: top-level API interface
- `confect/impl.ts`: top-level implementation layer, finalized with `Impl.finalize`
- `confect/http.ts`: optional HTTP router
- `confect/nodeSpec.ts` and `confect/nodeImpl.ts`: optional node action entry points

## Spec/Impl model

- A spec defines function names, arguments, and return schemas using `FunctionSpec` and `GroupSpec`
- An impl provides the logic using `FunctionImpl` and `GroupImpl`
- The client and server both benefit from shared schema knowledge, so changing one side without the other is usually a bug

## Generated files

`confect/_generated/` contains derived files such as `api.ts`, `refs.ts`, `registeredFunctions.ts`, and `services.ts`.

Do not edit these by hand. Regenerate them after source changes.

## Tables and schemas

- Define tables with `Table.make(name, Schema.Struct(...))`
- Add tables to `DatabaseSchema.make()`
- Use indexes just like Convex, but keep the authored schema in Confect
- Table `.Doc` is useful when a function returns full documents

## Naming conventions

- Group files usually use `.spec.ts` and `.impl.ts`
- Node actions commonly live under `confect/node/`
- Nested groups often get a directory named after the parent group

These are conventions, not hard requirements, except for Confect's fixed entry-point files.
