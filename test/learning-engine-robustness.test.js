import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateProgress,
  filterCards,
  nextIndex,
  previousIndex,
  shuffleCards,
  sortCards,
} from "../src/learning-engine.js";

test("learning helpers tolerate invalid collections", () => {
  assert.deepEqual(sortCards(null), []);
  assert.deepEqual(filterCards("not-an-array"), []);
  assert.deepEqual(calculateProgress(undefined, undefined), { mastered: 0, review: 0, untouched: 0, percent: 0 });
});

test("shuffle clamps out-of-range random samples without losing cards", () => {
  const cards = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const high = shuffleCards(cards, () => 1);
  const low = shuffleCards(cards, () => -4);
  assert.deepEqual(new Set(high.map((card) => card.id)), new Set(["a", "b", "c"]));
  assert.deepEqual(new Set(low.map((card) => card.id)), new Set(["a", "b", "c"]));
  assert.equal(high.length, cards.length);
  assert.equal(low.length, cards.length);
});

test("navigation normalizes invalid and out-of-range indexes", () => {
  assert.equal(nextIndex(99, 3), 1);
  assert.equal(previousIndex(-4, 3), 1);
  assert.equal(nextIndex("bad", 3), 1);
  assert.equal(previousIndex("bad", 3), 2);
  assert.equal(nextIndex(1, 0), 0);
});

test("progress ignores unknown statuses and never reports negative untouched cards", () => {
  const cards = [{ id: "a" }, { id: "b" }];
  assert.deepEqual(calculateProgress(cards, { a: "mastered", b: "unknown" }), {
    mastered: 1,
    review: 0,
    untouched: 1,
    percent: 50,
  });
});
