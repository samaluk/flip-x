import { expect, test } from "./fixtures";

import { expectGameInstantShell } from "./helpers/instant-navigation";
import {
  createLobbyAsHost,
  getLobbyCode,
  waitForEnabled,
  waitForHydratedJoinByCodeForm,
} from "./helpers/match";

test.describe("instant navigation", () => {
  test("create new game shows the game table shell before lobby data loads", async ({
    page,
    instant,
  }) => {
    const hostName = `Host ${Date.now()}`;

    await page.goto("/");
    await page.locator("#playerName").fill(hostName);

    const createButton = page.getByRole("button", { name: /Create New Game/i });
    await waitForEnabled(createButton);

    await instant(page, async () => {
      await createButton.click();
      await page.waitForURL(/\/game\/[^/?#]+/);
      await expectGameInstantShell(page);
      await expect(page.getByRole("status", { name: /lobby code/i })).toHaveCount(0);
    });

    await expect(page.getByRole("status", { name: /lobby code/i })).toBeVisible();
  });

  test("join by lobby code shows the game table shell before seat status loads", async ({
    isolated,
    instant,
  }) => {
    const suffix = `${Date.now()}`;
    const hostContext = await isolated.create();
    const guestContext = await isolated.create();

    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    await createLobbyAsHost(hostPage, `Host ${suffix}`);
    const lobbyCode = await getLobbyCode(hostPage);

    await guestPage.goto(`/?code=${lobbyCode}`, { waitUntil: "domcontentloaded" });
    const joinForm = await waitForHydratedJoinByCodeForm(guestPage, lobbyCode);
    const guestName = `Guest ${suffix}`;

    await joinForm.locator("#playerName").fill(guestName);
    const guestColor = joinForm.getByRole("radio", { name: "Emerald" });
    await guestColor.click();

    const joinButton = joinForm.getByRole("button", { name: /Join Game/i });
    await waitForEnabled(joinButton);

    await instant(guestPage, async () => {
      await joinButton.click();
      await guestPage.waitForURL(/\/game\/[^/?#]+/);
      await expectGameInstantShell(guestPage);
      await expect(guestPage.getByText(`You are playing as ${guestName}`)).toHaveCount(0);
    });

    await expect(guestPage.getByText(`You are playing as ${guestName}`).first()).toBeVisible();
  });
});
