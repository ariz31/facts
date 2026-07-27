import test from "node:test";
import assert from "node:assert/strict";
import {
  buildStudyOrder,
  calculateProgress,
  filterCards,
  nextIndex,
  previousIndex,
  shuffleCards,
  sortCards,
} from "../src/learning-engine.js";

const cards = [
  { id: "c", sequence: 3, type: "fact", title: "Gamma", prompt: "Third", tags: ["api"], pathIds: ["p2"] },
  { id: "a", sequence: 1, type: "concept", title: "Alpha", prompt: "First", tags: ["html"], pathIds: ["p1"] },
  { id: "b", sequence: 2, type: "question", title: "Beta", prompt: "Second", tags: ["css"], pathIds: ["p1"] },
];

test("sortCards follows sequence without mutating input", () => {
  assert.deepEqual(sortCards(cards).map((card) => card.id), ["a", "b", "c"]);
  assert.deepEqual(cards.map((card) => card.id), ["c", "a", "b"]);
});

test("sequential mode follows sequence", () => {
  assert.deepEqual(buildStudyOrder(cards, "sequential").map((card) => card.id), ["a", "b", "c"]);
});

test("random mode contains every card exactly once", () => {
  const values = [0.1, 0.8, 0.3];
  let index = 0;
  const shuffled = shuffleCards(cards, () => values[index++ % values.length]);
  assert.equal(shuffled.length, cards.length);
  assert.deepEqual(new Set(shuffled.map((card) => card.id)), new Set(cards.map((card) => card.id)));
});

test("filterCards combines path, type, and query", () => {
  assert.deepEqual(filterCards(cards, { pathId: "p1", type: "question", query: "css" }).map((card) => card.id), ["b"]);
  assert.deepEqual(filterCards(cards, { query: "API" }).map((card) => card.id), ["c"]);
});

test("navigation wraps at both ends", () => {
  assert.equal(nextIndex(2, 3), 0);
  assert.equal(previousIndex(0, 3), 2);
  assert.equal(nextIndex(0, 0), 0);
});

test("calculateProgress reports mastered percentage", () => {
  assert.deepEqual(calculateProgress(cards, { a: "mastered", b: "review" }), {
    mastered: 1,
    review: 1,
    untouched: 1,
    percent: 33,
  });
});
