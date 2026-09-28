import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { assembleSubtopicDeck } from "../src/subtopic-deck.js";
import {
  migrateVibeCurriculumState,
  VIBE_MAIN_TOPIC_ID,
  LEGACY_SPLIT_TOPIC_IDS,
  VIBE_CURRICULUM_MIGRATION_VERSION,
} from "../src/vibe-progress.js";

const manifest = JSON.parse(await readFile(new URL("../data/vibe-coding.json", import.meta.url), "utf8"));
const shards = await Promise.all(manifest.fragments.map(async (file) =>
  JSON.parse(await readFile(new URL(`../data/${file}`, import.meta.url), "utf8"))));
const parent = assembleSubtopicDeck(manifest, shards);

test("the migration consolidates existing split-release progress without discarding backups", () => {
  const state = {
    activeDeckId: "vibe-coding-agentic", activePathId: "agents-tools-mcp",
    vibeCurriculumMigrationVersion: 1,
    progress: {
      "vibe-coding": { "vc-001": "review", "vc-101": "review", "vc-500": "mastered" },
      "vibe-coding-agentic": { "vc-101": "mastered", "vc-425": "review", "vc-999": "mastered" },
      "vibe-coding-application": { "vc-141": "review" },
      "vibe-coding-quality": { "vc-241": "mastered" },
      "vibe-coding-production": { "vc-500": "review" },
    },
  };
  const backups = Object.fromEntries(LEGACY_SPLIT_TOPIC_IDS.map((id) => [id, structuredClone(state.progress[id])]));
  assert.equal(migrateVibeCurriculumState(state, [parent]), true);
  assert.equal(state.vibeCurriculumMigrationVersion, VIBE_CURRICULUM_MIGRATION_VERSION);
  assert.equal(state.activeDeckId, VIBE_MAIN_TOPIC_ID);
  assert.equal(state.activePathId, "agents-tools-mcp");
  assert.equal(state.progress["vibe-coding"]["vc-001"], "review");
  assert.equal(state.progress["vibe-coding"]["vc-101"], "mastered", "newer split progress supersedes stale historical copy");
  assert.equal(state.progress["vibe-coding"]["vc-425"], "review");
  assert.equal(state.progress["vibe-coding"]["vc-141"], "review");
  assert.equal(state.progress["vibe-coding"]["vc-241"], "mastered");
  assert.equal(state.progress["vibe-coding"]["vc-500"], "review");
  assert.equal(state.progress["vibe-coding"]["vc-999"], undefined);
  for (const id of LEGACY_SPLIT_TOPIC_IDS) assert.deepEqual(state.progress[id], backups[id]);
});

test("the parent preserves the historical pre-split 500-card progress even when no split entry exists", () => {
  const original = Object.fromEntries(parent.cards.map((card, i) => [card.id, i % 2 ? "review" : "mastered"]));
  const state = {
    activeDeckId: "vibe-coding", activePathId: "security-privacy",
    vibeCurriculumMigrationVersion: 0, progress: { "vibe-coding": structuredClone(original) },
  };
  assert.equal(migrateVibeCurriculumState(state, [parent]), true);
  assert.deepEqual(state.progress["vibe-coding"], original);
  assert.equal(state.activePathId, "security-privacy");
  assert.equal(state.vibeCurriculumMigrationVersion, 2);
});

test("partial, duplicate, or incomplete parent data never finalizes or mutates progress", () => {
  for (const candidate of [
    [],
    [{ ...parent, cards: parent.cards.slice(0, 499) }],
    [{ ...parent, cards: [...parent.cards.slice(0, -1), { ...parent.cards[0] }] }],
  ]) {
    const state = {
      activeDeckId: "vibe-coding-quality", activePathId: "debugging",
      vibeCurriculumMigrationVersion: 1,
      progress: { "vibe-coding-quality": { "vc-241": "mastered" } },
    };
    const before = structuredClone(state);
    assert.equal(migrateVibeCurriculumState(state, candidate), false);
    assert.deepEqual(state, before);
  }
});

test("version 2 is idempotent and can migrate a future parent with more than 500 total cards", () => {
  const expandedParent = { ...parent, cards: [...parent.cards,
    { ...parent.cards[0], id: "vc-501", sequence: 501 }] };
  const state = {
    activeDeckId: "vibe-coding-production", activePathId: "production-readiness",
    vibeCurriculumMigrationVersion: 1,
    progress: { "vibe-coding-production": { "vc-500": "mastered" } },
  };
  assert.equal(migrateVibeCurriculumState(state, [expandedParent]), true);
  assert.equal(state.progress["vibe-coding"]["vc-500"], "mastered");
  assert.equal(state.activeDeckId, "vibe-coding");
  delete state.progress["vibe-coding"]["vc-500"];
  assert.equal(migrateVibeCurriculumState(state, [expandedParent]), false);
  assert.equal(state.progress["vibe-coding"]["vc-500"], undefined, "old state cannot reappear after a user clears it");
});
