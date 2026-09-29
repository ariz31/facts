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

test("validation rejects replacing a built-in topic", () => {
  const deck = validDeck();
  deck.id = "vibe-coding";
  assert.match(validateDeck(deck).join(" "), /cannot replace a built-in/);
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

function generatedTopic(subtopicSizes) {
  const deck = validDeck();
  deck.paths = [];
  deck.cards = [];
  for (let group = 0; group < subtopicSizes.length; group += 1) {
    const pathId = `subtopic-${group + 1}`;
    const cardIds = [];
    for (let i = 0; i < subtopicSizes[group]; i += 1) {
      const n = deck.cards.length + 1;
      const id = `custom-${String(n).padStart(4, "0")}`;
      cardIds.push(id);
      deck.cards.push({
        id, sequence: n, type: "concept", title: `Topic ${group + 1}: concept ${i + 1}`,
        prompt: `How does subtopic ${group + 1}, concept ${i + 1} support the learning objective?`,
        content: `The distinct learning objective ${n} develops the requested subject with its own technical explanation.`,
        tags: [pathId], difficulty: "beginner", pathIds: [pathId],
      });
    }
    deck.paths.push({ id: pathId, title: `Subtopic ${group + 1}`,
      description: `Progressive part ${group + 1} of a single parent topic.`, cardIds });
  }
  return deck;
}

test("the main topic has no aggregate card cap; every subtopic is capped independently at 100", () => {
  assert.equal(IMPORT_LIMITS.maximumCardsPerSubtopic, 100);
  assert.deepEqual(validateDeck(generatedTopic([100, 100, 100, 100, 100])), []);
  assert.deepEqual(validateDeck(generatedTopic([100, 1])), []);
  const tooManyInOnePath = generatedTopic([101, 100]);
  assert.match(validateDeck(tooManyInOnePath).join(" "), /Subtopic subtopic-1 can contain at most 100 cards/);
  assert.deepEqual(validateDeck(generatedTopic([101, 100]), { rejectBuiltInId: false })
    .some((error) => error.includes("at most 100 cards")), true,
  "Built-in topics must not bypass the per-subtopic rule.");
});

test("AI-imported topics reject echoing answers and an out-of-order learning path", () => {
  const deck = validDeck();
  deck.cards[0].content = deck.cards[0].prompt;
  deck.paths[0].cardIds.reverse();
  const errors = validateDeck(deck).join(" ");
  assert.match(errors, /repeats the front/);
  assert.match(errors, /ascending teaching sequence/);
});

test("retired topic URLs remain reserved and every imported id is routeable", () => {
  for (const former of [
    "vibe-coding-agentic", "vibe-coding-application",
    "vibe-coding-quality", "vibe-coding-production",
  ]) {
    const deck = validDeck();
    deck.id = former;
    assert.match(validateDeck(deck).join(" "), /cannot replace a built-in/);
  }
  const invalid = validDeck();
  invalid.id = "a".repeat(181);
  assert.match(validateDeck(invalid).join(" "), /no longer than 180/);
});
