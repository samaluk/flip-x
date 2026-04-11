# Research: Flip 7 Web App

## Decision 1: Build as a single Next.js 16.2.3 application

- **Decision**: Use one Next.js 16.2.3 application with App Router for the player
  experience and colocate game-specific UI inside route segments.
- **Rationale**: The product is one shared web experience with no separate admin app,
  public API product, or native client. A single application keeps deployment,
  routing, styling, and testing simpler while still supporting interactive client
  components where needed.
- **Alternatives considered**:
  - Separate frontend and backend projects: rejected because it adds deployment and
    interface overhead without delivering user value for v1.
  - A purely client-rendered SPA: rejected because Next.js provides better structure
    for route-based loading states, metadata, and future extensibility.

## Decision 2: Use Convex as the authoritative real-time game backend

- **Decision**: Store match, round, player, card, and event state in Convex and run
  all state-changing game actions through Convex mutations.
- **Rationale**: Flip 7 is a shared-turn game where every player must see the same
  authoritative state quickly. Convex provides durable state, real-time subscriptions,
  and server-side mutation boundaries suited to deterministic turn resolution.
- **Alternatives considered**:
  - Local browser state only: rejected because it cannot reliably support multi-player
    synchronization or reconnect behavior.
  - A custom REST backend with a separate database: rejected because it adds more
    surface area than needed for a small real-time game.

## Decision 3: Keep rules in a deterministic rule engine separate from UI components

- **Decision**: Implement dealing, action-card effects, bust detection, Flip 7 ending,
  and score calculation in dedicated rule-engine modules rather than embedding logic in
  page or component code.
- **Rationale**: The official rules contain edge cases such as Second Chance,
  Flip Three interruption, Freeze banking, and modifier ordering. Isolating rule logic
  makes correctness testable and keeps UI rendering focused on state display.
- **Alternatives considered**:
  - Embed rules directly in Convex mutation handlers: rejected because it would make
    mutation files harder to test and reason about as the rules grow.
  - Compute rules in UI components: rejected because it risks client divergence from
    server state and weakens trust in the game's results.

## Decision 4: Use Tailwind CSS v4 with shadcn/ui for the presentation layer

- **Decision**: Style the app with Tailwind CSS v4 and compose reusable interaction
  primitives from shadcn/ui.
- **Rationale**: The product needs a coherent shared-table interface, clear turn
  affordances, accessible dialogs and controls, and fast iteration on responsive game
  layouts. Tailwind v4 and shadcn/ui support those needs without introducing a heavy
  custom design system up front.
- **Alternatives considered**:
  - Fully custom component primitives: rejected because it slows delivery and adds
    accessibility risk for common controls.
  - A large third-party UI system: rejected because it would impose more opinionated
    visual patterns than needed for a focused game interface.

## Decision 5: Use Oxc for linting and formatting

- **Decision**: Use Oxc as the single lint and format tool for application code.
- **Rationale**: The project starts from a clean slate, and Oxc provides one fast tool
  for code quality checks aligned with the constitution's maintainability gate.
- **Alternatives considered**:
  - Separate lint and format tools: rejected because one tool is simpler to adopt and
    enforce consistently in local development and CI.

## Decision 6: Use Vitest as the primary automated test runner

- **Decision**: Use Vitest for rule-engine unit tests, state-transition integration
  tests, contract tests for Convex-facing game operations, and component interaction
  tests for the game table.
- **Rationale**: The highest-risk failures in this feature are deterministic rule bugs
  and incorrect state transitions. Vitest supports fast feedback for pure logic and UI
  interaction tests without adding a second test runner.
- **Alternatives considered**:
  - Browser-only end-to-end testing as the main strategy: rejected because it would be
    slower and less precise for validating card-rule permutations.
  - No explicit contract tests: rejected because backend action boundaries must remain
    stable as UI features grow.

## Decision 7: Use GitHub Actions for CI quality gates

- **Decision**: Add a GitHub Actions workflow that runs install, lint, test, and build
  checks on every pull request.
- **Rationale**: The constitution requires code quality, test evidence, UX validation,
  and performance-awareness to be enforceable gates. CI is the minimum automation layer
  needed to keep those gates consistent.
- **Alternatives considered**:
  - Manual local verification only: rejected because it does not scale across
    contributors and makes regressions easier to miss.

## Decision 8: Preserve session continuity through durable match state

- **Decision**: Treat the current match snapshot and recent event history as durable
  server state so reconnecting players can return to the latest committed turn.
- **Rationale**: The specification requires restoration after refresh or brief
  disconnect. Durable state plus an event timeline also supports rule transparency and
  round summaries.
- **Alternatives considered**:
  - Rebuild state from only the current board view: rejected because score summaries
    and reconnect accuracy would be weaker.
  - Persist only cumulative score and current hand: rejected because action-card audit
    trails and round explanations would be incomplete.
