import * as Schema from "effect/Schema";

export const ActionKind = Schema.Literal("flip_three", "freeze", "second_chance");

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
  modifierValue: Schema.Union(
    Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(2), Schema.multipleOf(2)),
    Schema.Literal("x2"),
  ),
});

const ActionCard = Schema.Struct({
  id: Schema.String,
  type: Schema.Literal("action"),
  label: Schema.String,
  actionKind: ActionKind,
});

export const CardValue = Schema.Union(NumberCard, ModifierCard, ActionCard);
