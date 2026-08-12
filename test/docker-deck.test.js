import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dockerDeck = JSON.parse(await readFile(new URL("../data/docker.json", import.meta.url), "utf8"));

const REQUIRED_PATHS = [
  "docker-foundations",
  "images-and-builds",
  "container-runtime",
  "storage-and-data",
  "docker-networking",
  "docker-compose",
  "development-workflows",
  "security-supply-chain",
  "production-operations",
  "troubleshooting",
  "project-node-api",
  "project-api-postgres",
];

const REQUIRED_CARD_TYPES = ["concept", "fact", "question", "code", "steps", "checklist"];
const REQUIRED_DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const REQUIRED_TAGS = ["dockerfile", "compose", "volume", "networking", "security", "production"];

test("Docker deck preserves comprehensive curriculum coverage", () => {
  assert.equal(dockerDeck.id, "docker");
  assert.ok(dockerDeck.cards.length >= 100, "Docker should remain a substantial authored curriculum");

  const pathIds = new Set(dockerDeck.paths.map((path) => path.id));
  for (const pathId of REQUIRED_PATHS) assert.ok(pathIds.has(pathId), `missing Docker path: ${pathId}`);

  const cardTypes = new Set(dockerDeck.cards.map((card) => card.type));
  for (const cardType of REQUIRED_CARD_TYPES) assert.ok(cardTypes.has(cardType), `missing Docker card type: ${cardType}`);

  const difficulties = new Set(dockerDeck.cards.map((card) => card.difficulty));
  for (const difficulty of REQUIRED_DIFFICULTIES) assert.ok(difficulties.has(difficulty), `missing Docker difficulty: ${difficulty}`);

  const tags = new Set(dockerDeck.cards.flatMap((card) => card.tags));
  for (const tag of REQUIRED_TAGS) assert.ok(tags.has(tag), `missing Docker coverage tag: ${tag}`);
});
