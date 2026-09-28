import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BUILT_IN_DECK_IDS, validateDeck } from "../src/deck-schema.js";
import { assembleLessonDeck, isLessonFragmentManifest } from "../src/lesson-deck.js";

const dataRoot = new URL("../data/", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("ai-software-fundamentals.json", dataRoot), "utf8"));
const fragments = await Promise.all(
  manifest.fragments.map(async (path) => JSON.parse(await readFile(new URL(path, dataRoot), "utf8"))),
);
const deck = assembleLessonDeck(manifest, fragments);

test("AI software fundamentals is a registered, complete 12-path deck", async () => {
  const catalog = JSON.parse(await readFile(new URL("decks.json", dataRoot), "utf8"));
  assert.ok(isLessonFragmentManifest(manifest));
  assert.ok(BUILT_IN_DECK_IDS.includes(manifest.id));
  assert.ok(catalog.decks.includes(manifest.id));
  assert.equal(manifest.lessonStyle, "technical");
  assert.equal(manifest.fragments.length, 12);
  assert.equal(deck.paths.length, 12);
  assert.equal(deck.cards.length, 240);
  assert.deepEqual(validateDeck(deck, { rejectBuiltInId: false }), []);
});

test("each guided path supplies 20 substantive lessons and varied card types", () => {
  const expected = { concept: 8, fact: 3, question: 3, code: 2, steps: 2, checklist: 2 };
  const titles = new Set();

  deck.paths.forEach((path, pathIndex) => {
    const cards = path.cardIds.map((id) => deck.cards.find((card) => card.id === id));
    assert.equal(cards.length, 20, path.id);
    assert.ok(cards.every(Boolean), path.id);
    const tally = Object.fromEntries(Object.keys(expected).map((type) => [
      type, cards.filter((card) => card.type === type).length,
    ]));
    assert.deepEqual(tally, expected, path.id);
    assert.deepEqual(cards.map((card) => card.sequence), Array.from({ length: 20 }, (_, i) => pathIndex * 20 + i + 1));
    cards.forEach((card) => {
      assert.ok(card.prompt.trim().length >= 35, card.id);
      if (card.type !== "question") assert.ok(card.content.trim().length >= 70, card.id);
      if (card.type === "code") assert.ok(card.code.snippet.trim().length >= 30, card.id);
      if (card.type === "question") assert.equal(card.question.options.length, 4, card.id);
      assert.ok(!titles.has(card.title), `Repeated lesson title: ${card.title}`);
      titles.add(card.title);
    });
  });
});

test("the capstone teaches observable acceptance, honest AI review, and release", () => {
  const capstone = deck.paths.at(-1);
  assert.equal(capstone.id, "delivery-and-capstone");
  const titles = capstone.cardIds.map((id) => deck.cards.find((card) => card.id === id).title);
  assert.ok(titles.includes("Capstone scope: task tracker"));
  assert.ok(titles.includes("Capstone build in slices"));
  assert.ok(titles.includes("Capstone acceptance and review"));
  assert.ok(titles.includes("Operations and continued learning"));
});
