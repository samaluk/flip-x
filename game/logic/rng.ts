export type RngService = {
  shuffle<T>(items: readonly T[]): T[];
};

export function shuffleWithRandom<T>(items: readonly T[], random: () => number): T[] {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = next[index];
    next[index] = next[swapIndex];
    next[swapIndex] = current;
  }

  return next;
}

export function createProductionRng(random: () => number = Math.random): RngService {
  return {
    shuffle: (items) => shuffleWithRandom(items, random),
  };
}

export const productionRng = createProductionRng();

export const fixedRng: RngService = {
  shuffle: (items) => [...items],
};
