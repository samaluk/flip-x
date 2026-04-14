import { expect, test } from "./fixtures";

import {
  createLobbyAsHost,
  findPageWithEnabledHitButton,
  getLobbyCode,
  hitControl,
  latestResolutionBodyLocator,
  matchSetupForm,
  waitForCreateLobbyEnabled,
  withThreePlayerMatch,
} from "./helpers/match";

test.describe("gameplay", () => {
  test.describe.configure({ timeout: 180_000 });

  test("join-by-code flow claims the seat without prompting twice", async ({ isolated }) => {
    const suffix = `${Date.now()}`;
    const hostContext = await isolated.create();
    const guestContext = await isolated.create();

    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    await createLobbyAsHost(hostPage, `Host ${suffix}`);

    const lobbyCode = await getLobbyCode(hostPage);

    await guestPage.goto(`/?code=${lobbyCode}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(guestPage.locator("#hostName")).toBeVisible({ timeout: 90_000 });
    const joinForm = matchSetupForm(guestPage);
    await joinForm.getByLabel("Your name").fill(`Guest ${suffix}`);
    await waitForCreateLobbyEnabled(guestPage);
    await joinForm.getByRole("button", { name: /join lobby/i }).click();

    await guestPage.waitForURL(/\/game\/[^/?#]+/);
    await expect(
      guestPage.getByRole("heading", { name: /join the game/i }),
    ).not.toBeVisible({ timeout: 20_000 });
    await expect(guestPage.getByText(`You are playing as Guest ${suffix}`).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("three players start a match and the active player can hit", async ({ isolated }) => {
    const suffix = `${Date.now()}`;

    await withThreePlayerMatch(
      isolated,
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
