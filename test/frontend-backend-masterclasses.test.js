import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { validateDeck } from "../src/deck-schema.js";
import { assembleLessonDeck } from "../src/lesson-deck.js";
import { expandDeck, getExpansionCount } from "../src/topic-expansion.js";

const dataDirectory = new URL("../data/", import.meta.url);

async function loadCuratedDeck(id) {
  const manifest = JSON.parse(await readFile(join(dataDirectory.pathname, `${id}.json`), "utf8"));
  const fragments = await Promise.all(manifest.fragments.map(async (fragment) => (
    JSON.parse(await readFile(join(dataDirectory.pathname, fragment), "utf8"))
  )));
  return { manifest, deck: assembleLessonDeck(manifest, fragments) };
}

const expectedPaths = {
  "frontend-programming": [
    "web-platform", "semantic-html", "forms-native-controls", "css-cascade", "layout",
    "responsive-design", "visual-system", "javascript-language", "dom-events", "async-network",
    "state-components", "typescript-tooling", "accessibility", "routing-ux", "frontend-security",
    "performance", "media-offline", "testing-debugging", "framework-architecture", "production-frontend",
  ],
  "backend-programming": [
    "server-runtime", "http-semantics", "api-design", "node-async", "routing-middleware",
    "validation-errors", "relational-sql", "transactions-migrations", "caching-storage", "authentication",
    "authorization", "api-security", "config-secrets-tls", "jobs-queues", "streams-files",
    "realtime-integrations", "testing-contracts", "observability-reliability", "architecture-deployment", "recovery-operations",
  ],
};

for (const [id, pathIds] of Object.entries(expectedPaths)) {
  test(`${id} assembles 400 curated cards and reaches the 500-card runtime maximum`, async () => {
    const { manifest, deck } = await loadCuratedDeck(id);
    assert.equal(manifest.lessonStyle, "technical");
    assert.equal(deck.cards.length, 400);
    assert.equal(deck.paths.length, 20);
    assert.deepEqual(deck.paths.map((path) => path.id), pathIds);
    assert.ok(deck.paths.every((path) => path.cardIds.length === 20));
    assert.deepEqual(validateDeck(deck, { rejectBuiltInId: false }), []);

    const ids = deck.cards.map((card) => card.id);
    assert.equal(new Set(ids).size, 400);
    assert.match(ids[0], id === "frontend-programming" ? /^fe2-/ : /^be2-/);
    assert.ok(deck.cards.every((card, index) => card.sequence === index + 1));
    assert.deepEqual(new Set(deck.cards.map((card) => card.type)), new Set(["concept", "fact", "question", "code", "steps", "checklist"]));
    assert.deepEqual(new Set(deck.cards.map((card) => card.difficulty)), new Set(["beginner", "intermediate", "advanced"]));

    assert.equal(getExpansionCount(id), 100);
    const rendered = expandDeck(deck);
    assert.equal(rendered.cards.length, 500);
    assert.equal(rendered.paths.length, 21);
    assert.equal(rendered.paths.at(-1).id, "reference-library");
    assert.equal(rendered.paths.at(-1).cardIds.length, 100);
    assert.deepEqual(validateDeck(rendered, { rejectBuiltInId: false }), []);
  });
}

test("compact technical topics expand into paired concept/application lessons", async () => {
  const { deck } = await loadCuratedDeck("frontend-programming");
  assert.equal(deck.cards[0].title, "Client-side trust boundary");
  assert.equal(deck.cards[1].title, "Client-side trust boundary: application");
  assert.match(deck.cards[1].content, /boundary or failure case/i);
});
