import assert from "node:assert/strict";
import test from "node:test";
import {
  migrateVibeCurriculumState,
  VIBE_CURRICULUM_IDS,
  VIBE_CURRICULUM_MIGRATION_VERSION,
} from "../src/vibe-progress.js";

function representativeDecks() {
  return VIBE_CURRICULUM_IDS.map((id, index) => ({
    id,
    cards: [
      { id: ["vc-001", "vc-101", "vc-141", "vc-241", "vc-361"][index] },
      { id: ["vc-100", "vc-460", "vc-240", "vc-360", "vc-500"][index] },
    ],
    paths: [{ id: ["mindset-foundations", "agents-tools-mcp", "frontend-ux", "debugging", "observability"][index] }],
  }));
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
