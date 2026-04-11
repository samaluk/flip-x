import "@testing-library/jest-dom/vitest";
import "@/app/globals.css";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
