import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { validateDeck } from "../src/deck-schema.js";
import {
  expandGuidedContent,
  getGuidedExpansionCount,
  getGuidedPathIds,
  validateGuidedContentSpec,
} from "../src/guided-content-expansion.js";
import { expandDeck, getExpansionCount } from "../src/topic-expansion.js";

const dataDirectory = new URL("../data/", import.meta.url);
const catalog = JSON.parse(await readFile(join(dataDirectory.pathname, "decks.json"), "utf8"));

for (const deckId of catalog.decks) {
  test(`${deckId} guided content is categorized and ordered before reference cards`, async () => {
    const deck = JSON.parse(await readFile(join(dataDirectory.pathname, `${deckId}.json`), "utf8"));
    const spec = JSON.parse(await readFile(join(dataDirectory.pathname, "guided", `${deckId}.json`), "utf8"));

    assert.deepEqual(validateGuidedContentSpec(spec, { expectedDeckId: deckId }), []);
    assert.equal(getGuidedExpansionCount(spec), 12);

    const referenceThenGuided = expandGuidedContent(expandDeck(deck), spec);
    const guidedThenReference = expandDeck(expandGuidedContent(deck, spec));
    const expectedCount = deck.cards.length + 12 + getExpansionCount(deckId);

    assert.equal(referenceThenGuided.cards.length, expectedCount);
    assert.equal(referenceThenGuided.paths.at(-1).id, "reference-library");
    assert.deepEqual(validateDeck(referenceThenGuided, { rejectBuiltInId: false }), []);

    assert.deepEqual(
      referenceThenGuided.paths.map((path) => path.id),
      guidedThenReference.paths.map((path) => path.id),
      "path ordering should be independent of expansion order",
    );
    assert.deepEqual(
      referenceThenGuided.cards.map(({ id, sequence }) => [id, sequence]),
      guidedThenReference.cards.map(({ id, sequence }) => [id, sequence]),
      "card ordering should be independent of expansion order",
    );

    const pathIds = referenceThenGuided.paths.map((path) => path.id);
    const guidedPathIds = getGuidedPathIds(spec);
    assert.deepEqual(pathIds.slice(-4, -1), guidedPathIds);

    const orderedCards = [...referenceThenGuided.cards].sort((a, b) => a.sequence - b.sequence);
    assert.deepEqual(orderedCards.map((card) => card.sequence), orderedCards.map((_, index) => index + 1));
    assert.equal(orderedCards[deck.cards.length].id, `${spec.prefix}001`);
    assert.equal(orderedCards[deck.cards.length + 12].pathIds[0], "reference-library");

    for (const [pathIndex, pathId] of guidedPathIds.entries()) {
      const path = referenceThenGuided.paths.find((candidate) => candidate.id === pathId);
      assert.ok(path);
      assert.equal(path.cardIds.length, 4);
      const cards = path.cardIds.map((cardId) => referenceThenGuided.cards.find((card) => card.id === cardId));
      assert.deepEqual(cards.map((card) => card.type), ["concept", "steps", "question", "checklist"]);
      assert.ok(cards.every((card) => card.pathIds.length === 1 && card.pathIds[0] === pathId));
      assert.deepEqual(cards.map((card) => card.difficulty), Array(4).fill(spec.paths[pathIndex].difficulty));
      assert.deepEqual(cards.map((card) => card.sequence), [0, 1, 2, 3].map((offset) => deck.cards.length + pathIndex * 4 + offset + 1));
    }

    assert.equal(expandGuidedContent(referenceThenGuided, spec), referenceThenGuided, "expansion should be idempotent");
  });
}

test("guided catalog validation rejects taxonomy and answer defects", async () => {
  const source = JSON.parse(await readFile(join(dataDirectory.pathname, "guided", "statistics.json"), "utf8"));
  const invalid = structuredClone(source);
  invalid.paths[1].id = invalid.paths[0].id;
  invalid.paths[1].question[3] = 99;
  invalid.paths[2].checklist[3] = ["Only one item"];

  const errors = validateGuidedContentSpec(invalid, { expectedDeckId: "statistics" });
  assert.ok(errors.some((error) => error.includes("Duplicate guided path id")));
  assert.ok(errors.some((error) => error.includes("answerIndex")));
  assert.ok(errors.some((error) => error.includes("at least 5 items")));
});

test("partial guided content is rejected instead of duplicated", async () => {
  const deck = JSON.parse(await readFile(join(dataDirectory.pathname, "statistics.json"), "utf8"));
  const spec = JSON.parse(await readFile(join(dataDirectory.pathname, "guided", "statistics.json"), "utf8"));
  const partial = {
    ...deck,
    paths: [...deck.paths, { id: spec.paths[0].id, title: "Partial", description: "Invalid partial state", cardIds: ["st-g001"] }],
  };

  assert.throws(() => expandGuidedContent(partial, spec), /partially present or collides/);
});
