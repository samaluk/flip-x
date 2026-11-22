import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";

import { withIntlEn } from "@/tests/test-intl";

import { FlipXCard } from "./flip-x-card";
import "./flip-x-card.vrt.css";

const REPRESENTATIVE_NUMBER_VALUES = [0, 7, 12] as const;
const REPRESENTATIVE_MODIFIER_VALUES = [2, 10, "x2"] as const;
const ACTION_KINDS = ["freeze", "flip_three", "second_chance"] as const;

function cardShell(card: ReactNode, snapshotWrap?: boolean) {
  const inner = <div data-testid="vrt-card-preview">{card}</div>;
  if (snapshotWrap) {
    return (
      <div data-vrt-snapshot className="inline-block bg-background p-4 text-foreground">
        {inner}
      </div>
    );
  }
  return <div className="inline-block bg-background p-4 text-foreground">{inner}</div>;
}

describe("FlipXCard VRT", () => {
  test.each(REPRESENTATIVE_NUMBER_VALUES)("number %i face up", async (numberValue) => {
    render(
      withIntlEn(
        cardShell(<FlipXCard kind="number" numberValue={numberValue} label="L" disableFlip3d />),
      ),
    );

    await page.viewport(480, 360);
    await expect(page.getByTestId("vrt-card-preview")).toMatchScreenshot(
      `flip-x-number-${numberValue}`,
    );
  });

  test("number face-down (back)", async () => {
    render(
      withIntlEn(
        cardShell(<FlipXCard kind="number" numberValue={7} label="A" faceDown disableFlip3d />),
      ),
    );

    await page.viewport(480, 360);
    await expect(page.getByTestId("vrt-card-preview")).toMatchScreenshot("flip-x-number-face-down");
  });

  test.each([
    ["dealing", { dealing: true }],
    ["bust", { stateAnimation: "bust" }],
    ["stay", { stateAnimation: "stay" }],
  ] as const)("number %s (end of animation)", async (state, animation) => {
    render(
      withIntlEn(
        cardShell(
          <FlipXCard kind="number" numberValue={7} label="L" disableFlip3d {...animation} />,
          true,
        ),
      ),
    );

    await page.viewport(480, 360);
    await expect(page.getByTestId("vrt-card-preview")).toMatchScreenshot(`flip-x-state-${state}`);
  });

  test.each(REPRESENTATIVE_MODIFIER_VALUES)("modifier %s", async (modifierValue) => {
    const slug = typeof modifierValue === "number" ? String(modifierValue) : modifierValue;

    render(
      withIntlEn(
        cardShell(
          <FlipXCard kind="modifier" modifierValue={modifierValue} label="M" disableFlip3d />,
        ),
      ),
    );

    await page.viewport(480, 360);
    await expect(page.getByTestId("vrt-card-preview")).toMatchScreenshot(`flip-x-modifier-${slug}`);
  });

  test.each(ACTION_KINDS)("%s action", async (actionKind) => {
    render(
      withIntlEn(
        cardShell(<FlipXCard kind="action" actionKind={actionKind} label="A" disableFlip3d />),
      ),
    );

    await page.viewport(480, 360);
    await expect(page.getByTestId("vrt-card-preview")).toMatchScreenshot(
      `flip-x-action-${actionKind}`,
    );
  });
});
