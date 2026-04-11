import { test, expect } from "@playwright/test";

import {
  findPageWithEnabledHitButton,
  hitControl,
  latestResolutionBodyLocator,
  withThreePlayerMatch,
} from "./helpers/match";

test.describe("gameplay", () => {
  test("three players start a match and the active player can hit", async ({ browser }) => {
    const suffix = `${Date.now()}`;

    await withThreePlayerMatch(
      browser,
      {
        host: `Host ${suffix}`,
        guestA: `GuestA ${suffix}`,
        guestB: `GuestB ${suffix}`,
      },
      async ({ hostPage, guestAPage, guestBPage }) => {
        await test.step("resolve active player and read resolution text", async () => {
          const pages = [hostPage, guestAPage, guestBPage];
          const activePage = await findPageWithEnabledHitButton(pages);

          const resolution = latestResolutionBodyLocator(activePage);
          await expect(resolution).toBeVisible();
          const beforeHit = (await resolution.textContent())?.trim() ?? "";

          await test.step("hit updates latest resolution", async () => {
            await hitControl(activePage).click();

            await expect(async () => {
              const after = (await resolution.textContent())?.trim() ?? "";
              expect(after).not.toBe(beforeHit);
            }).toPass({ timeout: 30_000, intervals: [200, 500, 1000] });
          });
        });
      },
    );
  });
});
