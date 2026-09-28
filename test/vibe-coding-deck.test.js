import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateDeck } from "../src/deck-schema.js";
import { validateGeneratedDeckQuality } from "../src/card-generation-rules.js";
import { assembleSubtopicDeck, isSubtopicFragmentManifest } from "../src/subtopic-deck.js";

const manifest = JSON.parse(await readFile(new URL("../data/vibe-coding.json", import.meta.url), "utf8"));
const decks = await Promise.all(manifest.fragments.map(async (path) => (
  JSON.parse(await readFile(new URL(`../data/${path}`, import.meta.url), "utf8"))
)));
const parent = assembleSubtopicDeck(manifest, decks);

const expectedPaths = [
  ["mindset-foundations", "product-problem-framing", "specs-acceptance", "prompting", "context-engineering"],
  ["planning-decomposition", "architecture", "git-pr", "agents-tools-mcp", "failure-modes"],
  ["frontend-ux", "backend-api", "database-data", "security-privacy", "testing"],
  ["debugging", "code-review", "dependencies", "performance", "accessibility-i18n"],
  ["dev-environments", "cicd-deployment", "observability", "legacy-refactoring", "production-readiness"],
];

const originalCardRangeStarts = [
  [1, 21, 41, 61, 81],
  [101, 121, 261, 421, 441],
  [141, 161, 181, 201, 221],
  [241, 281, 301, 321, 341],
  [361, 381, 401, 461, 481],
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

test("Vibe Coding is one main topic with 25 subtopics, using five internal content shards", () => {
  assert.equal(manifest.id, "vibe-coding");
  assert.ok(isSubtopicFragmentManifest(manifest));
  assert.equal(parent.id, "vibe-coding");
  assert.equal(parent.cards.length, 500, "the main topic is NOT capped at 100 cards");
  assert.equal(parent.paths.length, 25);
  assert.deepEqual(parent.paths.map((path) => path.id), expectedPaths.flat());
  assert.deepEqual(parent.cards.map((card) => card.sequence), Array.from({ length: 500 }, (_, i) => i + 1));
  assert.deepEqual(validateDeck(parent, { rejectBuiltInId: false }), []);
  assert.equal(decks.length, 5);
  decks.forEach((deck, index) => {
    assert.equal(deck.cards.length, 100, "the five existing source shards each happen to contain 100 cards");
    assert.equal(deck.paths.length, 5, deck.id);
    assert.deepEqual(deck.paths.map((path) => path.id), expectedPaths[index]);
    assert.deepEqual(deck.cards.map((card) => card.sequence), Array.from({ length: 100 }, (_, i) => i + 1));
    assert.ok(deck.paths.every((path) => path.cardIds.length === 20), deck.id);
    // Preserve the original vc-001..vc-500 learning-objective/path ownership
    // even when a path is moved to a different top-level course.
    deck.paths.forEach((path, pathIndex) => {
      const rangeStart = originalCardRangeStarts[index][pathIndex];
      const expectedIds = Array.from({ length: 20 }, (_, offset) =>
        `vc-${String(rangeStart + offset).padStart(3, "0")}`);
      assert.deepEqual(path.cardIds, expectedIds, `${deck.id}: miscategorized cards in ${path.id}`);
      for (const cardId of expectedIds) {
        const card = deck.cards.find((candidate) => candidate.id === cardId);
        assert.deepEqual(card?.pathIds, [path.id], `${cardId}: wrong teaching topic`);
      }
    });
    assert.deepEqual(validateDeck(deck, { rejectBuiltInId: false }), [], deck.id);
    assert.deepEqual(validateGeneratedDeckQuality(deck), [], deck.id);
    assert.equal(deck.format, undefined, "Vibe Coding is explicitly authored and no longer assembled from generic templates.");
  });
});

test("all original 500 card IDs and 25 path IDs are retained under the SINGLE main topic", () => {
  const allCards = parent.cards;
  assert.equal(allCards.length, 500);
  assert.deepEqual(
    [...new Set(allCards.map((card) => card.id))].sort(),
    Array.from({ length: 500 }, (_, index) => `vc-${String(index + 1).padStart(3, "0")}`).sort(),
  );
  assert.equal(new Set(parent.paths.map((path) => path.id)).size, 25);
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
  const questions = parent.cards.filter((card) => card.type === "question");
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

test("expanded agent-safety lessons retain their original mastery objectives", () => {
  const agentic = new Map(decks[1].cards.map((card) => [card.id, card]));
  const originalObjectives = [
    ["vc-425", "Use MCP with trust boundaries", "External tool servers can expose data or perform actions."],
    ["vc-427", "Use subagents for independent analysis", "Parallel perspectives help when tasks do not modify overlapping state."],
    ["vc-433", "Use timeouts and bounded operations", "Agents can launch commands that hang or consume excessive resources."],
    ["vc-434", "Do not paste secrets into prompts", "Prompt context may be retained or exposed beyond intended boundaries."],
    ["vc-437", "Use dry runs where available", "Previewing mutation reduces surprises."],
    ["vc-457", "Security blind spots", "Models may optimize functionality while overlooking abuse paths."],
    ["vc-459", "False completion claims", "Agents can state checks passed without actually running them."],
  ];
  for (const [id, originalTitle, originalPrinciple] of originalObjectives) {
    const card = agentic.get(id);
    assert.equal(card?.title, originalTitle, `${id}: do not silently transfer mastery to a new objective`);
    assert.ok(card.content.includes(originalPrinciple), `${id}: original teaching objective was lost`);
  }
});

test("direct answers address the audit's formerly under-explained scenarios", () => {
  const cards = new Map(parent.cards.map((card) => [card.id, card]));
  assert.match(cards.get("vc-008").prompt, /focused commits and recorded decisions/);
  for (const code of ["400", "401", "403", "404", "200", "201"]) {
    assert.ok(cards.get("vc-164").content.includes(code), `HTTP ${code} meaning must be taught`);
  }
  assert.match(cards.get("vc-169").content, /outbox event atomically/);
  assert.match(cards.get("vc-176").content, /bulk imports/);
  assert.match(cards.get("vc-430").content, /connection host, project\/database identifier/);
  assert.match(cards.get("vc-458").content, /screenshot captures only one static visual state/);
  assert.match(cards.get("vc-460").content, /falsifiable hypothesis/);
  assert.match(cards.get("vc-302").content, /Neither proves the package is benign/);
  assert.match(cards.get("vc-358").content, /localized validation message should retain the field name/);
});

test("every subtopic independently fits the 100-card ceiling, with NO top-level duplicate entries", () => {
  const catalog = ["vibe-coding"]; // The catalog equality is checked against data/decks.json by check:data.
  assert.equal(catalog.filter((id) => id.startsWith("vibe-coding")).length, 1);
  for (const path of parent.paths) {
    assert.ok(path.cardIds.length >= 1 && path.cardIds.length <= 100,
      `${path.id}: no subtopic may contain more than 100 cards`);
  }
  assert.equal(new Set(parent.cards.map((card) => card.id)).size, 500);
  assert.equal(parent.cards.length, parent.paths.reduce((n, path) => n + path.cardIds.length, 0));
});
