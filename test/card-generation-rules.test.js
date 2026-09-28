import assert from "node:assert/strict";
import test from "node:test";
import {
  CARD_COUNT_OPTIONS, MAX_GENERATED_CARDS, makeCardGenerationPrompt, validateGeneratedDeckQuality,
} from "../src/card-generation-rules.js";

function deck() {
  return {
    paths: [{ id: "foundations", cardIds: ["intro", "followup"] }],
    cards: [
      { id: "intro", sequence: 1, type: "concept", title: "Population and sample",
        prompt: "How does a population differ from a sample?",
        content: "The population is the target group; a sample is the subset observed to estimate its properties." },
      { id: "followup", sequence: 2, type: "concept", title: "Sampling variation",
        prompt: "Why might two random samples yield different estimates?",
        content: "Random selection produces different sets of observations, so their calculated statistics naturally vary." },
    ],
  };
}

test("the prompt enforces the 100-card ceiling and progressive, non-echoing learning", () => {
  assert.deepEqual(CARD_COUNT_OPTIONS, [25, 50, 75, 100]);
  assert.equal(MAX_GENERATED_CARDS, 100);
  const prompt = makeCardGenerationPrompt("Fundamental statistics", "Beginner", 100);
  assert.match(prompt, /exactly 100 substantial/);
  assert.match(prompt, /dependency ladder/);
  assert.match(prompt, /FRONT\/BACK CARD WRITING STANDARD/);
  assert.match(prompt, /Do not simply recite the answer/);
  assert.match(prompt, /cardIds MUST follow ascending global sequence/);
  assert.match(prompt, /populations\/samples/);
  assert.doesNotMatch(prompt, /Create exactly 200 cards/);
});

test("prompt builder rejects counts outside the generated-topic ceiling", () => {
  assert.throws(() => makeCardGenerationPrompt("Statistics", "Beginner", 101), /between 1 and 100/);
  assert.throws(() => makeCardGenerationPrompt("Statistics", "Beginner", 0), /between 1 and 100/);
  assert.throws(() => makeCardGenerationPrompt("", "Beginner", 25), /Enter a topic/);
});

test("the quality gate accepts distinct question-and-answer cards in sequence", () => {
  assert.deepEqual(validateGeneratedDeckQuality(deck()), []);
});

test("the quality gate rejects a repeated or padded front on the back", () => {
  const sample = deck();
  sample.cards[0].content = sample.cards[0].prompt;
  assert.match(validateGeneratedDeckQuality(sample).join(" "), /repeats the front/);
  sample.cards[0].content = "Correct application of population and sample requires preserving its semantics under real data, errors, boundary conditions, and runtime constraints.";
  assert.match(validateGeneratedDeckQuality(sample).join(" "), /generic templated filler/);
});

test("the quality gate catches duplicate cards, reversed teaching paths, and repeated options", () => {
  const sample = deck();
  sample.cards[1].title = sample.cards[0].title;
  sample.cards[1].prompt = sample.cards[0].prompt;
  sample.paths[0].cardIds.reverse();
  sample.cards.push({
    id: "quiz", sequence: 3, type: "question", title: "Choose",
    prompt: "Which statistic varies across samples?", content: "",
    question: { options: ["Mean", "mean", "Median"], answerIndex: 0, explanation: "Sample means differ." },
  });
  sample.paths[0].cardIds.push("quiz");
  const errors = validateGeneratedDeckQuality(sample).join(" ");
  assert.match(errors, /repeats another card title/);
  assert.match(errors, /repeats another card prompt/);
  assert.match(errors, /ascending teaching sequence/);
  assert.match(errors, /repeats an answer option/);
});
