const TYPE_PATTERN = Object.freeze([
  "concept", "concept", "fact", "question", "concept", "code", "steps", "concept", "checklist", "concept",
  "fact", "question", "concept", "code", "steps", "concept", "checklist", "fact", "question", "concept",
]);

export function isLessonFragmentManifest(value) {
  return Boolean(
    isRecord(value)
    && value.format === "lesson-fragments-v1"
    && typeof value.id === "string"
    && typeof value.cardPrefix === "string"
    && Array.isArray(value.fragments)
    && value.fragments.length,
  );
}

export function assembleLessonDeck(manifest, fragments) {
  if (!isLessonFragmentManifest(manifest)) throw new Error("Invalid lesson-fragment deck manifest.");
  if (!Array.isArray(fragments) || fragments.length !== manifest.fragments.length) {
    throw new Error("Lesson-fragment file count does not match the deck manifest.");
  }

  const sourcePaths = [];
  fragments.forEach((fragmentFile, fileIndex) => {
    const contained = Array.isArray(fragmentFile?.paths) ? fragmentFile.paths : [fragmentFile];
    contained.forEach((fragment, pathIndex) => sourcePaths.push({
      fragment,
      sourceName: contained.length === 1 ? manifest.fragments[fileIndex] : `${manifest.fragments[fileIndex]}#${pathIndex + 1}`,
    }));
  });

  const cards = [];
  const paths = [];
  let sequence = 1;

  sourcePaths.forEach(({ fragment, sourceName }) => {
    validateFragment(fragment, sourceName);
    const cardIds = [];
    let codeIndex = 0;

    fragment.lessons.forEach((lesson, lessonIndex) => {
      const type = TYPE_PATTERN[lessonIndex];
      const id = `${manifest.cardPrefix}-${String(sequence).padStart(3, "0")}`;
      const difficulty = lessonIndex < 7 ? "beginner" : lessonIndex < 14 ? "intermediate" : "advanced";
      const common = {
        id,
        sequence,
        type,
        title: lesson.title,
        prompt: lesson.principle,
        content: type === "question" ? "" : `${lesson.principle} ${lesson.practice}`,
        tags: [manifest.id, fragment.id, slug(lesson.title)],
        difficulty,
        pathIds: [fragment.id],
      };

      if (type === "question") {
        common.question = {
          options: [
            lesson.practice,
            "Ask the model to make a broad change immediately and accept the result if it looks plausible.",
            "Skip repository evidence and rely on remembered framework behavior.",
            "Remove validation or review steps so iteration stays as fast as possible.",
          ],
          answerIndex: 0,
          explanation: `The disciplined approach is: ${lesson.practice} The underlying principle is: ${lesson.principle}`,
        };
      } else if (type === "code") {
        common.code = fragment.codeExamples[codeIndex++];
      } else if (type === "steps") {
        common.steps = [
          `State the specific objective related to ${lesson.title.toLowerCase()}.`,
          "Inspect authoritative code, configuration, tests, or runtime evidence before editing.",
          `Apply the principle: ${lesson.principle}`,
          `Implement the smallest coherent change: ${lesson.practice}`,
          "Run focused validation capable of falsifying the change.",
          "Inspect the final diff for scope, regressions, and hidden assumptions.",
        ];
      } else if (type === "checklist") {
        common.items = [
          `I can explain why ${lesson.title.toLowerCase()} matters.`,
          "I checked real repository or runtime evidence instead of relying on model confidence.",
          `I applied this practice: ${lesson.practice}`,
          "I considered relevant failure, security, and edge behavior.",
          "I ran appropriate validation and reviewed the final diff.",
          "I can explain and maintain the result without depending on the original AI session.",
        ];
      }

      cards.push(common);
      cardIds.push(id);
      sequence += 1;
    });

    paths.push({
      id: fragment.id,
      title: fragment.title,
      description: fragment.description,
      cardIds,
    });
  });

  return {
    id: manifest.id,
    title: manifest.title,
    category: manifest.category,
    description: manifest.description,
    estimatedMinutes: manifest.estimatedMinutes,
    paths,
    cards,
  };
}

function validateFragment(fragment, sourceName) {
  if (!isRecord(fragment)) throw new Error(`${sourceName} must contain an object.`);
  if (typeof fragment.id !== "string" || !fragment.id) throw new Error(`${sourceName} is missing an id.`);
  if (typeof fragment.title !== "string" || !fragment.title) throw new Error(`${sourceName} is missing a title.`);
  if (typeof fragment.description !== "string" || !fragment.description) throw new Error(`${sourceName} is missing a description.`);
  if (!Array.isArray(fragment.lessons) || fragment.lessons.length !== TYPE_PATTERN.length) {
    throw new Error(`${sourceName} must contain exactly ${TYPE_PATTERN.length} lessons.`);
  }
  if (!Array.isArray(fragment.codeExamples) || fragment.codeExamples.length !== 2) {
    throw new Error(`${sourceName} must contain exactly 2 code examples.`);
  }
  for (const lesson of fragment.lessons) {
    if (!isRecord(lesson) || !lesson.title?.trim() || !lesson.principle?.trim() || !lesson.practice?.trim()) {
      throw new Error(`${sourceName} contains an incomplete lesson.`);
    }
  }
  for (const example of fragment.codeExamples) {
    if (!isRecord(example) || !example.language?.trim() || !example.snippet?.trim()) {
      throw new Error(`${sourceName} contains an incomplete code example.`);
    }
  }
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || "lesson";
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
