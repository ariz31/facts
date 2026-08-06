const CARDS_PER_PATH = 4;
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PREFIX_PATTERN = /^[a-z0-9]+-g$/;
const DIFFICULTIES = new Set(["beginner", "intermediate", "advanced"]);

export function validateGuidedContentSpec(spec, { expectedDeckId } = {}) {
  const errors = [];
  if (!isRecord(spec)) return ["Guided content must be an object."];

  if (!ID_PATTERN.test(spec.deckId ?? "")) errors.push("deckId must use lowercase kebab-case.");
  if (expectedDeckId && spec.deckId !== expectedDeckId) errors.push(`Expected guided content for ${expectedDeckId}.`);
  if (!PREFIX_PATTERN.test(spec.prefix ?? "")) errors.push("prefix must end in -g and use lowercase kebab-case.");
  if (!Number.isInteger(spec.estimatedMinutes) || spec.estimatedMinutes < 1 || spec.estimatedMinutes > 1_000) {
    errors.push("estimatedMinutes must be an integer from 1 to 1000.");
  }
  if (!Array.isArray(spec.paths) || spec.paths.length !== 3) {
    errors.push("Each guided catalog must contain exactly three ordered paths.");
    return unique(errors);
  }

  const pathIds = new Set();
  for (const [index, path] of spec.paths.entries()) {
    const label = `Path ${index + 1}`;
    if (!isRecord(path)) {
      errors.push(`${label} must be an object.`);
      continue;
    }
    if (!ID_PATTERN.test(path.id ?? "")) errors.push(`${label} id must use lowercase kebab-case.`);
    if (pathIds.has(path.id)) errors.push(`Duplicate guided path id ${path.id}.`);
    pathIds.add(path.id);
    validateText(path.title, `${label} title`, errors);
    validateText(path.description, `${label} description`, errors);
    if (!DIFFICULTIES.has(path.difficulty)) errors.push(`${label} has an invalid difficulty.`);
    validateStringList(path.tags, `${label} tags`, errors, { minimum: 2, uniqueItems: true });
    validateTuple(path.concept, `${label} concept`, errors, 3);

    if (!Array.isArray(path.workflow) || path.workflow.length !== 4) {
      errors.push(`${label} workflow must contain title, prompt, content, and steps.`);
    } else {
      validateTuple(path.workflow.slice(0, 3), `${label} workflow`, errors, 3);
      validateStringList(path.workflow[3], `${label} workflow steps`, errors, { minimum: 5 });
    }

    if (!Array.isArray(path.question) || path.question.length !== 5) {
      errors.push(`${label} question must contain title, prompt, options, answerIndex, and explanation.`);
    } else {
      validateText(path.question[0], `${label} question title`, errors);
      validateText(path.question[1], `${label} question prompt`, errors);
      validateStringList(path.question[2], `${label} question options`, errors, { minimum: 3, uniqueItems: true });
      if (!Number.isInteger(path.question[3]) || path.question[3] < 0 || path.question[3] >= (path.question[2]?.length ?? 0)) {
        errors.push(`${label} question answerIndex is invalid.`);
      }
      validateText(path.question[4], `${label} question explanation`, errors);
    }

    if (!Array.isArray(path.checklist) || path.checklist.length !== 4) {
      errors.push(`${label} checklist must contain title, prompt, content, and items.`);
    } else {
      validateTuple(path.checklist.slice(0, 3), `${label} checklist`, errors, 3);
      validateStringList(path.checklist[3], `${label} checklist items`, errors, { minimum: 5 });
    }
  }

  return unique(errors);
}

export function expandGuidedContent(deck, spec) {
  if (!spec) return deck;
  const validationErrors = validateGuidedContentSpec(spec, { expectedDeckId: deck?.id });
  if (validationErrors.length) throw new Error(validationErrors.join(" "));
  if (!Array.isArray(deck?.cards) || !Array.isArray(deck?.paths)) return deck;

  const expectedPathIds = spec.paths.map((path) => path.id);
  const existingPathIds = new Set(deck.paths.map((path) => path?.id));
  const existingCardIds = new Set(deck.cards.map((card) => card?.id));
  const generatedCardIds = cardIdsForSpec(spec);

  const hasAllPaths = expectedPathIds.every((id) => existingPathIds.has(id));
  const hasAllCards = generatedCardIds.every((id) => existingCardIds.has(id));
  if (hasAllPaths && hasAllCards) return deck;

  const pathCollisions = expectedPathIds.filter((id) => existingPathIds.has(id));
  const cardCollisions = generatedCardIds.filter((id) => existingCardIds.has(id));
  if (pathCollisions.length || cardCollisions.length) {
    throw new Error(`Guided content for ${deck.id} is partially present or collides with existing ids.`);
  }

  const startSequence = Math.max(0, ...deck.cards.map((card) => Number(card.sequence) || 0)) + 1;
  const paths = [];
  const cards = [];

  spec.paths.forEach((path, pathIndex) => {
    const cardIds = Array.from({ length: CARDS_PER_PATH }, (_, cardIndex) =>
      `${spec.prefix}${String(pathIndex * CARDS_PER_PATH + cardIndex + 1).padStart(3, "0")}`
    );
    paths.push({ id: path.id, title: path.title, description: path.description, cardIds });

    const shared = {
      difficulty: path.difficulty,
      pathIds: [path.id],
      tags: [...new Set([...path.tags, path.id, "guided"])],
    };
    const sequence = (cardIndex) => startSequence + pathIndex * CARDS_PER_PATH + cardIndex;

    cards.push({
      id: cardIds[0], sequence: sequence(0), type: "concept",
      title: path.concept[0], prompt: path.concept[1], content: path.concept[2], ...shared,
    });
    cards.push({
      id: cardIds[1], sequence: sequence(1), type: "steps",
      title: path.workflow[0], prompt: path.workflow[1], content: path.workflow[2],
      steps: [...path.workflow[3]], ...shared,
    });
    cards.push({
      id: cardIds[2], sequence: sequence(2), type: "question",
      title: path.question[0], prompt: path.question[1], content: "",
      question: {
        options: [...path.question[2]], answerIndex: path.question[3], explanation: path.question[4],
      },
      ...shared,
    });
    cards.push({
      id: cardIds[3], sequence: sequence(3), type: "checklist",
      title: path.checklist[0], prompt: path.checklist[1], content: path.checklist[2],
      items: [...path.checklist[3]], ...shared,
    });
  });

  return {
    ...deck,
    estimatedMinutes: Number(deck.estimatedMinutes || 0) + spec.estimatedMinutes,
    paths: [...deck.paths, ...paths],
    cards: [...deck.cards, ...cards],
  };
}

export function getGuidedExpansionCount(spec) {
  return Array.isArray(spec?.paths) ? spec.paths.length * CARDS_PER_PATH : 0;
}

export function getGuidedPathCount(spec) {
  return Array.isArray(spec?.paths) ? spec.paths.length : 0;
}

export function getGuidedPathIds(spec) {
  return Array.isArray(spec?.paths) ? spec.paths.map((path) => path.id) : [];
}

function cardIdsForSpec(spec) {
  return Array.from({ length: spec.paths.length * CARDS_PER_PATH }, (_, index) =>
    `${spec.prefix}${String(index + 1).padStart(3, "0")}`
  );
}

function validateTuple(value, label, errors, length) {
  if (!Array.isArray(value) || value.length !== length) {
    errors.push(`${label} must contain exactly ${length} text values.`);
    return;
  }
  value.forEach((item, index) => validateText(item, `${label} item ${index + 1}`, errors));
}

function validateStringList(value, label, errors, { minimum = 1, uniqueItems = false } = {}) {
  if (!Array.isArray(value) || value.length < minimum) {
    errors.push(`${label} must contain at least ${minimum} items.`);
    return;
  }
  value.forEach((item, index) => validateText(item, `${label} item ${index + 1}`, errors));
  if (uniqueItems && new Set(value).size !== value.length) errors.push(`${label} cannot contain duplicates.`);
}

function validateText(value, label, errors) {
  if (typeof value !== "string" || !value.trim()) errors.push(`${label} must be non-empty text.`);
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function unique(values) {
  return [...new Set(values)];
}
