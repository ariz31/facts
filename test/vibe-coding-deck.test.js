import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateDeck } from "../src/deck-schema.js";
import { validateGeneratedDeckQuality } from "../src/card-generation-rules.js";
import { VIBE_CURRICULUM_IDS } from "../src/vibe-progress.js";

const decks = await Promise.all(VIBE_CURRICULUM_IDS.map(async (id) => {
  const deck = JSON.parse(await readFile(new URL(`../data/${id}.json`, import.meta.url), "utf8"));
  assert.equal(deck.id, id);
  return deck;
}));

const expectedPaths = [
  ["mindset-foundations", "product-problem-framing", "specs-acceptance", "prompting", "context-engineering"],
  ["planning-decomposition", "architecture", "git-pr", "agents-tools-mcp", "failure-modes"],
  ["frontend-ux", "backend-api", "database-data", "security-privacy", "testing"],
  ["debugging", "code-review", "dependencies", "performance", "accessibility-i18n"],
  ["dev-environments", "cicd-deployment", "observability", "legacy-refactoring", "production-readiness"],
];

const expectedCodeLessons = new Map([
  ["mindset-foundations", "Automate objective checks"],
  ["product-problem-framing", "Start from the user problem"],
  ["specs-acceptance", "Use Given-When-Then for scenarios"],
  ["prompting", "Write prompts as executable briefs"],
  ["context-engineering", "Use repository instructions"],
  ["planning-decomposition", "Plan data migrations separately"],
  ["architecture", "Design explicit interfaces"],
  ["git-pr", "Stage intentionally"],
  ["agents-tools-mcp", "Give agents scoped credentials"],
  ["failure-modes", "Recover by narrowing"],
  ["frontend-ux", "Respect reduced motion"],
  ["backend-api", "Design idempotency for retries"],
  ["database-data", "Use safe schema migrations"],
  ["security-privacy", "Prevent broken access control"],
  ["testing", "Test authorization separately"],
  ["debugging", "Bisect regressions"],
  ["code-review", "Review the final head"],
  ["dependencies", "Verify package identity"],
  ["performance", "Use indexes from workload evidence"],
  ["accessibility-i18n", "Use accessible form errors"],
  ["dev-environments", "Wait for readiness, not process start"],
  ["cicd-deployment", "Run CI on every proposed change"],
  ["observability", "Use structured logs"],
  ["legacy-refactoring", "Use incremental migrations"],
  ["production-readiness", "Use a production-readiness review"],
]);

test("Vibe Coding has five schema-valid 100-card topics in prerequisite order", () => {
  assert.equal(decks.length, 5);
  decks.forEach((deck, index) => {
    assert.equal(deck.cards.length, 100, deck.id);
    assert.equal(deck.paths.length, 5, deck.id);
    assert.deepEqual(deck.paths.map((path) => path.id), expectedPaths[index]);
    assert.deepEqual(deck.cards.map((card) => card.sequence), Array.from({ length: 100 }, (_, i) => i + 1));
    assert.ok(deck.paths.every((path) => path.cardIds.length === 20), deck.id);
    assert.deepEqual(validateDeck(deck, { rejectBuiltInId: false }), [], deck.id);
    assert.deepEqual(validateGeneratedDeckQuality(deck), [], deck.id);
    assert.equal(deck.format, undefined, "Vibe Coding is explicitly authored and no longer assembled from generic templates.");
  });
});

test("all original 500 card IDs and 25 path IDs are retained without duplication", () => {
  const allCards = decks.flatMap((deck) => deck.cards);
  assert.equal(allCards.length, 500);
  assert.deepEqual(
    [...new Set(allCards.map((card) => card.id))].sort(),
    Array.from({ length: 500 }, (_, index) => `vc-${String(index + 1).padStart(3, "0")}`).sort(),
  );
  assert.equal(new Set(decks.flatMap((deck) => deck.paths.map((path) => path.id))).size, 25);
});

test("fronts are authored retrieval cues with distinct, sufficiently explanatory backs", () => {
  for (const deck of decks) {
    for (const card of deck.cards) {
      assert.ok(card.prompt.endsWith("?"), `${card.id}: a genuine question or task is required`);
      assert.ok(card.prompt.length >= 35, `${card.id}: prompt lacks instructional context`);
      if (card.type !== "question") {
        assert.ok(card.content.length >= 75, `${card.id}: revealed teaching content is too thin`);
        assert.notEqual(card.prompt.trim(), card.content.trim(), card.id);
      } else {
        assert.equal(card.content, "");
        assert.ok(card.question.explanation.length >= 95, card.id);
      }
      assert.doesNotMatch(`${card.prompt} ${card.content}`, /correct application of .* requires preserving its semantics|this concept belongs to the .* reference foundation/i, card.id);
    }
  }
});

test("each path has manually contextualized code, assessment, steps, and checklist", () => {
  for (const deck of decks) {
    assert.deepEqual(
      new Set(deck.cards.map((card) => card.type)),
      new Set(["concept", "fact", "question", "code", "steps", "checklist"]),
      deck.id,
    );
    for (const path of deck.paths) {
      const cards = deck.cards.filter((card) => card.pathIds.includes(path.id));
      assert.equal(cards.length, 20);
      const each = (type) => cards.filter((card) => card.type === type);
      assert.equal(each("question").length, 1, path.id);
      assert.equal(each("code").length, 1, path.id);
      assert.equal(each("steps").length, 1, path.id);
      assert.equal(each("checklist").length, 1, path.id);
      assert.equal(each("code")[0].title, expectedCodeLessons.get(path.id), path.id);
      assert.ok(each("code")[0].code.snippet.length > 30, path.id);
      assert.ok(each("steps")[0].steps.length >= 4, path.id);
      assert.ok(each("checklist")[0].items.length >= 4, path.id);
      for (const choice of [each("question")[0]]) {
        assert.equal(choice.question.options.length, 4, choice.id);
        assert.equal(new Set(choice.question.options.map((option) => option.toLowerCase().trim())).size, 4, choice.id);
        assert.ok(choice.question.answerIndex >= 0 && choice.question.answerIndex <= 3, choice.id);
      }
    }
  }
});

test("question answer positions are not fixed and topical AI safety coverage is included", () => {
  const questions = decks.flatMap((deck) => deck.cards.filter((card) => card.type === "question"));
  assert.equal(questions.length, 25);
  for (const answerIndex of [0, 1, 2, 3]) {
    assert.ok(questions.filter((question) => question.question.answerIndex === answerIndex).length >= 4,
      `Answer position ${answerIndex} should occur repeatedly, not be systematically excluded.`);
  }
  const agentic = decks[1].cards.map((card) =>
    [card.title, card.prompt, card.content, card.question?.explanation].filter(Boolean).join(" ")).join(" ").toLowerCase();
  for (const phrase of ["prompt-injection", "mcp", "subagents", "sandbox", "data", "cost", "evaluation"]) {
    assert.ok(agentic.includes(phrase), `Missing AI engineering coverage: ${phrase}`);
  }
});
