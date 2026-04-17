import { render } from "@testing-library/react";
import { act } from "react";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";

import type { Id } from "@/convex/_generated/dataModel";
import type { MatchSnapshot } from "@/game/logic/view-models";
import {
  vrtSnapshotFlip7Hand,
  vrtSnapshotMidRound,
  vrtSnapshotPendingFreeze,
  vrtSnapshotRoundComplete,
} from "@/tests/fixtures/vrt-game-snapshots";
import { withIntlEn } from "@/tests/test-intl";

import { GameTableView } from "./game-table-view";
import "./game-table.vrt.css";

const noop = () => {};
const noopTarget = (_id: Id<"players">) => {};

async function renderGameTable(snapshot: MatchSnapshot) {
  await act(async () => {
    render(
      withIntlEn(
        <div
          data-vrt-snapshot
          role="img"
          aria-label="Game table preview"
          className="bg-background text-foreground inline-block min-w-[1280px] p-6 align-top"
        >
          <GameTableView
            snapshot={snapshot}
            isPending={false}
            onHit={noop}
            onStay={noop}
            onResolveAction={noopTarget}
            onStartNextRound={noop}
            disableCardFlip3d
            freezeLaneLayout
          />
        </div>,
      ),
    );

    await Promise.resolve();
  });
}

describe("GameTable VRT", () => {
  test("mid-round with opponents and bust lane", async () => {
    await renderGameTable(vrtSnapshotMidRound);
    await page.viewport(1440, 2400);
    await expect(page.getByRole("img", { name: "Game table preview" })).toMatchScreenshot(
      "game-mid-round",
    );
  });

  test("pending freeze target selection", async () => {
    await renderGameTable(vrtSnapshotPendingFreeze);
    await page.viewport(1440, 2400);
    await expect(page.getByRole("img", { name: "Game table preview" })).toMatchScreenshot(
      "game-pending-freeze",
    );
  });

  test("round complete with next round control", async () => {
    await renderGameTable(vrtSnapshotRoundComplete);
    await page.viewport(1440, 2400);
    await expect(page.getByRole("img", { name: "Game table preview" })).toMatchScreenshot(
      "game-round-complete",
    );
  });

  test("viewer flip 7 hand", async () => {
    await renderGameTable(vrtSnapshotFlip7Hand);
    await page.viewport(1440, 2400);
    await expect(page.getByRole("img", { name: "Game table preview" })).toMatchScreenshot(
      "game-flip7-hand",
    );
  });
});
