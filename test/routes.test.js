import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { assembleSubtopicDeck } from "../src/subtopic-deck.js";
import { formatRoute, LEGACY_TOPIC_ROUTES, parseRoute, resolveRoute } from "../src/routes.js";

const manifest = JSON.parse(await readFile(new URL("../data/vibe-coding.json", import.meta.url), "utf8"));
const fragments = await Promise.all(manifest.fragments.map(async (name) =>
  JSON.parse(await readFile(new URL(`../data/${name}`, import.meta.url), "utf8"))));
const vibe = assembleSubtopicDeck(manifest, fragments);
const all = [vibe];

test("topics, main topic, subtopic, and a precise card have canonical deep links", () => {
  const routes = [
    [{ view: "topics" }, "#/topics"],
    [{ view: "paths", deckId: "vibe-coding" }, "#/topic/vibe-coding"],
    [{ view: "ready", deckId: "vibe-coding", pathId: "prompting" },
      "#/topic/vibe-coding/subtopic/prompting"],
    [{ view: "study", deckId: "vibe-coding", pathId: "prompting",
      cardId: "vc-062", mode: "sequential" },
    "#/topic/vibe-coding/subtopic/prompting/card/vc-062"],
    [{ view: "study", deckId: "vibe-coding", pathId: "prompting",
      cardId: "vc-062", mode: "random" },
    "#/topic/vibe-coding/subtopic/prompting/card/vc-062?mode=random"],
  ];
  for (const [route, expected] of routes) {
    assert.equal(formatRoute(route), expected);
    assert.equal(formatRoute(resolveRoute(parseRoute(expected), all)), expected);
  }
});

test("direct links resolve all 25 guided subtopics and all 500 cards to their real parent", () => {
  assert.equal(vibe.cards.length, 500);
  assert.equal(vibe.paths.length, 25);
  for (const path of vibe.paths) {
    const pathUrl = formatRoute({ view: "ready", deckId: vibe.id, pathId: path.id });
    assert.deepEqual(resolveRoute(parseRoute(pathUrl), all),
      { view: "ready", deckId: "vibe-coding", pathId: path.id });
    for (const cardId of path.cardIds) {
      const hash = formatRoute({ view: "study", deckId: vibe.id, pathId: path.id,
        cardId, mode: "sequential" });
      assert.deepEqual(resolveRoute(parseRoute(hash), all),
        { view: "study", deckId: "vibe-coding", pathId: path.id,
          cardId, mode: "sequential" }, `Cannot open ${cardId} in ${path.id}`);
    }
  }
});

test("all four obsolete top-level Vibe Coding links redirect into their original subtopics", () => {
  for (const [legacyId, alias] of Object.entries(LEGACY_TOPIC_ROUTES)) {
    const resolved = resolveRoute(parseRoute(`#/topic/${legacyId}`), all);
    assert.deepEqual(resolved, { view: "ready", deckId: "vibe-coding",
      pathId: alias.firstSubtopicId });
    assert.equal(formatRoute(resolved), `#/topic/vibe-coding/subtopic/${alias.firstSubtopicId}`);
    const card = vibe.cards.find((entry) => entry.pathIds.includes(alias.firstSubtopicId));
    const oldHash = `#/topic/${legacyId}/subtopic/${alias.firstSubtopicId}/card/${card.id}`;
    assert.deepEqual(resolveRoute(parseRoute(oldHash), all),
      { view: "study", deckId: "vibe-coding", pathId: alias.firstSubtopicId,
        cardId: card.id, mode: "sequential" });
  }
});

test("invalid, renamed, missing or mismatched content safely resolves to the nearest valid view", () => {
  assert.deepEqual(resolveRoute(parseRoute("#/topic/not-real"), all), { view: "topics" });
  assert.deepEqual(resolveRoute(parseRoute("#/topic/vibe-coding/subtopic/not-real"), all),
    { view: "paths", deckId: "vibe-coding" });
  assert.deepEqual(resolveRoute(parseRoute("#/topic/vibe-coding/subtopic/prompting/card/unknown"), all),
    { view: "ready", deckId: "vibe-coding", pathId: "prompting" });
  assert.deepEqual(resolveRoute(parseRoute("#/topic/vibe-coding/subtopic/prompting/card/vc-101"), all),
    { view: "ready", deckId: "vibe-coding", pathId: "prompting" },
    "A card outside its subtopic must not be rendered as the first or wrong card.");
  assert.deepEqual(resolveRoute(parseRoute("#/topic/vibe-coding/subtopic/all/card/vc-101"), all),
    { view: "study", deckId: "vibe-coding", pathId: "all", cardId: "vc-101", mode: "sequential" });
  assert.equal(formatRoute(resolveRoute(parseRoute("#/topic/vibe-coding/subtopic/prompting/card/vc-062?mode=invalid"), all)),
    "#/topic/vibe-coding/subtopic/prompting/card/vc-062");
  for (const bad of ["#/topic/%E0%A4%A", "#/topic/%2Fadmin",
    "#/topic/vibe-coding/subtopic/../card/vc-001", "#/topic/vibe-coding/subtopic/a%2Fb",
    "#/topic/vibe-coding/subtopic/prompting/card/vc-001/extra", "#/not-a-route"]) {
    assert.deepEqual(parseRoute(bad), { view: "topics" }, bad);
  }
});

test("every canonical route parses without network requirements or server rewrites", () => {
  assert.deepEqual(parseRoute(""), { view: "topics" });
  assert.deepEqual(parseRoute("#"), { view: "topics" });
  assert.deepEqual(parseRoute("#/topics"), { view: "topics" });
  assert.deepEqual(resolveRoute(parseRoute("#/topic/vibe-coding/subtopic/prompting/card/vc-062?mode=random"), all),
    { view: "study", deckId: "vibe-coding", pathId: "prompting", cardId: "vc-062", mode: "random" });
  assert.equal(formatRoute({ view: "study", deckId: "vibe-coding", pathId: "prompting", cardId: "bad/id" }),
    "#/topic/vibe-coding/subtopic/prompting");
});
