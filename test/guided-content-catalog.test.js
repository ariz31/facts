import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { getGuidedExpansionCount, validateGuidedContentSpec } from "../src/guided-content-expansion.js";

const dataDirectory = new URL("../data/", import.meta.url);
const catalog = JSON.parse(await readFile(join(dataDirectory.pathname, "decks.json"), "utf8"));
const difficultyRank = { beginner: 0, intermediate: 1, advanced: 2 };

test("the curated catalog has 120 globally unique cards in 30 ordered paths", async () => {
  const deckIds = new Set();
  const prefixes = new Set();
  const globalCardIds = new Set();
  let pathCount = 0;
  let cardCount = 0;

  for (const deckId of catalog.decks) {
    const spec = JSON.parse(await readFile(join(dataDirectory.pathname, "guided", `${deckId}.json`), "utf8"));
    assert.deepEqual(validateGuidedContentSpec(spec, { expectedDeckId: deckId }), []);
    assert.ok(!deckIds.has(spec.deckId), `duplicate deck id ${spec.deckId}`);
    assert.ok(!prefixes.has(spec.prefix), `duplicate card prefix ${spec.prefix}`);
    deckIds.add(spec.deckId);
    prefixes.add(spec.prefix);

    pathCount += spec.paths.length;
    cardCount += getGuidedExpansionCount(spec);
    for (let index = 1; index <= getGuidedExpansionCount(spec); index += 1) {
      const cardId = `${spec.prefix}${String(index).padStart(3, "0")}`;
      assert.ok(!globalCardIds.has(cardId), `duplicate guided card id ${cardId}`);
      globalCardIds.add(cardId);
    }

    const ranks = spec.paths.map((path) => difficultyRank[path.difficulty]);
    assert.ok(ranks.every((rank, index) => index === 0 || rank >= ranks[index - 1]), `${deckId} difficulty must not decrease`);
    assert.equal(new Set(spec.paths.map((path) => path.title)).size, spec.paths.length, `${deckId} path titles must be unique`);
  }

  assert.equal(deckIds.size, 10);
  assert.equal(prefixes.size, 10);
  assert.equal(pathCount, 30);
  assert.equal(cardCount, 120);
  assert.equal(globalCardIds.size, 120);
});
