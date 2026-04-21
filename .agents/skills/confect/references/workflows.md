# Confect Workflows

## Typical change: new query or mutation

1. Update or add the relevant `GroupSpec`
2. Ensure the group is added to `confect/spec.ts`
3. Implement the handler with `FunctionImpl.make(...)`
4. Provide it from the matching `GroupImpl`
5. Ensure the group impl is wired into `confect/impl.ts`
6. Run `confect codegen` or `confect dev`
7. Update client code to use generated refs if the function is public

## Typical change: client usage

- Use `@confect/react`
- Import generated refs from `confect/_generated/refs`
- Match the argument shape from the spec's Effect schema

## Typical change: HTTP API

- Define the API and endpoints with `@effect/platform`
- Use generated runner services in handlers
- Mount them through `HttpApi.make` in `confect/http.ts`
- Verify the docs route at the configured prefix plus `docs`

## Safety notes

- If types are wrong, rerun codegen before assuming the source code is incorrect
- If a function exists in source but not in refs, the top-level spec or codegen step is often the missing piece
- If a handler cannot access database or runner helpers, check imports from `confect/_generated/services`
