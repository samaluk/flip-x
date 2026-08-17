import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";

import { withIntlEn } from "@/tests/test-intl";

import { LobbyCodeDisplay } from "./lobby-code-display";

describe("LobbyCodeDisplay VRT", () => {
  test("lobby code display", async () => {
    render(
      withIntlEn(
        <div data-testid="vrt-lobby-preview" className="bg-background p-8 text-foreground">
          <LobbyCodeDisplay code="PLAY" />
        </div>,
      ),
    );

    await page.viewport(1280, 720);
    await expect(page.getByTestId("vrt-lobby-preview")).toMatchScreenshot("lobby-code-display");
  });
});
