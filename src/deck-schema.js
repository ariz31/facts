export const BUILT_IN_DECK_IDS = Object.freeze([
  "frontend-programming",
  "backend-programming",
  "data-science",
  "statistics",
  "python-programming",
  "databases-sql",
  "machine-learning",
  "cybersecurity",
  "cloud-devops",
  "git-github",
  "docker",
  "vibe-coding",
]);

export const CARD_TYPES = Object.freeze(["concept", "fact", "question", "code", "steps", "checklist"]);
export const DIFFICULTIES = Object.freeze(["beginner", "intermediate", "advanced"]);
export const IMPORT_LIMITS = Object.freeze({
  maximumDecks: 20,
  maximumCards: 500,
  maximumPaths: 50,
  maximumJsonCharacters: 3_000_000,
  maximumTextCharacters: 12_000,
  maximumCodeCharacters: 60_000,
  maximumTagsPerCard: 20,
  maximumOptionsPerQuestion: 12,
});

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_IDS = new Set(["constructor", "prototype", "__proto__"]);
const BUILT_IN_IDS = new Set(BUILT_IN_DECK_IDS);
const ALLOWED_CARD_TYPES = new Set(CARD_TYPES);
const ALLOWED_DIFFICULTIES = new Set(DIFFICULTIES);

export function parseDeckResult(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("Paste the AI-generated deck JSON first.");
  }
  if (raw.length > IMPORT_LIMITS.maximumJsonCharacters) {
    throw new Error(`The pasted result is too large. Keep it below ${formatBytes(IMPORT_LIMITS.maximumJsonCharacters)}.`);
  }

  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(cleaned);
    return parsed?.deck ?? parsed;
  } catch (error) {
    throw new Error(`The pasted result is not valid JSON: ${error.message}`);
  }
}

export function validateDeck(deck, { rejectBuiltInId = true } = {}) {
  const errors = [];
  if (!isRecord(deck)) return ["The result must be one deck object."];

  validateId(deck.id, "Deck id", errors);
  if (rejectBuiltInId && BUILT_IN_IDS.has(deck.id)) errors.push("The deck id cannot replace a built-in topic.");
  validateText(deck.title, "Deck title", errors, { required: true, maximum: 180 });
  validateText(deck.category, "Deck category", errors, { required: true, maximum: 120 });
  validateText(deck.description, "Deck description", errors, { required: true, maximum: 2_000 });
  if (!Number.isInteger(deck.estimatedMinutes) || deck.estimatedMinutes < 1 || deck.estimatedMinutes > 10_000) {
    errors.push("estimatedMinutes must be an integer from 1 to 10000.");
  }

  if (!Array.isArray(deck.cards) || !deck.cards.length) errors.push("The deck needs at least one card.");
  if (Array.isArray(deck.cards) && deck.cards.length > IMPORT_LIMITS.maximumCards) {
    errors.push(`A deck can contain at most ${IMPORT_LIMITS.maximumCards} cards.`);
  }
  if (!Array.isArray(deck.paths) || !deck.paths.length) errors.push("The deck needs at least one guided path.");
  if (Array.isArray(deck.paths) && deck.paths.length > IMPORT_LIMITS.maximumPaths) {
    errors.push(`A deck can contain at most ${IMPORT_LIMITS.maximumPaths} paths.`);
  }
  if (errors.length || !Array.isArray(deck.cards) || !Array.isArray(deck.paths)) return unique(errors);

  const cardIds = new Set();
  const sequences = new Set();
  const pathIds = new Set();

  for (const path of deck.paths) {
    if (!isRecord(path)) {
      errors.push("Every path must be an object.");
      continue;
    }
    validateId(path.id, "Path id", errors);
    if (pathIds.has(path.id)) errors.push(`Duplicate path id ${path.id}.`);
    pathIds.add(path.id);
    validateText(path.title, `Path ${path.id ?? "without id"} title`, errors, { required: true, maximum: 180 });
    validateText(path.description, `Path ${path.id ?? "without id"} description`, errors, { required: true, maximum: 2_000 });
    validateIdArray(path.cardIds, `Path ${path.id ?? "unknown"} cardIds`, errors, { required: true });
  }

  for (const card of deck.cards) {
    if (!isRecord(card)) {
      errors.push("Every card must be an object.");
      continue;
    }
    validateId(card.id, "Card id", errors);
    if (cardIds.has(card.id)) errors.push(`Duplicate card id ${card.id}.`);
    cardIds.add(card.id);

    if (!Number.isInteger(card.sequence) || card.sequence < 1 || sequences.has(card.sequence)) {
      errors.push(`Invalid or duplicate sequence for ${card.id ?? "unknown"}.`);
    }
    sequences.add(card.sequence);

    if (!ALLOWED_CARD_TYPES.has(card.type)) errors.push(`Unsupported type for ${card.id ?? "unknown"}.`);
    if (!ALLOWED_DIFFICULTIES.has(card.difficulty)) errors.push(`Invalid difficulty for ${card.id ?? "unknown"}.`);
    validateText(card.title, `Card ${card.id ?? "unknown"} title`, errors, { required: true, maximum: 240 });
    validateText(card.prompt, `Card ${card.id ?? "unknown"} prompt`, errors, { required: true });
    validateText(card.content, `Card ${card.id ?? "unknown"} content`, errors, {
      required: card.type !== "question",
      maximum: IMPORT_LIMITS.maximumTextCharacters,
    });
    validateStringArray(card.tags, `Card ${card.id ?? "unknown"} tags`, errors, {
      required: true,
      maximumItems: IMPORT_LIMITS.maximumTagsPerCard,
      maximumText: 100,
    });
    validateIdArray(card.pathIds, `Card ${card.id ?? "unknown"} pathIds`, errors, { required: true });

    if (card.type === "question") validateQuestion(card, errors);
    if (card.type === "code") validateCode(card, errors);
    if (card.type === "steps") {
      validateStringArray(card.steps, `Steps card ${card.id ?? "unknown"} steps`, errors, { required: true, maximumItems: 50 });
    }
    if (card.type === "checklist") {
      validateStringArray(card.items, `Checklist card ${card.id ?? "unknown"} items`, errors, { required: true, maximumItems: 50 });
    }
  }

  const orderedSequences = [...sequences].sort((a, b) => a - b);
  if (orderedSequences.length !== deck.cards.length || orderedSequences.some((value, index) => value !== index + 1)) {
    errors.push("Sequences must be unique and consecutive starting at 1.");
  }

  for (const path of deck.paths) {
    if (!isRecord(path) || !Array.isArray(path.cardIds)) continue;
    for (const cardId of path.cardIds) {
      const card = deck.cards.find((candidate) => candidate?.id === cardId);
      if (!card) errors.push(`Path ${path.id ?? "unknown"} references missing card ${cardId}.`);
      else if (!card.pathIds?.includes(path.id)) errors.push(`Path ${path.id} and card ${cardId} are not linked both ways.`);
    }
  }

  for (const card of deck.cards) {
    if (!isRecord(card) || !Array.isArray(card.pathIds)) continue;
    for (const pathId of card.pathIds) {
      const path = deck.paths.find((candidate) => candidate?.id === pathId);
      if (!path) errors.push(`Card ${card.id ?? "unknown"} references missing path ${pathId}.`);
      else if (!path.cardIds?.includes(card.id)) errors.push(`Card ${card.id} and path ${pathId} are not linked both ways.`);
    }
  }

  return unique(errors);
}

export function collectValidImportedDecks(value) {
  const decks = Object.create(null);
  const rejected = [];
  if (!isRecord(value)) return { decks, rejected: ["Imported deck storage is not an object."] };

  for (const [storedId, deck] of Object.entries(value).slice(0, IMPORT_LIMITS.maximumDecks)) {
    const errors = validateDeck(deck);
    if (storedId !== deck?.id) errors.unshift(`Stored deck key ${storedId} does not match its deck id.`);
    if (errors.length) {
      rejected.push(`${storedId}: ${errors[0]}`);
      continue;
    }
    decks[deck.id] = deck;
  }
  return { decks, rejected };
}

function validateQuestion(card, errors) {
  const question = card.question;
  if (!isRecord(question)) {
    errors.push(`Question card ${card.id ?? "unknown"} needs question data.`);
    return;
  }
  validateStringArray(question.options, `Question ${card.id ?? "unknown"} options`, errors, {
    required: true,
    minimumItems: 2,
    maximumItems: IMPORT_LIMITS.maximumOptionsPerQuestion,
    maximumText: 2_000,
  });
  if (!Number.isInteger(question.answerIndex) || question.answerIndex < 0 || question.answerIndex >= (question.options?.length ?? 0)) {
    errors.push(`Question ${card.id ?? "unknown"} has an invalid answerIndex.`);
  }
  validateText(question.explanation, `Question ${card.id ?? "unknown"} explanation`, errors, { required: true });
}

function validateCode(card, errors) {
  if (!isRecord(card.code)) {
    errors.push(`Code card ${card.id ?? "unknown"} needs code data.`);
    return;
  }
  validateText(card.code.language, `Code card ${card.id ?? "unknown"} language`, errors, { required: true, maximum: 80 });
  validateText(card.code.snippet, `Code card ${card.id ?? "unknown"} snippet`, errors, {
    required: true,
    maximum: IMPORT_LIMITS.maximumCodeCharacters,
  });
}

function validateId(value, label, errors) {
  if (typeof value !== "string" || !ID_PATTERN.test(value) || RESERVED_IDS.has(value)) {
    errors.push(`${label} must use lowercase kebab-case.`);
  }
}

function validateIdArray(value, label, errors, { required = false } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${label} must be an array.`);
    return;
  }
  if (required && !value.length) errors.push(`${label} cannot be empty.`);
  if (new Set(value).size !== value.length) errors.push(`${label} cannot contain duplicates.`);
  for (const item of value) validateId(item, label, errors);
}

function validateStringArray(value, label, errors, {
  required = false,
  minimumItems = 1,
  maximumItems = 100,
  maximumText = 2_000,
} = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${label} must be an array.`);
    return;
  }
  if (required && value.length < minimumItems) errors.push(`${label} needs at least ${minimumItems} item${minimumItems === 1 ? "" : "s"}.`);
  if (value.length > maximumItems) errors.push(`${label} can contain at most ${maximumItems} items.`);
  for (const item of value) validateText(item, `${label} item`, errors, { required: true, maximum: maximumText });
}

function validateText(value, label, errors, { required = false, maximum = IMPORT_LIMITS.maximumTextCharacters } = {}) {
  if (typeof value !== "string") {
    errors.push(`${label} must be text.`);
    return;
  }
  if (required && !value.trim()) errors.push(`${label} cannot be empty.`);
  if (value.length > maximum) errors.push(`${label} is too long.`);
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function unique(values) {
  return [...new Set(values)];
}

function formatBytes(characters) {
  return `${Math.round(characters / 1_000_000)} MB`;
}
