import { validateDeck } from "./deck-schema.js";

const FRAGMENT_PATH = /^(?:[a-z0-9-]+\/)*[a-z0-9-]+\.json$/;

export function isSubtopicFragmentManifest(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)
    && value.format === "subtopic-fragments-v1"
    && typeof value.id === "string"
    && typeof value.title === "string"
    && typeof value.category === "string"
    && typeof value.description === "string"
    && Number.isInteger(value.estimatedMinutes) && value.estimatedMinutes > 0
    && Array.isArray(value.fragments) && value.fragments.length
    && value.fragments.every((file) => typeof file === "string" && FRAGMENT_PATH.test(file))
    && new Set(value.fragments).size === value.fragments.length);
}

// The manifest is ONE parent topic. Each path is a subtopic, independently
// limited to 100 cards by validateDeck; fragments are only internal file shards.
// Neither this assembler nor the schema imposes a total parent card ceiling.
export function assembleSubtopicDeck(manifest, fragments) {
  if (!isSubtopicFragmentManifest(manifest)) throw new Error("Invalid subtopic fragment manifest.");
  if (!Array.isArray(fragments) || fragments.length !== manifest.fragments.length) {
    throw new Error("Subtopic fragment count does not match the manifest.");
  }

  const cards = [], paths = [], seenCards = new Set(), seenPaths = new Set();
  let sequenceOffset = 0;
  fragments.forEach((fragment, index) => {
    const source = manifest.fragments[index];
    if (!fragment || typeof fragment !== "object" || Array.isArray(fragment)
      || !Array.isArray(fragment.cards) || !Array.isArray(fragment.paths)
      || fragment.category !== manifest.category) {
      throw new Error(`Invalid subtopic source or category: ${source}.`);
    }
    const fragmentErrors = validateDeck(fragment, { rejectBuiltInId: false });
    if (fragmentErrors.length) throw new Error(`${source}: ${fragmentErrors.join(" ")}`);
    for (const path of fragment.paths) {
      if (seenPaths.has(path.id)) throw new Error(`Duplicate subtopic: ${path.id}.`);
      seenPaths.add(path.id);
      paths.push({ ...path, cardIds: [...path.cardIds] });
    }
    for (const card of fragment.cards) {
      if (seenCards.has(card.id)) throw new Error(`Duplicate card ID across subtopics: ${card.id}.`);
      seenCards.add(card.id);
      cards.push({ ...card, sequence: sequenceOffset + card.sequence });
    }
    sequenceOffset += fragment.cards.length;
  });

  const deck = {
    id: manifest.id,
    title: manifest.title,
    category: manifest.category,
    description: manifest.description,
    estimatedMinutes: manifest.estimatedMinutes,
    paths,
    cards,
  };
  const errors = validateDeck(deck, { rejectBuiltInId: false });
  if (errors.length) throw new Error(`Assembled parent topic: ${errors.join(" ")}`);
  return deck;
}
