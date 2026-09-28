import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  migrateVibeCurriculumState,
  VIBE_CURRICULUM_IDS,
  VIBE_CURRICULUM_MIGRATION_VERSION,
} from "../src/vibe-progress.js";

const ACTUAL_DECKS = await Promise.all(VIBE_CURRICULUM_IDS.map(async (id) => (
  JSON.parse(await readFile(new URL(`../data/${id}.json`, import.meta.url), "utf8"))
)));
function representativeDecks() {
  return ACTUAL_DECKS;
}

test("migration copies prior statuses to their stable card IDs across all five topics", () => {
  const state = {
    activeDeckId: "vibe-coding", activePathId: "observability", vibeCurriculumMigrationVersion: 0,
    progress: {
      "vibe-coding": {
        "vc-001": "mastered", "vc-101": "review", "vc-141": "mastered",
        "vc-241": "review", "vc-361": "mastered", "vc-500": "review", "vc-999": "mastered",
      },
      "vibe-coding-agentic": { "vc-101": "mastered" },
    },
  };
  const before = structuredClone(state.progress["vibe-coding"]);
  assert.equal(migrateVibeCurriculumState(state, representativeDecks()), true);
  assert.equal(state.vibeCurriculumMigrationVersion, VIBE_CURRICULUM_MIGRATION_VERSION);
  assert.equal(state.activeDeckId, "vibe-coding-production");
  assert.equal(state.activePathId, "observability");
  assert.deepEqual(state.progress["vibe-coding"], before, "the historical progress is never deleted");
  assert.equal(state.progress["vibe-coding-agentic"]["vc-101"], "mastered", "existing destination progress wins");
  assert.equal(state.progress["vibe-coding-application"]["vc-141"], "mastered");
  assert.equal(state.progress["vibe-coding-quality"]["vc-241"], "review");
  assert.equal(state.progress["vibe-coding-production"]["vc-361"], "mastered");
  assert.equal(state.progress["vibe-coding-production"]["vc-500"], "review");
  assert.equal(state.progress["vibe-coding-production"]["vc-999"], undefined, "unknown IDs are not invented");
  assert.equal(migrateVibeCurriculumState(state, representativeDecks()), false, "one-time migration stays idempotent");
});

test("partial offline catalog cannot mark the migration complete", () => {
  const state = {
    activeDeckId: "vibe-coding", activePathId: "all", vibeCurriculumMigrationVersion: 0,
    progress: { "vibe-coding": { "vc-500": "review" } },
  };
  assert.equal(migrateVibeCurriculumState(state, representativeDecks().slice(0, 4)), false);
  assert.equal(state.vibeCurriculumMigrationVersion, 0);
  assert.equal(state.progress["vibe-coding-production"], undefined);
  assert.equal(migrateVibeCurriculumState(state, representativeDecks()), true);
  assert.equal(state.progress["vibe-coding-production"]["vc-500"], "review");
});

test("an old selected path maps to its revised owning topic without changing the card ID", () => {
  const state = {
    activeDeckId: "vibe-coding", activePathId: "agents-tools-mcp", vibeCurriculumMigrationVersion: 0, progress: {},
  };
  assert.equal(migrateVibeCurriculumState(state, representativeDecks()), true);
  assert.equal(state.activeDeckId, "vibe-coding-agentic");
  assert.equal(state.activePathId, "agents-tools-mcp");
});

test("real curriculum migrates mastery for every one of the 500 stable historical IDs", () => {
  const actualDecks = representativeDecks();
  const cardIds = actualDecks.flatMap((deck) => deck.cards.map((card) => card.id));
  assert.equal(new Set(cardIds).size, 500);
  const legacy = Object.fromEntries(cardIds.map((id, i) => [id, i % 2 ? "review" : "mastered"]));
  const state = {
    activeDeckId: "vibe-coding", activePathId: "security-privacy",
    vibeCurriculumMigrationVersion: 0, progress: { "vibe-coding": legacy },
  };
  assert.equal(migrateVibeCurriculumState(state, actualDecks), true);
  assert.equal(state.activeDeckId, "vibe-coding-application");
  for (const deck of actualDecks) {
    for (const card of deck.cards) {
      assert.equal(state.progress[deck.id][card.id], legacy[card.id], `lost progress on ${card.id}`);
    }
  }
  assert.equal(migrateVibeCurriculumState(state, actualDecks), false);
});

test("incomplete or mixed-version topic data cannot silently finalize migration", () => {
  for (const mutate of [
    (decks) => decks[4].cards.pop(),
    (decks) => { decks[4].cards[0].id = "vc-001"; },
  ]) {
    const decks = structuredClone(representativeDecks());
    mutate(decks);
    const state = {
      activeDeckId: "vibe-coding", activePathId: "production-readiness",
      vibeCurriculumMigrationVersion: 0,
      progress: { "vibe-coding": { "vc-500": "review" } },
    };
    const before = structuredClone(state.progress);
    assert.equal(migrateVibeCurriculumState(state, decks), false);
    assert.equal(state.vibeCurriculumMigrationVersion, 0);
    assert.deepEqual(state.progress, before);
  }
});
