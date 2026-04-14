import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";

import { withIntlEn } from "@/tests/test-intl";

import { LobbyCodeDisplay } from "./lobby-code-display";

describe("LobbyCodeDisplay VRT", () => {
  test("lobby code display", async () => {
    render(
      withIntlEn(
        <div role="img" aria-label="Lobby preview" className="bg-background text-foreground p-8">
          <LobbyCodeDisplay code="PLAY" />
        </div>,
      ),
    );

    await page.viewport(1280, 720);
    await expect(page.getByRole("img", { name: "Lobby preview" })).toMatchScreenshot(
      "lobby-code-display",
    );
  });
});
