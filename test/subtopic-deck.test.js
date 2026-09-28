import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateDeck } from "../src/deck-schema.js";
import { assembleSubtopicDeck, isSubtopicFragmentManifest } from "../src/subtopic-deck.js";

const manifest = JSON.parse(await readFile(new URL("../data/vibe-coding.json", import.meta.url), "utf8"));
const fragments = await Promise.all(manifest.fragments.map(async (path) =>
  JSON.parse(await readFile(new URL(`../data/${path}`, import.meta.url), "utf8"))));

test("one parent manifest includes five internal files but is one catalog topic", async () => {
  const catalog = JSON.parse(await readFile(new URL("../data/decks.json", import.meta.url), "utf8"));
  assert.deepEqual(catalog.decks.filter((id) => id.startsWith("vibe-coding")), ["vibe-coding"]);
  assert.equal(isSubtopicFragmentManifest(manifest), true);
  assert.equal(manifest.id, "vibe-coding");
  assert.equal(manifest.fragments.length, 5);
  assert.equal(manifest.fragments.every((path) => path.startsWith("vibe-coding/")), true);
});

test("the parent has 500 consecutive cards and all 25 subtopics in teaching order", () => {
  const deck = assembleSubtopicDeck(manifest, fragments);
  assert.equal(deck.cards.length, 500);
  assert.equal(deck.paths.length, 25);
  assert.deepEqual(deck.cards.map((card) => card.sequence), Array.from({ length: 500 }, (_, i) => i + 1));
  assert.deepEqual(validateDeck(deck, { rejectBuiltInId: false }), []);
  assert.ok(deck.paths.every((path) => path.cardIds.length <= 100));
  assert.deepEqual([...new Set(deck.cards.map((card) => card.id))].sort(),
    Array.from({ length: 500 }, (_, i) => `vc-${String(i + 1).padStart(3, "0")}`).sort());
});

test("the assembler has no global card ceiling: an extra correctly linked card is valid", () => {
  const groups = structuredClone(fragments);
  const newId = "additional-fundamentals-example";
  const sourceCard = groups[0].cards[0];
  groups[0].cards.push({
    ...sourceCard, id: newId, sequence: 101,
    title: "Another unique example",
    prompt: "Why does this extra example support the foundation?",
    content: "A newly authored learning objective can extend a subtopic without changing the parent-card ceiling.",
  });
  groups[0].paths[0].cardIds.push(newId);
  const result = assembleSubtopicDeck(manifest, groups);
  assert.equal(result.cards.length, 501);
  assert.equal(result.paths[0].cardIds.length, 21);
  assert.deepEqual(validateDeck(result, { rejectBuiltInId: false }), []);
});

test("missing shards, duplicate cards, wrong categories, and traversal paths fail closed", () => {
  assert.throws(() => assembleSubtopicDeck(manifest, fragments.slice(0, 4)), /count does not match/);
  const wrongCategory = structuredClone(fragments);
  wrongCategory[1].category = "Unrelated category";
  assert.throws(() => assembleSubtopicDeck(manifest, wrongCategory), /Invalid subtopic source or category/);
  const duplicate = structuredClone(fragments);
  duplicate[1].cards[0].id = duplicate[0].cards[0].id;
  duplicate[1].paths[0].cardIds[0] = duplicate[0].cards[0].id;
  assert.throws(() => assembleSubtopicDeck(manifest, duplicate), /Duplicate card ID across subtopics/);
  assert.equal(isSubtopicFragmentManifest({
    ...manifest, fragments: ["../secret.json"],
  }), false);
});
