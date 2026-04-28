import { Schema } from "effect";

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
    Schema.Literal(2),
    Schema.Literal(4),
    Schema.Literal(6),
    Schema.Literal(8),
    Schema.Literal(10),
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
