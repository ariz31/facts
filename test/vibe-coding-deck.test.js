import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { validateDeck } from "../src/deck-schema.js";
import { assembleLessonDeck, isLessonFragmentManifest } from "../src/lesson-deck.js";

const dataDirectory = new URL("../data/", import.meta.url);

async function loadVibeCodingDeck() {
  const manifest = JSON.parse(await readFile(join(dataDirectory.pathname, "vibe-coding.json"), "utf8"));
  assert.equal(isLessonFragmentManifest(manifest), true);
  const fragments = await Promise.all(manifest.fragments.map(async (fragment) => (
    JSON.parse(await readFile(join(dataDirectory.pathname, fragment), "utf8"))
  )));
  return { manifest, deck: assembleLessonDeck(manifest, fragments) };
}

test("vibe coding assembles the maximum-size comprehensive curriculum", async () => {
  const { manifest, deck } = await loadVibeCodingDeck();

  assert.equal(manifest.fragments.length, 15);
  assert.equal(deck.id, "vibe-coding");
  assert.equal(deck.cards.length, 500);
  assert.equal(deck.paths.length, 25);
  assert.deepEqual(validateDeck(deck, { rejectBuiltInId: false }), []);

  assert.equal(deck.cards[0].id, "vc-001");
  assert.equal(deck.cards.at(-1).id, "vc-500");
  assert.deepEqual(new Set(deck.cards.map((card) => card.type)), new Set(["concept", "fact", "question", "code", "steps", "checklist"]));
  assert.deepEqual(new Set(deck.cards.map((card) => card.difficulty)), new Set(["beginner", "intermediate", "advanced"]));

  for (const path of deck.paths) {
    assert.equal(path.cardIds.length, 20, `${path.id} should contain 20 cards`);
  }
});

test("vibe coding covers the required engineering disciplines", async () => {
  const { deck } = await loadVibeCodingDeck();
  const requiredPaths = [
    "mindset-foundations",
    "product-problem-framing",
    "specs-acceptance",
    "prompting",
    "context-engineering",
    "planning-decomposition",
    "architecture",
    "frontend-ux",
    "backend-api",
    "database-data",
    "security-privacy",
    "testing",
    "debugging",
    "git-pr",
    "code-review",
    "dependencies",
    "performance",
    "accessibility-i18n",
    "dev-environments",
    "cicd-deployment",
    "observability",
    "agents-tools-mcp",
    "failure-modes",
    "legacy-refactoring",
    "production-readiness",
  ];

  assert.deepEqual(deck.paths.map((path) => path.id), requiredPaths);

  const searchable = deck.cards.map((card) => `${card.title} ${card.prompt} ${card.content}`).join(" ").toLowerCase();
  for (const term of ["acceptance criteria", "authorization", "accessibility", "mcp", "hallucinated", "rollback", "observability", "production-readiness"]) {
    assert.ok(searchable.includes(term.replace("production-readiness", "production")), `expected curriculum coverage for ${term}`);
  }
});
