import { render } from "@testing-library/react";
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

function renderGameTable(
  snapshot: MatchSnapshot,
  layoutMode?: "list" | "table",
  tableMode = false,
) {
  render(
    withIntlEn(
        <div
          data-vrt-snapshot
          data-testid="game-table-vrt"
          role="img"
          aria-label="Game table preview"
          className="bg-background text-foreground"
          style={
            tableMode
              ? { display: "inline-block", width: "960px", padding: "24px", verticalAlign: "top" }
              : { display: "inline-block", minWidth: "1280px", padding: "24px", verticalAlign: "top" }
          }
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
          initialLayoutMode={layoutMode}
          disableResponsiveBreakpoints={tableMode}
        />
      </div>,
    ),
  );
}

describe("GameTable VRT — list layout", () => {
  test("mid-round with opponents and bust lane", async () => {
    renderGameTable(vrtSnapshotMidRound);
    await page.viewport(1440, 2400);
    await expect(page.getByRole("img", { name: "Game table preview" })).toMatchScreenshot(
      "game-mid-round",
    );
  });

  test("pending freeze target selection", async () => {
    renderGameTable(vrtSnapshotPendingFreeze);
    await page.viewport(1440, 2400);
    await expect(page.getByRole("img", { name: "Game table preview" })).toMatchScreenshot(
      "game-pending-freeze",
    );
  });

  test("round complete with next round control", async () => {
    renderGameTable(vrtSnapshotRoundComplete);
    await page.viewport(1440, 2400);
    await expect(page.getByRole("img", { name: "Game table preview" })).toMatchScreenshot(
      "game-round-complete",
    );
  });

  test("viewer flip 7 hand", async () => {
    renderGameTable(vrtSnapshotFlip7Hand);
    await page.viewport(1440, 2400);
    await expect(page.getByRole("img", { name: "Game table preview" })).toMatchScreenshot(
      "game-flip7-hand",
    );
  });
});

describe("GameTable VRT — table layout", () => {
  test("mid-round table view with opponents", async () => {
    renderGameTable(vrtSnapshotMidRound, "table", true);
    await page.viewport(1440, 2400);
    await expect(page.getByRole("img", { name: "Game table preview" })).toMatchScreenshot(
      "game-table-mid-round",
    );
  });

  test("pending freeze target selection in table view", async () => {
    renderGameTable(vrtSnapshotPendingFreeze, "table", true);
    await page.viewport(1440, 2400);
    await expect(page.getByRole("img", { name: "Game table preview" })).toMatchScreenshot(
      "game-table-pending-freeze",
    );
  });

  test("round complete in table view", async () => {
    renderGameTable(vrtSnapshotRoundComplete, "table", true);
    await page.viewport(1440, 2400);
    await expect(page.getByRole("img", { name: "Game table preview" })).toMatchScreenshot(
      "game-table-round-complete",
    );
  });

  test("viewer flip 7 hand in table view", async () => {
    renderGameTable(vrtSnapshotFlip7Hand, "table", true);
    await page.viewport(1440, 2400);
    await expect(page.getByRole("img", { name: "Game table preview" })).toMatchScreenshot(
      "game-table-flip7-hand",
    );
  });
});
