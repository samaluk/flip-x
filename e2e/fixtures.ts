import { expect as baseExpect, test as base } from "@playwright/test";
import type { BrowserContext } from "@playwright/test";

/** Creates isolated browser contexts; all are closed after the test (tests never call `close`). */
export type IsolatedContexts = {
  create: () => Promise<BrowserContext>;
};

export const test = base.extend<{ isolated: IsolatedContexts }>({
  isolated: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];
    const create = async () => {
      const ctx = await browser.newContext();
      contexts.push(ctx);
      return ctx;
    };
    await use({ create });
    for (const ctx of contexts.toReversed()) {
      await ctx.close().catch(() => {});
    }
  },
});

export const expect = baseExpect;
