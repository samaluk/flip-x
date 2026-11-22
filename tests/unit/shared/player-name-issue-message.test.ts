import { describe, expect, it } from "vitest";

import { playerNameIssueMessage } from "@/shared/lib/player-name-issue-message";

describe("player name issue display", () => {
  it("selects the translated message for each name validation issue", () => {
    const messages = {
      empty: "Enter a name",
      too_long: "Use a shorter name",
      no_session: "Session missing",
    };

    expect(playerNameIssueMessage("empty", messages)).toBe("Enter a name");
    expect(playerNameIssueMessage("too_long", messages)).toBe("Use a shorter name");
    expect(playerNameIssueMessage("no_session", messages)).toBe("Session missing");
  });
});
