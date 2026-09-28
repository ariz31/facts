// Shared generation contract for the AI-import workflow. Legacy authored decks are not generated here.
export const CARD_COUNT_OPTIONS = Object.freeze([25, 50, 75, 100]);
export const MAX_GENERATED_CARDS = 100;

const AUDIENCES = new Set(["Beginner", "Intermediate", "Advanced", "Mixed levels"]);
const NORMALIZE = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
const BOILERPLATE = [
  /correct application of .+ requires preserving its semantics/i,
  /this concept belongs to the .+ reference foundation/i,
  /then verify at least one boundary or failure case with the relevant/i,
  /the disciplined approach is:/i,
];

export function makeCardGenerationPrompt(topic, audience = "Mixed levels", count = MAX_GENERATED_CARDS) {
  const subject = typeof topic === "string" ? topic.trim() : "";
  if (!subject || subject.length > 180) throw new Error("Enter a topic of up to 180 characters.");
  if (!AUDIENCES.has(audience)) throw new Error("Choose a supported learner audience.");
  if (!Number.isInteger(count) || count < 1 || count > MAX_GENERATED_CARDS) {
    throw new Error(`A generated topic must contain between 1 and ${MAX_GENERATED_CARDS} cards.`);
  }

  return `You are an expert subject-matter educator and instructional designer. Author a rigorous, accurate, progressive learning-card curriculum for the topic ${JSON.stringify(subject)}. Target audience: ${audience}.

CARD LIMIT: Produce exactly ${count} substantial, NON-REPETITIVE cards for this topic. NEVER exceed ${MAX_GENERATED_CARDS} cards in one topic/deck. Quality, conceptual coverage, and progression take priority over filler. For a larger subject, scope this deck to a coherent part and make any additional parts separate topics (each up to ${MAX_GENERATED_CARDS} cards).

PLAN THE TEACHING SEQUENCE BEFORE WRITING THE JSON (do not output the plan):
1. Identify the topic-specific prerequisite concepts and assess the audience; do not blindly apply the same outline to every subject.
2. Divide the material into 3–8 logically ordered guided paths with explicit, distinct learning outcomes.
3. Order the global card sequence as a dependency ladder: essential terminology and intuition → underlying relationships and assumptions → methods or processes → concrete worked examples → boundary cases and misconceptions → authentic application and synthesis. Adapt this order where the discipline requires it.
4. Each card teaches or tests ONE identifiable new idea, builds on knowledge already introduced, and prepares the learner for what follows. Make transitions coherent; do not introduce undefined jargon or require future cards to understand an earlier one.
5. Ensure genuinely broad and useful coverage within the scope. For statistics, for example, introduce data, populations/samples, variables and distributions before depending on their meanings in probability, estimation or hypothesis tests. Choose the correct dependency order for the ACTUAL requested subject.

FRONT/BACK CARD WRITING STANDARD:
- title: short, specific concept or skill; avoid headings such as "More facts" or "Application" without specificity.
- prompt: the FRONT of the card. Pose a clear retrieval question, decision, scenario, calculation, prediction, code-reading task or concise conceptual cue. Do not simply recite the answer.
- content: the REVEALED answer/explanation. Directly answer the prompt with accurate, topic-specific teaching, the underlying WHY, and an illuminating example or counterexample when useful. Keep it readable on mobile: concise paragraphs, not walls of text. Use correct units, conditions and terminology.
- Never copy the prompt into content, append the same sentence to make an answer look longer, or produce cards that merely paraphrase each other. No boilerplate such as "Correct application of X requires preserving its semantics..." or generic "verify boundary conditions" padding.
- The front and back must provide DIFFERENT value: a meaningful question/cue and a meaningful answer. The title, prompt and content should not be three variants of the same sentence.
- Vary cognitive demand: definitions, contrasts, cause/effect, interpretations, worked calculations or traces, realistic scenarios, misconceptions, edge cases and integrated synthesis as appropriate. Do not force irrelevant card types.
- For numeric, scientific and engineering material, state assumptions, show intermediate reasoning and correct units; check the result. For code, use realistic runnable/minimal snippets and explain the behavior; never invent API names.
- For question cards, write ONE unambiguously correct answer, plausible topic-specific distractors (not silly or universally generic wrong choices), a valid answerIndex and an explanation that teaches why the correct choice holds.
- For steps and checklists, write ACTUAL domain-specific procedures or verification criteria, not recycled universal process text. If the source material cannot support a meaningful procedure, use a different card type.
- Avoid unsupported claims and false precision; mark context-dependent claims and their limitations.

SCHEMA AND INTEGRITY:
Return ONLY one valid JSON deck object, without Markdown fences, commentary, placeholders or trailing commas.
Required top-level keys: id (unique lowercase kebab-case), title, category, description, estimatedMinutes (positive integer), paths (array), cards (array).
Each path: id (lowercase kebab-case), title, description and cardIds (ordered card ID array).
Every card: id (lowercase kebab-case), sequence (1-based consecutive integer), type, title, prompt, content (empty string permitted ONLY for question), tags (non-empty array of relevant tags), difficulty (beginner/intermediate/advanced) and pathIds (non-empty array).
Allowed types: concept, fact, question, code, steps, checklist.
Additional type fields: question requires question.options (2–12 unique choices), question.answerIndex (zero-based), question.explanation; code requires code.language and code.snippet; steps requires a non-empty steps array; checklist requires a non-empty items array.
Every card must appear in at least one path; every path.cardIds entry must point to an existing card that lists that path in its pathIds. Sequence numbers and card IDs must be unique. Within each path, cardIds MUST follow ascending global sequence; arrange paths in teaching order. A learner studying the full deck must not encounter prerequisites after dependent concepts.

FINAL SELF-AUDIT BEFORE RETURNING JSON:
- Exactly ${count} cards; no more than ${MAX_GENERATED_CARDS}; correct schema and valid JSON.
- Every front asks or cues something specific and every revealed answer adds knowledge rather than repeating the front.
- No duplicate titles, prompts, answers, near-duplicate explanations or generic templated application cards.
- Prerequisites precede applications; each path progresses from fundamentals toward an authentic outcome.
- Check technical accuracy, realistic examples, questions and answer keys, bidirectional path references, contiguous sequences and sorted path cardIds.
- Revise any card that cannot pass these checks before producing the output.`;
}

// Conservative, deterministic checks. Semantic and factual correctness still require editorial review.
export function validateGeneratedDeckQuality(deck) {
  if (!deck || !Array.isArray(deck.cards) || !Array.isArray(deck.paths)) return [];
  const errors = [];
  const usedTitles = new Set();
  const usedPrompts = new Set();
  const usedAnswers = new Set();
  const sequence = new Map(deck.cards.filter((card) => card && typeof card.id === "string").map((card) => [card.id, card.sequence]));
  for (const card of deck.cards) {
    if (!card || typeof card !== "object") continue;
    const id = card.id ?? "unknown";
    const title = NORMALIZE(card.title);
    const front = NORMALIZE(card.prompt);
    const answer = NORMALIZE(card.content);
    if (title && usedTitles.has(title)) errors.push(`Card ${id} repeats another card title.`);
    if (front && usedPrompts.has(front)) errors.push(`Card ${id} repeats another card prompt.`);
    if (card.type !== "question" && answer && usedAnswers.has(answer)) errors.push(`Card ${id} repeats another card answer.`);
    if (title) usedTitles.add(title);
    if (front) usedPrompts.add(front);
    if (card.type !== "question" && answer) usedAnswers.add(answer);
    if (card.type !== "question" && front && answer && (front === answer || (front.length >= 35 && answer.startsWith(front)))) {
      errors.push(`Card ${id} repeats the front in the revealed answer; replace it with new explanatory content.`);
    }
    if ([card.prompt, card.content].some((value) => typeof value === "string" && BOILERPLATE.some((pattern) => pattern.test(value)))) {
      errors.push(`Card ${id} contains generic templated filler instead of topic-specific teaching.`);
    }
    if (card.type === "question" && Array.isArray(card.question?.options)) {
      const options = card.question.options.map(NORMALIZE);
      if (new Set(options).size !== options.length) errors.push(`Question ${id} repeats an answer option.`);
    }
  }
  for (const path of deck.paths) {
    if (!path || !Array.isArray(path.cardIds)) continue;
    let last = 0;
    for (const id of path.cardIds) {
      const current = sequence.get(id);
      if (!Number.isInteger(current)) continue; // The strict schema reports missing and invalid references.
      if (current <= last) {
        errors.push(`Path ${path.id ?? "unknown"} must list cards in ascending teaching sequence.`);
        break;
      }
      last = current;
    }
  }
  return [...new Set(errors)];
}
