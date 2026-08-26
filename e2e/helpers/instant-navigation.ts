import { expect, type Page } from "@playwright/test";

/** Skeleton placeholders from `GamePageLoading` (table chrome, not live match UI). */
export function gameInstantShell(page: Page) {
  return page.locator(".max-w-7xl [data-slot='skeleton']");
}

export async function expectGameInstantShell(page: Page) {
  await expect(gameInstantShell(page).first()).toBeVisible();
}
