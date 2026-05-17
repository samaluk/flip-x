import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";

import { withIntlEn } from "@/tests/test-intl";

import { Flip7Card } from "./flip7-card";
import "./flip7-card.vrt.css";

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

describe("Flip7Card VRT", () => {
  test.each(REPRESENTATIVE_NUMBER_VALUES)("number %i face up", async (numberValue) => {
    render(
      withIntlEn(
        cardShell(<Flip7Card kind="number" numberValue={numberValue} label="L" disableFlip3d />),
      ),
    );

    await page.viewport(480, 360);
    await expect(page.getByTestId("vrt-card-preview")).toMatchScreenshot(
      `flip7-number-${numberValue}`,
    );
  });

  test("number face-down (back)", async () => {
    render(
      withIntlEn(
        cardShell(<Flip7Card kind="number" numberValue={7} label="A" faceDown disableFlip3d />),
      ),
    );

    await page.viewport(480, 360);
    await expect(page.getByTestId("vrt-card-preview")).toMatchScreenshot("flip7-number-face-down");
  });

  test("number dealing (end of deal animation)", async () => {
    render(
      withIntlEn(
        cardShell(
          <Flip7Card kind="number" numberValue={7} label="L" dealing disableFlip3d />,
          true,
        ),
      ),
    );

    await page.viewport(480, 360);
    await expect(page.getByTestId("vrt-card-preview")).toMatchScreenshot("flip7-state-dealing");
  });

  test("number bust (end of bust animation)", async () => {
    render(
      withIntlEn(
        cardShell(
          <Flip7Card kind="number" numberValue={7} label="L" stateAnimation="bust" disableFlip3d />,
          true,
        ),
      ),
    );

    await page.viewport(480, 360);
    await expect(page.getByTestId("vrt-card-preview")).toMatchScreenshot("flip7-state-bust");
  });

  test("number stay (end of stay animation)", async () => {
    render(
      withIntlEn(
        cardShell(
          <Flip7Card kind="number" numberValue={7} label="L" stateAnimation="stay" disableFlip3d />,
          true,
        ),
      ),
    );

    await page.viewport(480, 360);
    await expect(page.getByTestId("vrt-card-preview")).toMatchScreenshot("flip7-state-stay");
  });

  test.each(REPRESENTATIVE_MODIFIER_VALUES)("modifier %s", async (modifierValue) => {
    const slug = typeof modifierValue === "number" ? String(modifierValue) : modifierValue;

    render(
      withIntlEn(
        cardShell(
          <Flip7Card kind="modifier" modifierValue={modifierValue} label="M" disableFlip3d />,
        ),
      ),
    );

    await page.viewport(480, 360);
    await expect(page.getByTestId("vrt-card-preview")).toMatchScreenshot(`flip7-modifier-${slug}`);
  });

  test.each(ACTION_KINDS)("%s action", async (actionKind) => {
    render(
      withIntlEn(
        cardShell(<Flip7Card kind="action" actionKind={actionKind} label="A" disableFlip3d />),
      ),
    );

    await page.viewport(480, 360);
    await expect(page.getByTestId("vrt-card-preview")).toMatchScreenshot(
      `flip7-action-${actionKind}`,
    );
  });
});
