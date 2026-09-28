import assert from "node:assert/strict";
import test from "node:test";
import {
  collectValidImportedDecks,
  IMPORT_LIMITS,
  parseDeckResult,
  validateDeck,
} from "../src/deck-schema.js";

function validDeck() {
  return {
    id: "custom-foundations",
    title: "Custom Foundations",
    category: "Test",
    description: "A valid imported deck used by the schema tests.",
    estimatedMinutes: 20,
    paths: [{ id: "foundations", title: "Foundations", description: "Study the fundamentals.", cardIds: ["custom-001", "custom-002"] }],
    cards: [
      {
        id: "custom-001",
        sequence: 1,
        type: "concept",
        title: "Definition",
        prompt: "Define the concept.",
        content: "A complete definition.",
        tags: ["definition"],
        difficulty: "beginner",
        pathIds: ["foundations"],
      },
      {
        id: "custom-002",
        sequence: 2,
        type: "question",
        title: "Knowledge check",
        prompt: "Which answer is correct?",
        content: "",
        tags: ["question"],
        difficulty: "beginner",
        pathIds: ["foundations"],
        question: {
          options: ["Correct", "Incorrect"],
          answerIndex: 0,
          explanation: "The first option is correct.",
        },
      },
    ],
  };
}

test("a complete deck passes strict validation", () => {
  assert.deepEqual(validateDeck(validDeck()), []);
});

test("validation rejects collisions and broken path relationships", () => {
  const deck = validDeck();
  deck.paths.push({ ...deck.paths[0] });
  deck.cards[0].pathIds.push("missing-path");
  deck.paths[0].cardIds.push("custom-001");

  const errors = validateDeck(deck);
  assert.ok(errors.some((error) => error.includes("Duplicate path id")));
  assert.ok(errors.some((error) => error.includes("cannot contain duplicates")));
  assert.ok(errors.some((error) => error.includes("missing path")));
});

test("validation rejects unsupported difficulty and non-consecutive sequences", () => {
  const deck = validDeck();
  deck.cards[0].difficulty = "expert";
  deck.cards[1].sequence = 4;

  const errors = validateDeck(deck);
  assert.ok(errors.some((error) => error.includes("Invalid difficulty")));
  assert.ok(errors.some((error) => error.includes("consecutive")));
});

test("validation rejects a built-in id and excessive card count", () => {
  const deck = validDeck();
  deck.id = "docker";
  deck.cards = Array.from({ length: IMPORT_LIMITS.maximumCards + 1 }, (_, index) => ({
    ...validDeck().cards[0],
    id: `card-${index + 1}`,
    sequence: index + 1,
  }));

  const errors = validateDeck(deck);
  assert.ok(errors.some((error) => error.includes("cannot replace a built-in")));
  assert.ok(errors.some((error) => error.includes("at most")));
});

test("parseDeckResult accepts a fenced deck wrapper", () => {
  const deck = validDeck();
  const parsed = parseDeckResult(`\`\`\`json\n${JSON.stringify({ deck })}\n\`\`\``);
  assert.equal(parsed.id, deck.id);
});

test("parseDeckResult rejects empty and oversized results", () => {
  assert.throws(() => parseDeckResult(""), /Paste/);
  assert.throws(() => parseDeckResult("x".repeat(IMPORT_LIMITS.maximumJsonCharacters + 1)), /too large/);
});

test("collectValidImportedDecks excludes corrupt entries without discarding valid decks", () => {
  const valid = validDeck();
  const invalid = validDeck();
  invalid.id = "broken-deck";
  invalid.cards[0].pathIds = ["missing"];

  const result = collectValidImportedDecks({ [valid.id]: valid, [invalid.id]: invalid });
  assert.equal(Object.keys(result.decks).length, 1);
  assert.equal(result.decks[valid.id].title, valid.title);
  assert.equal(result.rejected.length, 1);
});

test("AI-imported topics accept 100 cards but reject 101; historical authored data has a separate ceiling", () => {
  const template = validDeck().cards[0];
  const deck = validDeck();
  deck.cards = Array.from({ length: 100 }, (_, index) => ({
    ...template,
    id: `card-${String(index + 1).padStart(3, "0")}`,
    sequence: index + 1,
    title: `Concept ${index + 1}`,
    prompt: `What is unique about concept ${index + 1}?`,
    content: `Concept ${index + 1} describes a distinct technical learning objective.`,
  }));
  deck.paths[0].cardIds = deck.cards.map((card) => card.id);
  assert.deepEqual(validateDeck(deck), []);
  deck.cards.push({ ...deck.cards[99], id: "card-101", sequence: 101, title: "Concept 101", prompt: "What is concept 101?", content: "An additional distinct idea." });
  deck.paths[0].cardIds.push("card-101");
  assert.match(validateDeck(deck).join(" "), /at most 100 cards/);
  deck.id = "frontend-programming";
  assert.deepEqual(validateDeck(deck, { rejectBuiltInId: false }), []);
});

test("AI-imported topics reject echoing answers and an out-of-order learning path", () => {
  const deck = validDeck();
  deck.cards[0].content = deck.cards[0].prompt;
  deck.paths[0].cardIds.reverse();
  const errors = validateDeck(deck).join(" ");
  assert.match(errors, /repeats the front/);
  assert.match(errors, /ascending teaching sequence/);
});
