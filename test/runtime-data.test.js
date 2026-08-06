import assert from "node:assert/strict";
import test from "node:test";
import { readImportedDecks, writeImportedDecks } from "../src/runtime-data.js";

function validDeck(id = "custom-deck") {
  return {
    id,
    title: "Custom Deck",
    category: "Test",
    description: "A valid custom deck.",
    estimatedMinutes: 10,
    paths: [{ id: "main", title: "Main", description: "Main path", cardIds: ["card-001"] }],
    cards: [{
      id: "card-001",
      sequence: 1,
      type: "concept",
      title: "Concept",
      prompt: "Prompt",
      content: "Content",
      tags: ["test"],
      difficulty: "beginner",
      pathIds: ["main"],
    }],
  };
}

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    value(key) { return values.get(key); },
  };
}

test("writeImportedDecks and readImportedDecks preserve a valid deck", () => {
  const storage = memoryStorage();
  const deck = validDeck();
  writeImportedDecks({ [deck.id]: deck }, storage);

  const result = readImportedDecks(storage);
  assert.equal(result.rejected.length, 0);
  assert.equal(result.decks[deck.id].title, deck.title);
});

test("readImportedDecks ignores corrupt JSON without throwing", () => {
  const storage = memoryStorage({ "facts-imported-decks-v1": "{not-json" });
  const result = readImportedDecks(storage);
  assert.deepEqual(Object.keys(result.decks), []);
  assert.equal(result.rejected.length, 1);
});

test("readImportedDecks keeps valid entries when another stored deck is invalid", () => {
  const good = validDeck("good-deck");
  const bad = validDeck("bad-deck");
  bad.cards[0].pathIds = ["missing"];
  const storage = memoryStorage({
    "facts-imported-decks-v1": JSON.stringify({ [good.id]: good, [bad.id]: bad }),
  });

  const result = readImportedDecks(storage);
  assert.deepEqual(Object.keys(result.decks), [good.id]);
  assert.equal(result.rejected.length, 1);
});

test("writeImportedDecks reports unavailable or full storage", () => {
  const storage = {
    getItem() { return null; },
    setItem() { throw Object.assign(new Error("quota"), { name: "QuotaExceededError" }); },
  };
  const deck = validDeck();
  assert.throws(() => writeImportedDecks({ [deck.id]: deck }, storage), /unavailable or full/);
  assert.throws(() => writeImportedDecks({ [deck.id]: deck }, null), /unavailable/);
});

test("writeImportedDecks rejects a storage key that does not match the deck id", () => {
  const storage = memoryStorage();
  const deck = validDeck();
  assert.throws(() => writeImportedDecks({ "wrong-key": deck }, storage), /does not match/);
});
