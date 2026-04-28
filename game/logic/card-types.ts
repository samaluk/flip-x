import { productionRng, type RngService } from "./rng";

export type NumberCard = {
  id: string;
  type: "number";
  label: string;
  numberValue: number;
};

export type ModifierValue = 2 | 4 | 6 | 8 | 10 | "x2";

export type ModifierCard = {
  id: string;
  type: "modifier";
  label: string;
  modifierValue: ModifierValue;
};

export type ActionKind = "flip_three" | "freeze" | "second_chance";

export type ActionCard = {
  id: string;
  type: "action";
  label: string;
  actionKind: ActionKind;
};

export type Card = NumberCard | ModifierCard | ActionCard;

const MODIFIER_LABELS: ModifierValue[] = [2, 4, 6, 8, 10, "x2"];

export function buildOrderedDeck() {
  const cards: Card[] = [];

  let sequence = 0;

  const addCard = (
    card: Omit<NumberCard, "id"> | Omit<ModifierCard, "id"> | Omit<ActionCard, "id">,
  ) => {
    cards.push({
      ...card,
      id: `${card.type}-${sequence}`,
    });
    sequence += 1;
  };

  addCard({ type: "number", label: "0", numberValue: 0 });

  for (let numberValue = 1; numberValue <= 12; numberValue += 1) {
    for (let count = 0; count < numberValue; count += 1) {
      addCard({
        type: "number",
        label: String(numberValue),
        numberValue,
      });
    }
  }

  for (const actionKind of ["flip_three", "freeze", "second_chance"] as const) {
    for (let count = 0; count < 3; count += 1) {
      addCard({
        type: "action",
        label: actionKind,
        actionKind,
      });
    }
  }

  for (const modifierValue of MODIFIER_LABELS) {
    addCard({
      type: "modifier",
      label: modifierValue === "x2" ? "x2" : `+${modifierValue}`,
      modifierValue,
    });
  }

  return cards;
}

function shuffleDeck(cards: readonly Card[], rng: RngService = productionRng) {
  return rng.shuffle(cards);
}

export function createDeck(rng?: RngService) {
  return shuffleDeck(buildOrderedDeck(), rng);
}

export function isNumberCard(card: Card): card is NumberCard {
  return card.type === "number";
}

export function isModifierCard(card: Card): card is ModifierCard {
  return card.type === "modifier";
}

export function countDeckCards() {
  return buildOrderedDeck().length;
}
