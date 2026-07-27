import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { CARD_TYPES } from "../src/learning-engine.js";

const dataDirectory = new URL("../data/", import.meta.url);
const catalog = JSON.parse(await readFile(join(dataDirectory.pathname, "decks.json"), "utf8"));
const deckNames = catalog.decks ?? [];
const globalDeckIds = new Set();
const globalCardIds = new Set();
let cardCount = 0;
let pathCount = 0;

if (!Array.isArray(deckNames) || deckNames.length !== 10 || new Set(deckNames).size !== deckNames.length) {
  console.error("The catalog must contain exactly 10 unique deck names.");
  process.exitCode = 1;
}

for (const deckName of deckNames) {
  const filename = `${deckName}.json`;
  const filepath = join(dataDirectory.pathname, filename);
  await access(filepath);
  const deck = JSON.parse(await readFile(filepath, "utf8"));
  const errors = [];
  const ids = new Set();
  const sequences = new Set();

  if (!deck.id || !deck.title || !deck.category || !Array.isArray(deck.cards) || !Array.isArray(deck.paths)) {
    errors.push("Deck must include id, title, category, cards, and paths.");
  }
  if (deck.id !== deckName) errors.push(`Catalog name ${deckName} must match deck id ${deck.id}.`);
  if (globalDeckIds.has(deck.id)) errors.push(`Duplicate deck id: ${deck.id}`);
  globalDeckIds.add(deck.id);

  for (const card of deck.cards ?? []) {
    cardCount += 1;
    if (!card.id || ids.has(card.id) || globalCardIds.has(card.id)) errors.push(`Duplicate or missing card id: ${card.id}`);
    ids.add(card.id);
    globalCardIds.add(card.id);
    if (!Number.isInteger(card.sequence) || card.sequence < 1 || sequences.has(card.sequence)) {
      errors.push(`Invalid or duplicate sequence for ${card.id}: ${card.sequence}`);
    }
    sequences.add(card.sequence);
    if (!CARD_TYPES.includes(card.type)) errors.push(`Unsupported type for ${card.id}: ${card.type}`);
    if (!card.title || !card.prompt || !Array.isArray(card.tags) || !Array.isArray(card.pathIds)) {
      errors.push(`Missing required content fields for ${card.id}`);
    }
    if (card.type === "question") {
      const question = card.question;
      if (!question || !Array.isArray(question.options) || question.options.length < 2) {
        errors.push(`Question ${card.id} needs at least two options.`);
      } else if (!Number.isInteger(question.answerIndex) || question.answerIndex < 0 || question.answerIndex >= question.options.length) {
        errors.push(`Question ${card.id} has an invalid answerIndex.`);
      }
    }
    if (card.type === "code" && !card.code?.snippet) errors.push(`Code card ${card.id} needs a snippet.`);
    if (card.type === "steps" && !card.steps?.length) errors.push(`Steps card ${card.id} needs steps.`);
    if (card.type === "checklist" && !card.items?.length) errors.push(`Checklist card ${card.id} needs items.`);
  }

  for (const path of deck.paths ?? []) {
    pathCount += 1;
    if (!path.id || !path.title || !Array.isArray(path.cardIds) || !path.cardIds.length) {
      errors.push(`Invalid path: ${path.id}`);
      continue;
    }
    for (const cardId of path.cardIds) {
      if (!ids.has(cardId)) errors.push(`Path ${path.id} references missing card ${cardId}.`);
    }
  }

  for (const card of deck.cards ?? []) {
    for (const pathId of card.pathIds) {
      if (!deck.paths.some((path) => path.id === pathId && path.cardIds.includes(card.id))) {
        errors.push(`Card ${card.id} and path ${pathId} are not linked in both directions.`);
      }
    }
  }

  if (errors.length) {
    console.error(`\n${filename}`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${filename}: ${deck.cards.length} cards, ${deck.paths.length} paths`);
  }
}

if (!process.exitCode) {
  console.log(`✓ Validated ${cardCount} cards across ${deckNames.length} decks and ${pathCount} guided paths.`);
}
