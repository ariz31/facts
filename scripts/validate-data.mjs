import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { validateDeck } from "../src/deck-schema.js";
import {
  expandGuidedContent,
  getGuidedExpansionCount,
  getGuidedPathCount,
  getGuidedPathIds,
  validateGuidedContentSpec,
} from "../src/guided-content-expansion.js";
import { expandDeck, getExpansionCount } from "../src/topic-expansion.js";

const dataDirectory = new URL("../data/", import.meta.url);
const catalog = JSON.parse(await readFile(join(dataDirectory.pathname, "decks.json"), "utf8"));
const deckNames = catalog.decks ?? [];
const globalDeckIds = new Set();
const globalSourceCardIds = new Set();
const globalRenderedCardIds = new Set();
let sourceCardCount = 0;
let guidedCardCount = 0;
let referenceCardCount = 0;
let renderedCardCount = 0;
let pathCount = 0;

if (!Array.isArray(deckNames) || deckNames.length !== 10 || new Set(deckNames).size !== deckNames.length) {
  console.error("The catalog must contain exactly 10 unique deck names.");
  process.exitCode = 1;
}

for (const deckName of deckNames) {
  const filename = `${deckName}.json`;
  const filepath = join(dataDirectory.pathname, filename);
  const guidedFilepath = join(dataDirectory.pathname, "guided", filename);
  await Promise.all([access(filepath), access(guidedFilepath)]);

  const deck = JSON.parse(await readFile(filepath, "utf8"));
  const guidedSpec = JSON.parse(await readFile(guidedFilepath, "utf8"));
  const errors = [];

  if (deck.id !== deckName) errors.push(`Catalog name ${deckName} must match deck id ${deck.id}.`);
  if (globalDeckIds.has(deck.id)) errors.push(`Duplicate deck id: ${deck.id}`);
  globalDeckIds.add(deck.id);

  errors.push(...validateDeck(deck, { rejectBuiltInId: false }));
  errors.push(...validateGuidedContentSpec(guidedSpec, { expectedDeckId: deck.id }).map((error) => `Guided catalog: ${error}`));

  for (const card of deck.cards ?? []) {
    sourceCardCount += 1;
    if (globalSourceCardIds.has(card.id)) errors.push(`Duplicate source card id across decks: ${card.id}`);
    globalSourceCardIds.add(card.id);
  }

  const withReference = expandDeck(deck);
  const rendered = expandGuidedContent(withReference, guidedSpec);
  const expectedGuidedCards = getGuidedExpansionCount(guidedSpec);
  const expectedGuidedPaths = getGuidedPathCount(guidedSpec);
  const expectedReferenceCards = getExpansionCount(deck.id);
  const expectedCardCount = deck.cards.length + expectedGuidedCards + expectedReferenceCards;
  const expectedPathCount = deck.paths.length + expectedGuidedPaths + (expectedReferenceCards ? 1 : 0);

  guidedCardCount += expectedGuidedCards;
  referenceCardCount += expectedReferenceCards;

  if (rendered.cards.length !== expectedCardCount) {
    errors.push(`Expected ${expectedCardCount} rendered cards but found ${rendered.cards.length}.`);
  }
  if (rendered.paths.length !== expectedPathCount) {
    errors.push(`Expected ${expectedPathCount} rendered paths but found ${rendered.paths.length}.`);
  }

  const renderedPathIds = rendered.paths.map((path) => path.id);
  const guidedPathIds = getGuidedPathIds(guidedSpec);
  const referenceIndex = renderedPathIds.indexOf("reference-library");
  if (referenceIndex !== renderedPathIds.length - 1) errors.push("The reference library must be the final path.");
  if (referenceIndex < guidedPathIds.length || !arraysEqual(renderedPathIds.slice(referenceIndex - guidedPathIds.length, referenceIndex), guidedPathIds)) {
    errors.push("Guided paths must retain catalog order immediately before the reference library.");
  }

  const orderedCards = [...rendered.cards].sort((a, b) => a.sequence - b.sequence);
  const expectedSequences = orderedCards.map((_, index) => index + 1);
  if (!arraysEqual(orderedCards.map((card) => card.sequence), expectedSequences)) {
    errors.push("Rendered card sequences must be globally consecutive starting at 1.");
  }

  const guidedStart = deck.cards.length;
  const guidedCards = orderedCards.slice(guidedStart, guidedStart + expectedGuidedCards);
  const referenceCards = orderedCards.slice(guidedStart + expectedGuidedCards);
  if (guidedCards[0]?.sequence !== deck.cards.length + 1) errors.push("Guided cards must follow authored source cards.");
  if (referenceCards[0]?.sequence !== deck.cards.length + expectedGuidedCards + 1) {
    errors.push("Reference cards must follow all curated guided cards.");
  }

  for (const [pathIndex, pathId] of guidedPathIds.entries()) {
    const path = rendered.paths.find((candidate) => candidate.id === pathId);
    if (!path || path.cardIds.length !== 4) {
      errors.push(`Guided path ${pathId} must contain exactly four cards.`);
      continue;
    }
    const cards = path.cardIds.map((cardId) => rendered.cards.find((card) => card.id === cardId));
    if (cards.some((card) => !card)) errors.push(`Guided path ${pathId} references a missing card.`);
    if (!arraysEqual(cards.map((card) => card?.type), ["concept", "steps", "question", "checklist"])) {
      errors.push(`Guided path ${pathId} must follow concept, steps, question, checklist order.`);
    }
    if (cards.some((card) => !arraysEqual(card?.pathIds ?? [], [pathId]))) {
      errors.push(`Guided cards in ${pathId} must belong only to their intended path.`);
    }
    const expectedStart = deck.cards.length + pathIndex * 4 + 1;
    if (!arraysEqual(cards.map((card) => card?.sequence), [expectedStart, expectedStart + 1, expectedStart + 2, expectedStart + 3])) {
      errors.push(`Guided path ${pathId} has incorrect sequence ordering.`);
    }
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
    console.log(`✓ ${filename}: ${deck.cards.length} source + ${expectedGuidedCards} guided + ${expectedReferenceCards} reference = ${rendered.cards.length} cards, ${rendered.paths.length} paths`);
  }
}

if (!process.exitCode) {
  console.log(`✓ Validated ${sourceCardCount} source, ${guidedCardCount} guided, and ${referenceCardCount} reference cards: ${renderedCardCount} rendered cards across ${deckNames.length} decks and ${pathCount} paths.`);
}

function arraysEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
