import { expect as baseExpect, test as base } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";
import { instant as runInstantNavigation } from "@next/playwright";

/** Runs assertions inside Next.js instant-navigation scope (see `@next/playwright`). */
export type InstantNavigation = <T>(page: Page, fn: () => Promise<T>) => Promise<T>;

/** Creates isolated browser contexts; all are closed after the test (tests never call `close`). */
export type IsolatedContexts = {
  create: () => Promise<BrowserContext>;
};

function collectBrowserDiagnostics(page: Page, messages: string[]) {
  page.on("console", (message) => {
    if (message.type() === "error") {
      messages.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    messages.push(error.message);
  });
}

function assertNoBrowserDiagnostics(messages: string[]) {
  if (messages.length === 0) {
    return;
  }
  throw new Error(`Browser console errors during E2E:\n\n${messages.join("\n\n")}`);
}

export const test = base.extend<{ isolated: IsolatedContexts; instant: InstantNavigation }>({
  page: async ({ page }, use) => {
    const messages: string[] = [];
    collectBrowserDiagnostics(page, messages);
    await use(page);
    assertNoBrowserDiagnostics(messages);
  },
  instant: async ({ baseURL }, use) => {
    await use((page, fn) => runInstantNavigation(page, fn, baseURL ? { baseURL } : undefined));
  },
  isolated: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];
    const messages: string[] = [];
    const create = async () => {
      const ctx = await browser.newContext();
      ctx.on("page", (page) => collectBrowserDiagnostics(page, messages));
      contexts.push(ctx);
      return ctx;
    };
    await use({ create });
    assertNoBrowserDiagnostics(messages);
    for (const ctx of contexts.toReversed()) {
      await ctx.close().catch(() => {});
    }
  },
});

export const expect = baseExpect;
