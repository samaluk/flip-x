# Testing principles

Adapted from Kent C. Dodds' testing principles in Kody:
https://github.com/kentcdodds/kody/blob/main/docs/contributing/testing-principles.md

These principles complement the suite ownership and commands in [`testing.md`](testing.md). The suite map in that document determines where tests belong; these principles guide how tests within those suites should be designed.

## Principles

- Choose the lightest test layer that can falsify the behavior. Escalate only when a real boundary such as React rendering, Convex persistence/runtime wiring, the browser, or visual rendering is required.
- Prefer fewer, longer tests when multiple actions and assertions belong to one meaningful workflow.
- Treat a test like a manual tester's script: explicit setup, actions in realistic order, and all relevant assertions for that journey.
- Do not split one coherent flow into tiny tests merely to achieve one assertion per test. Multiple related assertions are desirable when they validate the same behavior.
- Keep test files flat where practical. Prefer top-level `test(...)`/`it(...)` over deep `describe` nesting.
- Avoid hidden shared setup. Prefer setup inside the test or explicit factory helpers over `beforeEach`/`afterEach` hooks that obscure what the test needs.
- Avoid shared mutable state between tests. If later assertions depend on the same rendered object, command sequence, replay, or persisted state, they likely belong in the same test.
- Build helpers that return ready-to-use objects, fixtures, or deterministic scenarios instead of exposing mutable globals.
- Keep test names behavior-focused and specific enough to explain the expected outcome.
- Test observable behavior and stable public contracts rather than implementation details.
- Prefer structured or user-visible outcomes over assertions that pin incidental prose, descriptions, warnings, or configuration strings.
- Do not write tests for guarantees already enforced by the type system unless runtime behavior adds something materially different.
- Keep tests deterministic and able to run offline where practical. Prefer local fixtures, deterministic replay, `convex-test`, and controlled dependencies over live public services.
- Keep the bar high for backend smoke, visual regression, and E2E coverage. Reserve those layers for behavior that cannot be proved honestly in the faster suites.
- Prefer asserting meaningful intermediate states inside the broader workflow that produces them rather than creating isolated tests for incidental loading or transition states.
- Add regression tests when the failure is plausible to recur or the affected workflow is important enough to justify ongoing maintenance.
- Use disposable resources only when there is real cleanup to perform; do not add lifecycle machinery without a cleanup need.
- Use async/await for asynchronous tests; avoid callback-style completion APIs when the framework supports promises.
- Never commit focused or disabled tests such as `.only` or `.skip` unless the repository explicitly documents an exception.

## Review heuristic

Before adding a test, ask:

1. What behavior could this test falsify?
2. Which existing suite is the lightest honest owner of that behavior?
3. Does this assertion belong to an existing workflow test instead of a new isolated case?
4. Am I testing behavior, or merely pinning implementation detail or prose?
5. Will this test remain useful enough to justify its maintenance and runtime cost?
