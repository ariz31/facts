import assert from "node:assert/strict";
import test from "node:test";
import { expandDeck, getExpansionCount } from "../src/topic-expansion.js";

const legacyReferenceTopics = [
  "frontend-programming", "backend-programming", "data-science", "statistics",
  "python-programming", "databases-sql", "machine-learning", "cybersecurity",
  "cloud-devops", "git-github",
];

test("automatic four-cards-per-term reference expansion is retired", () => {
  for (const id of legacyReferenceTopics) {
    const deck = {
      id, estimatedMinutes: 10,
      paths: [{ id: "base", cardIds: ["base-001"] }],
      cards: [{ id: "base-001", sequence: 1, title: "Authored card" }],
    };
    assert.equal(getExpansionCount(id), 0);
    assert.equal(expandDeck(deck), deck, "never append synthetic or repetitive filler cards");
    assert.equal(deck.cards.length, 1);
    assert.equal(deck.paths.length, 1);
  }
});
