export const CARD_TYPES = ["concept", "fact", "question", "code", "steps", "checklist"];

export function sortCards(cards) {
  return [...cards].sort((a, b) => a.sequence - b.sequence || a.id.localeCompare(b.id));
}

export function shuffleCards(cards, random = Math.random) {
  const shuffled = [...cards];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function buildStudyOrder(cards, mode = "sequential", random = Math.random) {
  const ordered = sortCards(cards);
  return mode === "random" ? shuffleCards(ordered, random) : ordered;
}

export function filterCards(cards, { pathId = "all", type = "all", query = "" } = {}) {
  const normalizedQuery = query.trim().toLowerCase();

  return cards.filter((card) => {
    const matchesPath = pathId === "all" || card.pathIds?.includes(pathId);
    const matchesType = type === "all" || card.type === type;
    const searchableText = [
      card.title,
      card.prompt,
      card.content,
      ...(card.tags ?? []),
      ...(card.steps ?? []),
      ...(card.items ?? []),
      ...(card.question?.options ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);

    return matchesPath && matchesType && matchesQuery;
  });
}

export function nextIndex(currentIndex, length) {
  if (length <= 0) return 0;
  return (currentIndex + 1) % length;
}

export function previousIndex(currentIndex, length) {
  if (length <= 0) return 0;
  return (currentIndex - 1 + length) % length;
}

export function calculateProgress(cards, progressById) {
  if (!cards.length) return { mastered: 0, review: 0, untouched: 0, percent: 0 };

  let mastered = 0;
  let review = 0;
  for (const card of cards) {
    if (progressById[card.id] === "mastered") mastered += 1;
    if (progressById[card.id] === "review") review += 1;
  }

  return {
    mastered,
    review,
    untouched: cards.length - mastered - review,
    percent: Math.round((mastered / cards.length) * 100),
  };
}
