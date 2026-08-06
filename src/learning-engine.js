export const CARD_TYPES = ["concept", "fact", "question", "code", "steps", "checklist"];

export function sortCards(cards = []) {
  if (!Array.isArray(cards)) return [];
  return [...cards].sort((a, b) => numericSequence(a) - numericSequence(b) || String(a?.id ?? "").localeCompare(String(b?.id ?? "")));
}

export function shuffleCards(cards = [], random = Math.random) {
  const shuffled = Array.isArray(cards) ? [...cards] : [];
  const source = typeof random === "function" ? random : Math.random;
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const sample = Number(source());
    const bounded = Number.isFinite(sample) ? Math.min(0.9999999999999999, Math.max(0, sample)) : 0;
    const swapIndex = Math.floor(bounded * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function buildStudyOrder(cards, mode = "sequential", random = Math.random) {
  const ordered = sortCards(cards);
  return mode === "random" ? shuffleCards(ordered, random) : ordered;
}

export function filterCards(cards = [], { pathId = "all", type = "all", query = "" } = {}) {
  if (!Array.isArray(cards)) return [];
  const normalizedQuery = String(query ?? "").trim().toLowerCase();
  return cards.filter((card) => {
    if (!card || typeof card !== "object") return false;
    const matchesPath = pathId === "all" || card.pathIds?.includes(pathId);
    const matchesType = type === "all" || card.type === type;
    const searchableText = [
      card.title,
      card.prompt,
      card.content,
      ...(Array.isArray(card.tags) ? card.tags : []),
      ...(Array.isArray(card.steps) ? card.steps : []),
      ...(Array.isArray(card.items) ? card.items : []),
      ...(Array.isArray(card.question?.options) ? card.question.options : []),
    ].filter(Boolean).join(" ").toLowerCase();
    return matchesPath && matchesType && (!normalizedQuery || searchableText.includes(normalizedQuery));
  });
}

export function nextIndex(currentIndex, length) {
  const size = positiveInteger(length);
  if (!size) return 0;
  const index = normalizeIndex(currentIndex, size);
  return (index + 1) % size;
}

export function previousIndex(currentIndex, length) {
  const size = positiveInteger(length);
  if (!size) return 0;
  const index = normalizeIndex(currentIndex, size);
  return (index - 1 + size) % size;
}

export function calculateProgress(cards = [], progressById = {}) {
  if (!Array.isArray(cards) || !cards.length) return { mastered: 0, review: 0, untouched: 0, percent: 0 };
  const progress = progressById && typeof progressById === "object" ? progressById : {};
  let mastered = 0;
  let review = 0;
  for (const card of cards) {
    if (progress[card?.id] === "mastered") mastered += 1;
    if (progress[card?.id] === "review") review += 1;
  }
  return {
    mastered,
    review,
    untouched: Math.max(0, cards.length - mastered - review),
    percent: Math.round((mastered / cards.length) * 100),
  };
}

function numericSequence(card) {
  const sequence = Number(card?.sequence);
  return Number.isFinite(sequence) ? sequence : Number.MAX_SAFE_INTEGER;
}

function positiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function normalizeIndex(value, length) {
  const number = Number(value);
  if (!Number.isInteger(number)) return 0;
  return ((number % length) + length) % length;
}
