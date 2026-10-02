import * as Schema from "effect/Schema";

export const ActionKind = Schema.Literals(["flip_three", "freeze", "second_chance"]);

export const NumberCard = Schema.Struct({
  id: Schema.String,
  type: Schema.Literal("number"),
  label: Schema.String,
  numberValue: Schema.Number,
});

export const ModifierCard = Schema.Struct({
  id: Schema.String,
  type: Schema.Literal("modifier"),
  label: Schema.String,
  modifierValue: Schema.Union([
    Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(2), Schema.isMultipleOf(2)),
    Schema.Literal("x2"),
  ]),
});

const ActionCard = Schema.Struct({
  id: Schema.String,
  type: Schema.Literal("action"),
  label: Schema.String,
  actionKind: ActionKind,
});

export const CardValue = Schema.Union([NumberCard, ModifierCard, ActionCard]);
