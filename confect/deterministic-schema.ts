import { Schema } from "effect";

const ActionKind = Schema.Literal("flip_three", "freeze", "second_chance");

const NumberCard = Schema.Struct({
  id: Schema.String,
  type: Schema.Literal("number"),
  label: Schema.String,
  numberValue: Schema.Number,
});

const ModifierCard = Schema.Struct({
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

export const DeterministicStartOptions = Schema.Struct({
  roundSeed: Schema.Struct({
    drawPile: Schema.Array(CardValue),
  }),
});
