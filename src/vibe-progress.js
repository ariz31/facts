// Recombine progress created by PR #13's temporary five-top-level-topic layout.
// The corrected curriculum exposes ONE main topic; every card keeps its original
// vc-001..vc-500 ID. Existing progress records are retained for recovery.
export const VIBE_MAIN_TOPIC_ID = "vibe-coding";
export const LEGACY_SPLIT_TOPIC_IDS = Object.freeze([
  "vibe-coding-agentic",
  "vibe-coding-application",
  "vibe-coding-quality",
  "vibe-coding-production",
]);
export const VIBE_CURRICULUM_MIGRATION_VERSION = 2;
const VALID_STATUSES = new Set(["review", "mastered"]);

export function migrateVibeCurriculumState(state, availableDecks) {
  if (!state || state.vibeCurriculumMigrationVersion >= VIBE_CURRICULUM_MIGRATION_VERSION) return false;
  const main = Array.isArray(availableDecks)
    ? availableDecks.find((deck) => deck?.id === VIBE_MAIN_TOPIC_ID) : null;
  if (!main || !Array.isArray(main.cards) || !Array.isArray(main.paths)) return false;

  // Verify completeness before writing anything. This is a migration safety
  // requirement for the 500 EXISTING cards, not a ceiling on future parent size.
  const cardIds = new Set();
  for (const card of main.cards) {
    if (typeof card?.id !== "string" || cardIds.has(card.id)) return false;
    cardIds.add(card.id);
  }
  for (let number = 1; number <= 500; number += 1) {
    if (!cardIds.has(`vc-${String(number).padStart(3, "0")}`)) return false;
  }

  const progress = state.progress && typeof state.progress === "object" && !Array.isArray(state.progress)
    ? state.progress : (state.progress = {});
  const destination = progress[VIBE_MAIN_TOPIC_ID] && typeof progress[VIBE_MAIN_TOPIC_ID] === "object"
    && !Array.isArray(progress[VIBE_MAIN_TOPIC_ID])
    ? progress[VIBE_MAIN_TOPIC_ID] : (progress[VIBE_MAIN_TOPIC_ID] = {});

  // During the split release, cards 101..500 could only be studied in one of
  // these temporary top-level topics. Their statuses are newer than any
  // historical copies in the parent; transfer them without deleting sources.
  for (const legacyId of LEGACY_SPLIT_TOPIC_IDS) {
    const source = progress[legacyId];
    if (!source || typeof source !== "object" || Array.isArray(source)) continue;
    for (const [cardId, status] of Object.entries(source)) {
      if (cardIds.has(cardId) && VALID_STATUSES.has(status)) destination[cardId] = status;
    }
  }

  if (LEGACY_SPLIT_TOPIC_IDS.includes(state.activeDeckId)) {
    state.activeDeckId = VIBE_MAIN_TOPIC_ID;
    if (state.activePathId !== "all" && !main.paths.some((path) => path.id === state.activePathId)) {
      state.activePathId = "all";
    }
  }

  state.vibeCurriculumMigrationVersion = VIBE_CURRICULUM_MIGRATION_VERSION;
  return true;
}
