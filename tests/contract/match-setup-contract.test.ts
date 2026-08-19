import * as Schema from "effect/Schema";
import { describe, expect, it } from "vitest";

import matchesSpec from "@/confect/matches.spec";
import { AppErrorSchema, lobbyNotFound, nameAlreadyTaken } from "@/shared/lib/errors/domain";

describe("match setup Confect mutation contract", () => {
  it("registers all match setup public functions with expected metadata", () => {
    const fnNames = Object.keys(matchesSpec.functions);

    expect(fnNames).toContain("createMatch");
    expect(fnNames).toContain("getMatchByCode");
    expect(fnNames).toContain("joinByCode");
    expect(fnNames).toContain("joinMatch");

    expect(matchesSpec.functions.createMatch.functionVisibility).toBe("public");
    expect(matchesSpec.functions.createMatch.runtimeAndFunctionType).toEqual({
      runtime: "Convex",
      functionType: "mutation",
    });

    expect(matchesSpec.functions.getMatchByCode.functionVisibility).toBe("public");
    expect(matchesSpec.functions.getMatchByCode.runtimeAndFunctionType).toEqual({
      runtime: "Convex",
      functionType: "query",
    });

    expect(matchesSpec.functions.joinByCode.functionVisibility).toBe("public");
    expect(matchesSpec.functions.joinByCode.runtimeAndFunctionType).toEqual({
      runtime: "Convex",
      functionType: "mutation",
    });

    expect(matchesSpec.functions.joinMatch.functionVisibility).toBe("public");
    expect(matchesSpec.functions.joinMatch.runtimeAndFunctionType).toEqual({
      runtime: "Convex",
      functionType: "mutation",
    });
  });

  it("validates createMatch arguments and return contract shapes", () => {
    const createMatchSpec = matchesSpec.functions.createMatch;
    expect(createMatchSpec.name).toBe("createMatch");

    const provenance = createMatchSpec.functionProvenance;
    if (provenance._tag !== "Confect") {
      throw new Error("Expected Confect function spec");
    }

    const isArgsValid = Schema.is(provenance.args);

    expect(isArgsValid({ hostName: "Alex", hostColorId: "cyan", sessionId: "s-1" })).toBe(true);
    expect(isArgsValid({ hostName: "Alex", sessionId: "s-1" })).toBe(true);
    expect(isArgsValid({ hostName: "Alex" })).toBe(false);
    expect(isArgsValid({ hostColorId: "cyan", sessionId: "s-1" })).toBe(false);

    expect(Schema.is(provenance.error)(nameAlreadyTaken({ name: "Alex" }))).toBe(true);
  });

  it("validates joinByCode arguments and return contract shapes", () => {
    const joinByCodeSpec = matchesSpec.functions.joinByCode;
    expect(joinByCodeSpec.name).toBe("joinByCode");

    const provenance = joinByCodeSpec.functionProvenance;
    if (provenance._tag !== "Confect") {
      throw new Error("Expected Confect function spec");
    }

    const isArgsValid = Schema.is(provenance.args);

    expect(isArgsValid({ lobbyCode: "ABCD", sessionId: "s-1" })).toBe(true);
    expect(isArgsValid({ lobbyCode: "ABCD" })).toBe(false);
    expect(isArgsValid({})).toBe(false);

    const isReturnsValid = Schema.is(provenance.returns);

    expect(isReturnsValid({ matchId: "m-1", lobbyCode: "ABCD" })).toBe(true);
    expect(isReturnsValid({ matchId: "m-1" })).toBe(false);

    expect(Schema.is(provenance.error)(lobbyNotFound())).toBe(true);
  });

  it("validates joinMatch arguments and return contract shapes", () => {
    const joinMatchSpec = matchesSpec.functions.joinMatch;
    expect(joinMatchSpec.name).toBe("joinMatch");

    const provenance = joinMatchSpec.functionProvenance;
    if (provenance._tag !== "Confect") {
      throw new Error("Expected Confect function spec");
    }

    const isArgsValid = Schema.is(provenance.args);

    expect(
      isArgsValid({ matchId: "m-1", playerName: "Sam", playerColorId: "lime", sessionId: "s-1" }),
    ).toBe(true);
    expect(isArgsValid({ matchId: "m-1", playerName: "Sam", sessionId: "s-1" })).toBe(true);
    expect(isArgsValid({ matchId: "m-1", playerName: "Sam" })).toBe(false);
    expect(isArgsValid({ playerName: "Sam", sessionId: "s-1" })).toBe(false);
    expect(isArgsValid({ matchId: "m-1", sessionId: "s-1" })).toBe(false);
  });

  it("validates getMatchByCode query contract shapes", () => {
    const getMatchByCodeSpec = matchesSpec.functions.getMatchByCode;
    expect(getMatchByCodeSpec.name).toBe("getMatchByCode");

    const provenance = getMatchByCodeSpec.functionProvenance;
    if (provenance._tag !== "Confect") {
      throw new Error("Expected Confect function spec");
    }

    expect(Schema.is(provenance.args)({ lobbyCode: "ABCD" })).toBe(true);
    expect(Schema.is(provenance.args)({})).toBe(false);

    const isReturnsValid = Schema.is(provenance.returns);

    expect(isReturnsValid(null)).toBe(true);
    expect(
      isReturnsValid({
        matchId: "m-1",
        lobbyCode: "ABCD",
        status: "setup",
        usedColorIds: ["cyan", "rose"],
      }),
    ).toBe(true);
    expect(
      isReturnsValid({
        matchId: "m-1",
        lobbyCode: "ABCD",
        status: "invalid_status",
        usedColorIds: [],
      }),
    ).toBe(false);
  });
});
