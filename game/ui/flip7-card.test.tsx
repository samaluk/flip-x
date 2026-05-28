import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { Flip7Card } from "./flip7-card";
import { withIntlEn } from "@/tests/test-intl";

vi.mock("motion/react", () => ({
  LazyMotion: ({ children }: { children?: ReactNode }) => <>{children}</>,
  domAnimation: {},
  m: {
    div: ({ children, className }: { children?: ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
  },
}));

describe("Flip7Card", () => {
  it("renders number value and labels", () => {
    render(withIntlEn(<Flip7Card kind="number" numberValue={7} label="A" />));

    expect(screen.getAllByText("7").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/number/i)).toBeInTheDocument();
    expect(screen.getByText(/no\. a/i)).toBeInTheDocument();
  });

  it("renders ×2 modifier label", () => {
    render(withIntlEn(<Flip7Card kind="modifier" modifierValue="x2" label="M" />));

    expect(screen.getAllByText("×2").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/bonus/i)).toBeInTheDocument();
  });

  it("renders numeric modifier with plus prefix", () => {
    render(withIntlEn(<Flip7Card kind="modifier" modifierValue={4} label="M" />));

    expect(screen.getAllByText("+4").length).toBeGreaterThanOrEqual(1);
  });

  it("renders action card title", () => {
    render(withIntlEn(<Flip7Card kind="action" actionKind="freeze" label="F" />));

    expect(screen.getAllByText(/freeze/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Action", { exact: true })).toBeInTheDocument();
  });

  it("hides face value when face down", () => {
    render(
      withIntlEn(<Flip7Card kind="number" numberValue={3} label="B" faceDown disableFlip3d />),
    );

    expect(screen.queryByText("3")).not.toBeInTheDocument();
    expect(screen.queryByText(/number/i)).not.toBeInTheDocument();
  });
});
