import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";

import { MODIFIER_LABELS } from "@/lib/game/card-types";
import { withIntlEn } from "@/tests/test-intl";

import { Flip7Card } from "./flip7-card";
import "./flip7-card.vrt.css";

const NUMBER_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

const ACTION_KINDS = ["freeze", "flip_three", "second_chance"] as const;

function cardShell(testId: string, card: ReactNode, snapshotWrap?: boolean) {
  const inner = <div data-testid={testId}>{card}</div>;
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
  test.each(NUMBER_VALUES)("number %i face up", async (numberValue) => {
    render(
      withIntlEn(
        cardShell(
          "vrt-card-shot",
          <Flip7Card kind="number" numberValue={numberValue} label="L" disableFlip3d />,
        ),
      ),
    );

    await page.viewport(480, 360);
    await expect(page.getByTestId("vrt-card-shot")).toMatchScreenshot(
      `flip7-number-${numberValue}`,
    );
  });

  test("number face-down (back)", async () => {
    render(
      withIntlEn(
        cardShell(
          "vrt-card-shot",
          <Flip7Card kind="number" numberValue={7} label="A" faceDown disableFlip3d />,
        ),
      ),
    );

    await page.viewport(480, 360);
    await expect(page.getByTestId("vrt-card-shot")).toMatchScreenshot("flip7-number-face-down");
  });

  test("number dealing (end of deal animation)", async () => {
    render(
      withIntlEn(
        cardShell(
          "vrt-card-shot",
          <Flip7Card kind="number" numberValue={7} label="L" dealing disableFlip3d />,
          true,
        ),
      ),
    );

    await page.viewport(480, 360);
    await expect(page.getByTestId("vrt-card-shot")).toMatchScreenshot("flip7-state-dealing");
  });

  test("number bust (end of bust animation)", async () => {
    render(
      withIntlEn(
        cardShell(
          "vrt-card-shot",
          <Flip7Card
            kind="number"
            numberValue={7}
            label="L"
            stateAnimation="bust"
            disableFlip3d
          />,
          true,
        ),
      ),
    );

    await page.viewport(480, 360);
    await expect(page.getByTestId("vrt-card-shot")).toMatchScreenshot("flip7-state-bust");
  });

  test("number stay (end of stay animation)", async () => {
    render(
      withIntlEn(
        cardShell(
          "vrt-card-shot",
          <Flip7Card
            kind="number"
            numberValue={7}
            label="L"
            stateAnimation="stay"
            disableFlip3d
          />,
          true,
        ),
      ),
    );

    await page.viewport(480, 360);
    await expect(page.getByTestId("vrt-card-shot")).toMatchScreenshot("flip7-state-stay");
  });

  test.each(MODIFIER_LABELS)("modifier %s", async (modifierValue) => {
    const slug = typeof modifierValue === "number" ? String(modifierValue) : modifierValue;

    render(
      withIntlEn(
        cardShell(
          "vrt-card-shot",
          <Flip7Card kind="modifier" modifierValue={modifierValue} label="M" disableFlip3d />,
        ),
      ),
    );

    await page.viewport(480, 360);
    await expect(page.getByTestId("vrt-card-shot")).toMatchScreenshot(`flip7-modifier-${slug}`);
  });

  test.each(ACTION_KINDS)("%s action", async (actionKind) => {
    render(
      withIntlEn(
        cardShell(
          "vrt-card-shot",
          <Flip7Card kind="action" actionKind={actionKind} label="A" disableFlip3d />,
        ),
      ),
    );

    await page.viewport(480, 360);
    await expect(page.getByTestId("vrt-card-shot")).toMatchScreenshot(
      `flip7-action-${actionKind}`,
    );
  });
});
