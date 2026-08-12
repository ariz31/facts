import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { BUILT_IN_DECK_IDS, validateDeck } from "../src/deck-schema.js";
import { expandDeck, getExpansionCount } from "../src/topic-expansion.js";

const dataDirectory = new URL("../data/", import.meta.url);
const catalog = JSON.parse(await readFile(join(dataDirectory.pathname, "decks.json"), "utf8"));
const deckNames = catalog.decks ?? [];
const builtInDeckNames = new Set(BUILT_IN_DECK_IDS);
const globalDeckIds = new Set();
const globalSourceCardIds = new Set();
const globalRenderedCardIds = new Set();
let sourceCardCount = 0;
let renderedCardCount = 0;
let pathCount = 0;

if (
  !Array.isArray(deckNames)
  || deckNames.length !== BUILT_IN_DECK_IDS.length
  || new Set(deckNames).size !== deckNames.length
  || deckNames.some((name) => !builtInDeckNames.has(name))
  || BUILT_IN_DECK_IDS.some((name) => !deckNames.includes(name))
) {
  console.error(`The catalog must contain exactly the ${BUILT_IN_DECK_IDS.length} built-in deck names.`);
  process.exitCode = 1;
}

for (const deckName of deckNames) {
  const filename = `${deckName}.json`;
  const filepath = join(dataDirectory.pathname, filename);
  await access(filepath);
  const deck = JSON.parse(await readFile(filepath, "utf8"));
  const errors = [];

  if (deck.id !== deckName) errors.push(`Catalog name ${deckName} must match deck id ${deck.id}.`);
  if (globalDeckIds.has(deck.id)) errors.push(`Duplicate deck id: ${deck.id}`);
  globalDeckIds.add(deck.id);

  errors.push(...validateDeck(deck, { rejectBuiltInId: false }));
  for (const card of deck.cards ?? []) {
    sourceCardCount += 1;
    if (globalSourceCardIds.has(card.id)) errors.push(`Duplicate source card id across decks: ${card.id}`);
    globalSourceCardIds.add(card.id);
  }

  const rendered = expandDeck(deck);
  const expectedExpansion = getExpansionCount(deck.id);
  if (rendered.cards.length !== deck.cards.length + expectedExpansion) {
    errors.push(`Runtime expansion expected ${expectedExpansion} cards but produced ${rendered.cards.length - deck.cards.length}.`);
  }
  errors.push(...validateDeck(rendered, { rejectBuiltInId: false }).map((error) => `Rendered deck: ${error}`));
  for (const card of rendered.cards ?? []) {
    renderedCardCount += 1;
    if (globalRenderedCardIds.has(card.id)) errors.push(`Duplicate rendered card id across decks: ${card.id}`);
    globalRenderedCardIds.add(card.id);
  }
  pathCount += rendered.paths?.length ?? 0;

  if (errors.length) {
    console.error(`\n${filename}`);
    for (const error of [...new Set(errors)]) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${filename}: ${deck.cards.length} source cards → ${rendered.cards.length} rendered cards, ${rendered.paths.length} paths`);
  }
}

if (!process.exitCode) {
  console.log(`✓ Validated ${sourceCardCount} source cards and ${renderedCardCount} rendered cards across ${deckNames.length} decks and ${pathCount} guided paths.`);
}
