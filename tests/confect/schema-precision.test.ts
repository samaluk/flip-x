import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { CardValue } from "@/confect/card-value-schema";

describe("Confect schema precision", () => {
  it("decodes valid card variants", async () => {
    await expect(
      Schema.decodeUnknownPromise(CardValue)({
        id: "n7",
        type: "number",
        label: "7",
        numberValue: 7,
      }),
    ).resolves.toMatchObject({ type: "number", numberValue: 7 });

    await expect(
      Schema.decodeUnknownPromise(CardValue)({
        id: "m2",
        type: "modifier",
        label: "+2",
        modifierValue: 2,
      }),
    ).resolves.toMatchObject({ type: "modifier", modifierValue: 2 });

    await expect(
      Schema.decodeUnknownPromise(CardValue)({
        id: "a1",
        type: "action",
        label: "freeze",
        actionKind: "freeze",
      }),
    ).resolves.toMatchObject({ type: "action", actionKind: "freeze" });
  });

  it("rejects invalid card shapes", async () => {
    await expect(
      Schema.decodeUnknownPromise(CardValue)({
        id: "bad",
        type: "number",
        label: "7",
        modifierValue: 2,
      }),
    ).rejects.toThrow();

    await expect(
      Schema.decodeUnknownPromise(CardValue)({
        id: "bad-modifier",
        type: "modifier",
        label: "+3",
        modifierValue: 3,
      }),
    ).rejects.toThrow();
  });
});
