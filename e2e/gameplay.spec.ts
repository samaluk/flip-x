import { expect, test } from "./fixtures";

import {
  createLobbyAsHost,
  findPageWithEnabledHitButton,
  getLobbyCode,
  hitControl,
  waitForEnabled,
  waitForHydratedJoinByCodeForm,
  withThreePlayerMatch,
} from "./helpers/match";

test.describe("gameplay", () => {
  test("create, join, start, and hit updates the table", async ({ isolated }) => {
    const suffix = `${Date.now()}`;

    await withThreePlayerMatch(
      isolated,
      {
        host: `Host ${suffix}`,
        guestA: `GuestA ${suffix}`,
        guestB: `GuestB ${suffix}`,
      },
      async ({ hostPage, guestAPage, guestBPage }) => {
        const pages = [hostPage, guestAPage, guestBPage];
        const activePage = await findPageWithEnabledHitButton(pages);

        const cards = activePage.locator(".flip-x-card-shell");
        const beforeHitCardCount = await cards.count();

        await hitControl(activePage).click();

        await expect(async () => {
          expect(await cards.count()).toBeGreaterThan(beforeHitCardCount);
        }).toPass({ intervals: [200, 500, 1000] });
      },
    );
  });

  test("join-by-code flow claims the seat without prompting twice", async ({ isolated }) => {
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
    const nameInput = joinForm.locator("#playerName");
    await nameInput.fill(guestName);
    await expect(nameInput).toHaveValue(guestName);

    await expect(joinForm.getByRole("radio", { name: "Cyan" })).toBeDisabled();
    const guestColor = joinForm.getByRole("radio", { name: "Emerald" });
    await guestColor.click();
    await expect(guestColor).toHaveAttribute("aria-checked", "true");

    const joinButton = joinForm.getByRole("button", { name: /Join Game/i });
    await waitForEnabled(joinButton);
    await joinButton.click();

    await guestPage.waitForURL(/\/game\/[^/?#]+/);
    await expect(guestPage.getByRole("heading", { name: /join the game/i })).not.toBeVisible();
    await expect(guestPage.getByText(`You are playing as Guest ${suffix}`).first()).toBeVisible();
  });
});
