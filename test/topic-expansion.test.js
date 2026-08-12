import assert from "node:assert/strict";
import test from "node:test";
import { expandDeck, getExpansionCount } from "../src/topic-expansion.js";

const deckIds = [
  "frontend-programming",
  "backend-programming",
  "data-science",
  "statistics",
  "python-programming",
  "databases-sql",
  "machine-learning",
  "cybersecurity",
  "cloud-devops",
  "git-github",
];

function baseDeck(id) {
  return {
    id,
    title: id.replaceAll("-", " "),
    category: "Test",
    description: "Test deck",
    estimatedMinutes: 10,
    paths: [{ id: "base", title: "Base", description: "Base path", cardIds: ["base-001"] }],
    cards: [{
      id: "base-001",
      sequence: 1,
      type: "concept",
      title: "Base card",
      prompt: "Base prompt",
      content: "Base content",
      tags: ["base"],
      difficulty: "beginner",
      pathIds: ["base"],
    }],
  };
}

test("every reference-expanded topic receives exactly 100 reference cards", () => {
  for (const deckId of deckIds) {
    assert.equal(getExpansionCount(deckId), 100);
    const original = baseDeck(deckId);
    const expanded = expandDeck(original);
    assert.equal(expanded.cards.length, original.cards.length + 100);
    assert.equal(expanded.paths.length, original.paths.length + 1);
    assert.equal(expanded.paths.at(-1).id, "reference-library");
    assert.equal(expanded.paths.at(-1).cardIds.length, 100);

    const ids = expanded.cards.map((card) => card.id);
    const sequences = expanded.cards.map((card) => card.sequence);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(new Set(sequences).size, sequences.length);

    for (const card of expanded.cards.slice(1)) {
      assert.deepEqual(card.pathIds, ["reference-library"]);
      assert.ok(card.title);
      assert.ok(card.prompt);
      assert.ok(card.tags.length);
      if (card.type === "question") {
        assert.ok(card.question.options.length >= 2);
        assert.ok(card.question.answerIndex >= 0);
        assert.ok(card.question.answerIndex < card.question.options.length);
      }
    }

    assert.equal(expandDeck(expanded), expanded, "expansion should be idempotent");
  }
});
