import { render, screen } from "@testing-library/react";
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
          data-testid="vrt-game-table"
          className="inline-block min-w-7xl bg-background p-6 align-top text-foreground"
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
    await expect(page.getByTestId("vrt-game-table")).toMatchScreenshot("game-mid-round");
  });

  test("pending freeze target selection", async () => {
    await renderGameTable(vrtSnapshotPendingFreeze);
    await page.viewport(1440, 2400);
    await expect(page.getByTestId("vrt-game-table")).toMatchScreenshot("game-pending-freeze");
  });

  test("round complete with next round control including busted opponent", async () => {
    await renderGameTable(vrtSnapshotRoundComplete);
    await page.viewport(1440, 2400);
    expect(screen.getByRole("button", { name: /start next round/i })).toBeInTheDocument();
    expect(screen.getByText("Busted")).toBeInTheDocument();
    await expect(page.getByTestId("vrt-game-table")).toMatchScreenshot("game-round-complete");
  });

  test("viewer flip 7 hand", async () => {
    await renderGameTable(vrtSnapshotFlip7Hand);
    await page.viewport(1440, 2400);
    await expect(page.getByTestId("vrt-game-table")).toMatchScreenshot("game-flip7-hand");
  });
});
