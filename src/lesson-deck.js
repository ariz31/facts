const TYPE_PATTERN = Object.freeze([
  "concept", "concept", "fact", "question", "concept", "code", "steps", "concept", "checklist", "concept",
  "fact", "question", "concept", "code", "steps", "concept", "checklist", "fact", "question", "concept",
]);
const LESSON_STYLES = new Set(["agent", "technical"]);

export function isLessonFragmentManifest(value) {
  return Boolean(
    isRecord(value)
    && value.format === "lesson-fragments-v1"
    && typeof value.id === "string"
    && typeof value.cardPrefix === "string"
    && Array.isArray(value.fragments)
    && value.fragments.length
    && (value.lessonStyle === undefined || LESSON_STYLES.has(value.lessonStyle)),
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
  const lessonStyle = manifest.lessonStyle ?? "agent";

  sourcePaths.forEach(({ fragment, sourceName }) => {
    const normalized = normalizeFragment(fragment, sourceName);
    const cardIds = [];
    let codeIndex = 0;

    normalized.lessons.forEach((lesson, lessonIndex) => {
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
        tags: [manifest.id, normalized.id, slug(lesson.title)],
        difficulty,
        pathIds: [normalized.id],
      };

      if (type === "question") {
        common.question = buildQuestion(lesson, lessonStyle);
      } else if (type === "code") {
        common.code = normalized.codeExamples[codeIndex++];
      } else if (type === "steps") {
        common.steps = buildSteps(lesson, lessonStyle);
      } else if (type === "checklist") {
        common.items = buildChecklist(lesson, lessonStyle);
      }

      cards.push(common);
      cardIds.push(id);
      sequence += 1;
    });

    paths.push({ id: normalized.id, title: normalized.title, description: normalized.description, cardIds });
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

function normalizeFragment(fragment, sourceName) {
  if (!isRecord(fragment)) throw new Error(`${sourceName} must contain an object.`);
  if (typeof fragment.id !== "string" || !fragment.id) throw new Error(`${sourceName} is missing an id.`);
  if (typeof fragment.title !== "string" || !fragment.title) throw new Error(`${sourceName} is missing a title.`);
  if (typeof fragment.description !== "string" || !fragment.description) throw new Error(`${sourceName} is missing a description.`);

  const rawLessons = Array.isArray(fragment.lessons)
    ? fragment.lessons
    : expandTopics(fragment.topics, sourceName);
  if (!Array.isArray(rawLessons) || rawLessons.length !== TYPE_PATTERN.length) {
    throw new Error(`${sourceName} must contain exactly ${TYPE_PATTERN.length} lessons or 10 compact topics.`);
  }
  if (!Array.isArray(fragment.codeExamples) || fragment.codeExamples.length !== 2) {
    throw new Error(`${sourceName} must contain exactly 2 code examples.`);
  }

  const lessons = rawLessons.map((lesson) => normalizeLesson(lesson, sourceName));
  const codeExamples = fragment.codeExamples.map((example) => normalizeCodeExample(example, sourceName));
  return { ...fragment, lessons, codeExamples };
}

function expandTopics(topics, sourceName) {
  if (!Array.isArray(topics) || topics.length !== 10) {
    throw new Error(`${sourceName} must contain exactly 10 compact topics when lessons are omitted.`);
  }
  return topics.flatMap((topic) => {
    const base = normalizeLesson(topic, sourceName);
    return [
      base,
      {
        title: `${base.title}: application`,
        principle: `Correct application of ${base.title} requires preserving its semantics under real data, errors, boundary conditions, and runtime constraints.`,
        practice: `${base.practice} Then verify at least one boundary or failure case with the relevant browser, runtime, test, or diagnostic tooling.`,
      },
    ];
  });
}

function normalizeLesson(lesson, sourceName) {
  const normalized = Array.isArray(lesson)
    ? { title: lesson[0], principle: lesson[1], practice: lesson[2] }
    : lesson;
  if (!isRecord(normalized) || !normalized.title?.trim() || !normalized.principle?.trim() || !normalized.practice?.trim()) {
    throw new Error(`${sourceName} contains an incomplete lesson.`);
  }
  return normalized;
}

function normalizeCodeExample(example, sourceName) {
  const normalized = Array.isArray(example)
    ? { language: example[0], snippet: example[1] }
    : example;
  if (!isRecord(normalized) || !normalized.language?.trim() || !normalized.snippet?.trim()) {
    throw new Error(`${sourceName} contains an incomplete code example.`);
  }
  return normalized;
}

function buildQuestion(lesson, lessonStyle) {
  const agentDistractors = [
    "Ask the model to make a broad change immediately and accept the result if it looks plausible.",
    "Skip repository evidence and rely on remembered framework behavior.",
    "Remove validation or review steps so iteration stays as fast as possible.",
  ];
  const technicalDistractors = [
    "Choose a superficially similar technique without checking its semantics, constraints, or compatibility.",
    "Remove validation and failure handling so only the happy path remains.",
    "Treat visual appearance or a successful build as sufficient proof that the behavior is correct.",
  ];
  return {
    options: [lesson.practice, ...(lessonStyle === "technical" ? technicalDistractors : agentDistractors)],
    answerIndex: 0,
    explanation: `The disciplined approach is: ${lesson.practice} The underlying principle is: ${lesson.principle}`,
  };
}

function buildSteps(lesson, lessonStyle) {
  if (lessonStyle === "technical") {
    return [
      `Define the intended behavior and constraints for ${lesson.title.toLowerCase()}.`,
      "Inspect the relevant standards, documentation, existing implementation, and tests before changing code.",
      `Apply the principle: ${lesson.principle}`,
      `Implement the smallest coherent solution: ${lesson.practice}`,
      "Exercise success, failure, boundary, accessibility, security, and performance cases that are relevant to the change.",
      "Review the final behavior and diff for maintainability, compatibility, and unintended side effects.",
    ];
  }
  return [
    `State the specific objective related to ${lesson.title.toLowerCase()}.`,
    "Inspect authoritative code, configuration, tests, or runtime evidence before editing.",
    `Apply the principle: ${lesson.principle}`,
    `Implement the smallest coherent change: ${lesson.practice}`,
    "Run focused validation capable of falsifying the change.",
    "Inspect the final diff for scope, regressions, and hidden assumptions.",
  ];
}

function buildChecklist(lesson, lessonStyle) {
  if (lessonStyle === "technical") {
    return [
      `I can explain the semantics and constraints of ${lesson.title.toLowerCase()}.`,
      "I checked authoritative documentation and the actual implementation instead of relying on assumptions.",
      `I can apply this practice correctly: ${lesson.practice}`,
      "I considered relevant failure, boundary, accessibility, security, compatibility, and performance behavior.",
      "I validated the result with appropriate automated or manual evidence.",
      "I can explain, debug, and maintain the resulting implementation.",
    ];
  }
  return [
    `I can explain why ${lesson.title.toLowerCase()} matters.`,
    "I checked real repository or runtime evidence instead of relying on model confidence.",
    `I applied this practice: ${lesson.practice}`,
    "I considered relevant failure, security, and edge behavior.",
    "I ran appropriate validation and reviewed the final diff.",
    "I can explain and maintain the result without depending on the original AI session.",
  ];
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || "lesson";
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
