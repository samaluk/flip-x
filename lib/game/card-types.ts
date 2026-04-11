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

export const ACTION_LABELS: Record<ActionKind, string> = {
  flip_three: "Flip Three",
  freeze: "Freeze",
  second_chance: "Second Chance",
};

export const MODIFIER_LABELS: ModifierValue[] = [2, 4, 6, 8, 10, "x2"];

function shuffle<T>(items: T[]): T[] {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[swapIndex];
    next[swapIndex] = current;
  }

  return next;
}

export function createDeck() {
  const cards: Card[] = [];

  let sequence = 0;

  const addCard = (
    card: Omit<NumberCard, "id"> | Omit<ModifierCard, "id"> | Omit<ActionCard, "id">,
  ) => {
    cards.push({
      ...card,
      id: `${card.type}-${sequence}`,
    } as Card);
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
        label: ACTION_LABELS[actionKind],
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

  return shuffle(cards);
}

export function isNumberCard(card: Card): card is NumberCard {
  return card.type === "number";
}

export function isModifierCard(card: Card): card is ModifierCard {
  return card.type === "modifier";
}

export function isActionCard(card: Card): card is ActionCard {
  return card.type === "action";
}

export function countDeckCards() {
  return createDeck().length;
}
