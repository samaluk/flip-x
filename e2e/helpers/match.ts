import { expect, type Browser, type Page } from "@playwright/test";

/**
 * Locators use roles and copy from the default locale (`en`, `localePrefix: "never"`).
 * Run with another UI language only after aligning these strings or switching strategy.
 */

export function matchIdFromGameUrl(url: string): string | null {
  const m = url.match(/\/game\/([^/?#]+)/);
  return m?.[1] ?? null;
}

/** MatchSetup form on home or join-by-code flow (contains the host name field). */
export function matchSetupForm(page: Page) {
  return page.locator("form").filter({ has: page.locator("#hostName") });
}

/** Claim-seat form on the game page before the viewer has joined. */
export function joinSeatForm(page: Page) {
  return page.locator("form").filter({ has: page.getByRole("button", { name: /join game/i }) });
}

/** Session id is set in useEffect; button also requires a non-empty name. */
export async function waitForCreateLobbyEnabled(page: Page) {
  await expect(
    matchSetupForm(page).getByRole("button", { name: /create lobby|join lobby/i }),
  ).toBeEnabled({
    timeout: 20_000,
  });
}

export async function createLobbyAsHost(page: Page, hostName: string) {
  await page.goto("/");
  const form = matchSetupForm(page);
  await form.getByLabel("Your name").fill(hostName);
  await waitForCreateLobbyEnabled(page);
  await form.getByRole("button", { name: /create lobby|join lobby/i }).click();
  await page.waitForURL(/\/game\/[^/?#]+/);
  const id = matchIdFromGameUrl(page.url());
  if (!id) {
    throw new Error(`Expected /game/:matchId in URL, got ${page.url()}`);
  }
  return id;
}

export async function getLobbyCode(page: Page) {
  await expect(page.getByTestId("lobby-code-value")).toBeVisible({ timeout: 20_000 });
  const code = (await page.getByTestId("lobby-code-value").textContent())?.trim();
  if (!code) {
    throw new Error("Expected lobby code to be visible");
  }
  return code;
}

export async function joinGameAsGuest(page: Page, matchId: string, displayName: string) {
  await page.goto(`/game/${matchId}`);
  const form = joinSeatForm(page);
  await form.getByRole("textbox").fill(displayName);
  await expect(form.getByRole("button", { name: /join game/i })).toBeEnabled({
    timeout: 20_000,
  });
  await form.getByRole("button", { name: /join game/i }).click();
  await expect(form).not.toBeVisible({ timeout: 20_000 });
}

export async function clickStartGameWhenReady(hostPage: Page) {
  const start = hostPage.getByRole("button", { name: /^start game$/i });
  await expect(start).toBeEnabled({ timeout: 45_000 });
  await start.click();
  // Do not assert on the Start locator alone: the label becomes "Starting..." then the control unmounts,
  // so /start game/i can match 0 nodes and `not.toBeVisible` would pass too early.
  await expect(hostPage.locator(".game-match-status")).toHaveAttribute(
    "data-status",
    "in_progress",
    { timeout: 45_000 },
  );
}

/** Hit uses the shared `Button` primitive (`data-slot="button"`), not a raw `<button>`. */
export function hitControl(page: Page) {
  return page.locator('[data-slot="button"]').filter({ hasText: /^Hit for /i });
}

export async function findPageWithEnabledHitButton(pages: Page[]): Promise<Page> {
  let found: Page | undefined;
  await expect(async () => {
    found = undefined;
    for (const p of pages) {
      const hit = hitControl(p);
      if ((await hit.count()) === 0) continue;
      if (await hit.first().isEnabled()) {
        found = p;
        return;
      }
    }
    throw new Error("No page has an enabled Hit button yet");
  }).toPass({ timeout: 90_000, intervals: [250, 500, 1000] });
  if (!found) {
    throw new Error("Hit button not found after wait");
  }
  return found;
}

export function latestResolutionBodyLocator(page: Page) {
  return page.locator(".game-latest-resolution");
}

export type ThreePlayerContext = {
  hostPage: Page;
  guestAPage: Page;
  guestBPage: Page;
  matchId: string;
};

/**
 * Opens three isolated browser contexts, runs host + two guests through lobby and start,
 * then invokes the callback. Always closes contexts in a `finally` block.
 */
export async function withThreePlayerMatch(
  browser: Browser,
  names: { host: string; guestA: string; guestB: string },
  fn: (ctx: ThreePlayerContext) => Promise<void>,
): Promise<void> {
  const hostContext = await browser.newContext();
  const guestAContext = await browser.newContext();
  const guestBContext = await browser.newContext();

  const hostPage = await hostContext.newPage();
  const guestAPage = await guestAContext.newPage();
  const guestBPage = await guestBContext.newPage();

  try {
    const matchId = await createLobbyAsHost(hostPage, names.host);
    await joinGameAsGuest(guestAPage, matchId, names.guestA);
    await joinGameAsGuest(guestBPage, matchId, names.guestB);
    await clickStartGameWhenReady(hostPage);
    await fn({ hostPage, guestAPage, guestBPage, matchId });
  } finally {
    await guestBContext.close();
    await guestAContext.close();
    await hostContext.close();
  }
}
