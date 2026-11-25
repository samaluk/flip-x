// Explicit barrel for the deterministic replay/setup fixture layer.
// Re-export only the symbols consumers actually use; keep module-internal
// types (ConfectMatchSnapshot) out of the public surface.
export {
  requireActiveSessionForSnapshot,
  requireSourceSessionForPendingAction,
  requireSessionForPlayerId,
  classifyRoundBoundaryAdvanceStepOrThrow,
} from "./match-session-for-snapshot";

export {
  canonicalizeSnapshot,
  describeReplayResult,
  expectSnapshotsToMatch,
} from "./replay-assertions";
export { runDeterministicReplayScenario } from "./scenario-runner";

export {
  createDeterministicReplayHarness,
  createDivergenceReplayHarness,
} from "./replay-harness-factory";

export { BASIC_DETERMINISTIC_SETUP_SCENARIO, cloneSetupScenario } from "./setup-scenarios";

export {
  MATCH_REPLAY_SCENARIO,
  ROUND_REPLAY_SCENARIO,
  cloneReplayScenario,
} from "./replay-scenarios";

export {
  DIVERGED_REPLAY_SCENARIO,
  INCOMPLETE_REPLAY_SCENARIO,
  EXTRA_STEP_REPLAY_SCENARIO,
} from "./divergence-scenarios";

export { createStubReplayHarness } from "./replay-snapshot-fixture";

export type { DeterministicStartOptions, ReplayResult } from "./scenario-types";
