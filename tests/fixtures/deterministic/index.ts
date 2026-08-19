// Explicit barrel for the deterministic replay/setup fixture layer.
// Re-export only the symbols consumers actually use; keep module-internal
// types (ConfectMatchSnapshot) out of the public surface.
export { numberCard, modifierCard, actionCard } from "@/tests/builders/cards";

export {
  requireActiveSessionForSnapshot,
  requireSourceSessionForPendingAction,
  requireSessionForPlayerId,
  classifyRoundBoundaryAdvanceStep,
  classifyRoundBoundaryAdvanceStepOrThrow,
} from "./match-session-for-snapshot";
export type {
  MatchPlayersRow,
  SnapshotWithActivePlayer,
  SnapshotForRoundBoundaryAdvance,
  RoundBoundaryAdvanceClassification,
  RoundBoundaryAdvanceAfterLoad,
} from "./match-session-for-snapshot";

export {
  canonicalizeSnapshot,
  expectSnapshotToMatchExpected,
  projectExpectedReplayState,
  describeReplayResult,
  expectReplayToMatch,
  expectSnapshotsToMatch,
} from "./replay-assertions";
export {
  cloneCard,
  cloneCards,
  cloneDeterministicStartOptions,
  runDeterministicReplayScenario,
} from "./scenario-runner";
export type { ReplaySessionRecord, ReplayHarness } from "./scenario-runner";

export {
  createDeterministicReplayHarness,
  createDivergenceReplayHarness,
} from "./replay-harness-factory";
export type { TestClient } from "./replay-harness-factory";

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

export type {
  DeterministicRoundSeed,
  DeterministicStartOptions,
  DeterministicSetupScenario,
  ReplayDecisionStep,
  CanonicalReplaySnapshot,
  ReplayExpectedPlayerFacts,
  ReplayExpectedState,
  DeterministicReplayScenario,
  ReplayResult,
  CanonicalSetupSnapshot,
} from "./scenario-types";
