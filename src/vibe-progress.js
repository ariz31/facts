// One-time, non-destructive migration of card progress from the historical
// 500-card Vibe Coding deck into five independently selectable 100-card topics.
// All original vc-001 ... vc-500 identifiers remain stable in the new data.
export const VIBE_CURRICULUM_IDS = Object.freeze([
  "vibe-coding",
  "vibe-coding-agentic",
  "vibe-coding-application",
  "vibe-coding-quality",
  "vibe-coding-production",
]);
export const VIBE_CURRICULUM_MIGRATION_VERSION = 1;
const VALID_STATUSES = new Set(["review", "mastered"]);

export function migrateVibeCurriculumState(state, availableDecks) {
  if (!state || state.vibeCurriculumMigrationVersion >= VIBE_CURRICULUM_MIGRATION_VERSION) return false;
  if (!Array.isArray(availableDecks) || !VIBE_CURRICULUM_IDS.every((id) => availableDecks.some((deck) => deck?.id === id))) {
    return false; // Wait for all five decks; never silently lose statuses when an offline fetch failed.
  }

  // Do not mark migration complete against partial, mixed-version, or corrupt caches.
  // Validate all 500 historical IDs BEFORE modifying any stored progress.
  const cardOwners = new Map();
  for (const deckId of VIBE_CURRICULUM_IDS) {
    const deck = availableDecks.find((candidate) => candidate?.id === deckId);
    if (!Array.isArray(deck?.cards) || deck.cards.length !== 100) return false;
    for (const card of deck.cards) {
      if (typeof card?.id !== "string" || cardOwners.has(card.id)) return false;
      cardOwners.set(card.id, deck.id);
    }
  }
  if (cardOwners.size !== 500) return false;
  for (let index = 1; index <= 500; index += 1) {
    if (!cardOwners.has(`vc-${String(index).padStart(3, "0")}`)) return false;
  }

  const progress = state.progress && typeof state.progress === "object" && !Array.isArray(state.progress)
    ? state.progress : (state.progress = {});
  const historicalStatuses = progress["vibe-coding"];

  if (historicalStatuses && typeof historicalStatuses === "object" && !Array.isArray(historicalStatuses)) {
    for (const [cardId, status] of Object.entries(historicalStatuses)) {
      const newDeckId = cardOwners.get(cardId);
      if (!newDeckId || newDeckId === "vibe-coding" || !VALID_STATUSES.has(status)) continue;
      const target = progress[newDeckId] && typeof progress[newDeckId] === "object" && !Array.isArray(progress[newDeckId])
        ? progress[newDeckId] : (progress[newDeckId] = {});
      if (!Object.hasOwn(target, cardId)) target[cardId] = status;
    }
    // Keep the historical source untouched for recovery; the new first topic
    // naturally reads its unchanged original vc-001 ... vc-100 statuses.
  }

  if (state.activeDeckId === "vibe-coding" && state.activePathId !== "all") {
    const destination = availableDecks.find((deck) =>
      VIBE_CURRICULUM_IDS.includes(deck.id) && deck.paths?.some((path) => path.id === state.activePathId));
    if (destination) state.activeDeckId = destination.id;
  }

  state.vibeCurriculumMigrationVersion = VIBE_CURRICULUM_MIGRATION_VERSION;
  return true;
}
