import "@testing-library/jest-dom/vitest";
import "@/app/globals.css";
import { MotionGlobalConfig } from "motion/react";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * Jump all Motion animations to their end state (motiondivision/motion#1160, #2461).
 * Browser project is VRT-only; keeps screenshots deterministic without per-component flags.
 */
MotionGlobalConfig.skipAnimations = true;

afterEach(() => {
  cleanup();
});
