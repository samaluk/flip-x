## Effect Migration

This repo is adopting `effect` in small, low-risk increments. Early PRs should keep runtime behavior and Convex API shapes unchanged.

### Allowed In Early PRs

- `Config` for validated environment/config boundaries
- `Data.TaggedError` for internal typed domain errors
- `Effect.gen` for small, readable effect programs
- `Effect.tryPromise` for explicit async boundary normalization

### Non-Goals For Early PRs

- No Confect adoption
- No broad `Layer` / service rollout
- No rewrite of pure game logic just to use Effect
- No client-side architecture rewrite
- No user-visible behavior changes unless explicitly intended

### Migration Rules

- Keep Convex args, returns, and client error behavior stable while internals change.
- Prefer helper-level conversions before converting full mutations.
- Convert one meaningful flow per PR once the shared primitives exist.
- Add tests around a boundary before changing more stateful flows.

### Initial PR Sequence

1. Add the dependency and migration guardrails.
2. Add a validated config boundary.
3. Introduce internal tagged errors with legacy error mapping.
4. Convert low-risk helpers before larger Convex mutations.
