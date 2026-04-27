import { expect, type Locator, type Page } from "@playwright/test";

import type { IsolatedContexts } from "../fixtures";

const SESSION_READY_TIMEOUT_MS = 45_000;

/**
 * Locators use roles and copy from the default locale (`en`, `localePrefix: "never"`).
 * Run with another UI language only after aligning these strings or switching strategy.
 */

export function matchIdFromGameUrl(url: string): string | null {
  const m = url.match(/\/game\/([^/?#]+)/);
  return m?.[1] ?? null;
}

/** MatchSetup form on home or join-by-code flow (contains the player name field). */
export function matchSetupForm(page: Page) {
  return page.locator("main:has(#playerName)");
}

/** Home-page join-by-code form after the lobby code from the URL has hydrated into the input. */
export async function waitForHydratedJoinByCodeForm(page: Page, lobbyCode: string) {
  const form = matchSetupForm(page);
  const joinCodeInput = form.locator("#joinCode");

  await expect(joinCodeInput).toBeVisible({ timeout: SESSION_READY_TIMEOUT_MS });
  await expect(joinCodeInput).toHaveValue(lobbyCode, { timeout: SESSION_READY_TIMEOUT_MS });

  return form;
}

/** Claim-seat form on the game page before the viewer has joined. */
export function joinSeatForm(page: Page) {
  return page.locator("form").filter({ has: page.getByRole("button", { name: /^join game$/i }) });
}

export type TwoPlayerContext = {
  hostPage: Page;
  guestPage: Page;
  matchId: string;
};

/**
 * Opens two isolated browser contexts via the `isolated` fixture, runs host + guest
 * through lobby and start, then invokes the callback. Context teardown is handled by the fixture.
 */
export async function withTwoPlayerMatch(
  isolated: IsolatedContexts,
  names: { host: string; guest: string },
  fn: (ctx: TwoPlayerContext) => Promise<void>,
): Promise<void> {
  const hostContext = await isolated.create();
  const guestContext = await isolated.create();

  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  const matchId = await createLobbyAsHost(hostPage, names.host);
  await joinGameAsGuest(guestPage, matchId, names.guest);
  await clickStartGameWhenReady(hostPage);
  await fn({ hostPage, guestPage, matchId });
}

/** Session id is set in useEffect; the target submit button should become enabled once ready. */
export async function waitForEnabled(button: Locator) {
  await expect(button).toBeEnabled({
    timeout: SESSION_READY_TIMEOUT_MS,
  });
}

export async function createLobbyAsHost(page: Page, hostName: string) {
  await page.goto("/");
  await page.locator("#playerName").fill(hostName);
  const createButton = page.getByRole("button", { name: /Create New Game/i });
  await waitForEnabled(createButton);
  await createButton.click();
  await page.waitForURL(/\/game\/[^/?#]+/);
  const id = matchIdFromGameUrl(page.url());
  if (!id) {
    throw new Error(`Expected /game/:matchId in URL, got ${page.url()}`);
  }
  return id;
}

export async function getLobbyCode(page: Page) {
  const region = page.getByRole("status", { name: /lobby code/i });
  await expect(region).toBeVisible({ timeout: 20_000 });
  // Code lives in a span; the region also contains the Copy button (see LobbyCodeDisplay).
  const codeEl = region.locator("span.font-mono");
  await expect(codeEl).toBeVisible();
  const code = (await codeEl.textContent())?.trim();
  if (!code) {
    throw new Error("Expected lobby code to be visible");
  }
  return code;
}

export async function joinGameAsGuest(page: Page, matchId: string, displayName: string) {
  await page.goto(`/game/${matchId}`);
  const form = joinSeatForm(page);
  await form.getByRole("textbox").fill(displayName);
  const joinButton = form.getByRole("button", { name: /join game/i });
  await waitForEnabled(joinButton);
  await joinButton.click();
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

/**
 * Hit uses the shared `Button` primitive (`data-slot="button"`), not a raw `<button>`).
 * TurnControls can be mounted twice (list vs round-table); only one is visible — use visible + first.
 */
export function hitControl(page: Page) {
  return page
    .locator('[data-slot="button"]')
    .filter({ hasText: /^(Hit for |Draw \()/i })
    .filter({ visible: true })
    .first();
}

function pendingActionTargetControl(page: Page) {
  return page
    .getByRole("button", { name: /^Select .+ as target$/i })
    .filter({ visible: true })
    .first();
}

export async function findPageWithEnabledHitButton(pages: Page[]): Promise<Page> {
  let found: Page | undefined;
  await expect(async () => {
    found = undefined;
    for (const p of pages) {
      const target = pendingActionTargetControl(p);
      if ((await target.count()) > 0) {
        await target.click();
        await expect(target).not.toBeVisible({ timeout: SESSION_READY_TIMEOUT_MS });
        throw new Error("Resolved pending action target; waiting for next turn state");
      }

      const hit = hitControl(p);
      if ((await hit.count()) === 0) continue;
      if (await hit.isEnabled()) {
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

/** Latest-resolution body is mounted twice in the game table UI (aside + round table); one copy is hidden via CSS. */
export function latestResolutionBodyLocator(page: Page) {
  return page.locator(".game-latest-resolution").filter({ visible: true });
}

/** Count of Flip7Cards for a player (modifier + number + held action + received action cards). */
export async function countPlayerCards(page: Page): Promise<number> {
  return page.locator(".player-lane .flip7-card").count();
}

export type ThreePlayerContext = {
  hostPage: Page;
  guestAPage: Page;
  guestBPage: Page;
  matchId: string;
};

/**
 * Opens three isolated browser contexts via the `isolated` fixture, runs host + two guests
 * through lobby and start, then invokes the callback. Context teardown is handled by the fixture.
 */
export async function withThreePlayerMatch(
  isolated: IsolatedContexts,
  names: { host: string; guestA: string; guestB: string },
  fn: (ctx: ThreePlayerContext) => Promise<void>,
): Promise<void> {
  const hostContext = await isolated.create();
  const guestAContext = await isolated.create();
  const guestBContext = await isolated.create();

  const hostPage = await hostContext.newPage();
  const guestAPage = await guestAContext.newPage();
  const guestBPage = await guestBContext.newPage();

  const matchId = await createLobbyAsHost(hostPage, names.host);
  await joinGameAsGuest(guestAPage, matchId, names.guestA);
  await joinGameAsGuest(guestBPage, matchId, names.guestB);
  await clickStartGameWhenReady(hostPage);
  await fn({ hostPage, guestAPage, guestBPage, matchId });
}
