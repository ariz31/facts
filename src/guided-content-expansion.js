const CARDS_PER_PATH = 4;

export function expandGuidedContent(deck, spec) {
  if (!spec || spec.deckId !== deck?.id || !Array.isArray(spec.paths)) return deck;
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
    paths.push({
      id: path.id,
      title: path.title,
      description: path.description,
      cardIds,
    });

    const shared = {
      difficulty: path.difficulty,
      pathIds: [path.id],
      tags: [...path.tags, path.id, "guided"],
    };
    const sequence = (cardIndex) => startSequence + pathIndex * CARDS_PER_PATH + cardIndex;

    cards.push({
      id: cardIds[0],
      sequence: sequence(0),
      type: "concept",
      title: path.concept[0],
      prompt: path.concept[1],
      content: path.concept[2],
      ...shared,
    });
    cards.push({
      id: cardIds[1],
      sequence: sequence(1),
      type: "steps",
      title: path.workflow[0],
      prompt: path.workflow[1],
      content: path.workflow[2],
      steps: [...path.workflow[3]],
      ...shared,
    });
    cards.push({
      id: cardIds[2],
      sequence: sequence(2),
      type: "question",
      title: path.question[0],
      prompt: path.question[1],
      content: "",
      question: {
        options: [...path.question[2]],
        answerIndex: path.question[3],
        explanation: path.question[4],
      },
      ...shared,
    });
    cards.push({
      id: cardIds[3],
      sequence: sequence(3),
      type: "checklist",
      title: path.checklist[0],
      prompt: path.checklist[1],
      content: path.checklist[2],
      items: [...path.checklist[3]],
      ...shared,
    });
  });

  return {
    ...deck,
    estimatedMinutes: Number(deck.estimatedMinutes || 0) + Number(spec.estimatedMinutes || 0),
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
