// Browser-native hash routing: stable on static hosts, reloadable and offline.
// One deck ID is one MAIN topic; guided paths are SUBTOPICS. Keep old aliases
// whenever IDs move so published links continue to resolve after migrations.
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MODES = new Set(["sequential", "random"]);

export const LEGACY_TOPIC_ROUTES = Object.freeze({
  "vibe-coding-agentic": { deckId: "vibe-coding", firstSubtopicId: "planning-decomposition" },
  "vibe-coding-application": { deckId: "vibe-coding", firstSubtopicId: "frontend-ux" },
  "vibe-coding-quality": { deckId: "vibe-coding", firstSubtopicId: "debugging" },
  "vibe-coding-production": { deckId: "vibe-coding", firstSubtopicId: "dev-environments" },
});

// Add future renames here instead of breaking shared/bookmarked routes.
// Keys must be scoped by the CURRENT canonical parent ID.
export const SUBTOPIC_ROUTE_ALIASES = Object.freeze({
  "vibe-coding": Object.freeze({}),
});
export const CARD_ROUTE_ALIASES = Object.freeze({
  "vibe-coding": Object.freeze({}),
});

const validId = (value) => typeof value === "string" && SLUG.test(value) && value.length <= 180;
const fromUrl = (part) => {
  try {
    const value = decodeURIComponent(part);
    return validId(value) ? value : null;
  } catch {
    return null;
  }
};

export function parseRoute(hash = "") {
  const raw = typeof hash === "string" ? hash.replace(/^#/, "") : "";
  const [pathname, search = ""] = raw.split("?", 2);
  if (pathname.length > 1000 || search.length > 300) return { view: "topics" };
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0 || (parts.length === 1 && parts[0] === "topics")) return { view: "topics" };
  if (parts[0] !== "topic" || ![2, 4, 6].includes(parts.length)) return { view: "topics" };
  const deckId = fromUrl(parts[1]);
  if (!deckId) return { view: "topics" };
  if (parts.length === 2) return { view: "paths", deckId };
  if (parts[2] !== "subtopic") return { view: "topics" };
  const pathId = fromUrl(parts[3]);
  if (!pathId) return { view: "topics" };
  if (parts.length === 4) return { view: "ready", deckId, pathId };
  if (parts[4] !== "card") return { view: "topics" };
  const cardId = fromUrl(parts[5]);
  if (!cardId) return { view: "topics" };
  const requestedMode = new URLSearchParams(search).get("mode");
  return { view: "study", deckId, pathId, cardId, mode: MODES.has(requestedMode) ? requestedMode : "sequential" };
}

function resolveAlias(aliasTable, id) {
  if (!validId(id)) return null;
  let current = id;
  const seen = new Set();
  while (Object.hasOwn(aliasTable ?? {}, current)) {
    if (seen.has(current)) return null; // A mistaken redirect cycle fails safely.
    seen.add(current);
    current = aliasTable[current];
    if (!validId(current)) return null;
  }
  return current;
}

export function resolveRoute(requested, decks = [], {
  topicAliases = LEGACY_TOPIC_ROUTES,
  subtopicAliases = SUBTOPIC_ROUTE_ALIASES,
  cardAliases = CARD_ROUTE_ALIASES,
} = {}) {
  if (!requested || requested.view === "topics") return { view: "topics" };
  const legacy = Object.hasOwn(topicAliases, requested.deckId) ? topicAliases[requested.deckId] : null;
  const deckId = legacy?.deckId ?? requested.deckId;
  const deck = Array.isArray(decks) ? decks.find((item) => item?.id === deckId) : null;
  if (!deck || !Array.isArray(deck.paths) || !Array.isArray(deck.cards)) return { view: "topics" };

  if (requested.view === "paths") {
    const first = legacy?.firstSubtopicId;
    return first && deck.paths.some((p) => p.id === first)
      ? { view: "ready", deckId, pathId: first }
      : { view: "paths", deckId };
  }

  const requestedPath = requested.pathId;
  const pathId = requestedPath === "all"
    ? "all"
    : resolveAlias(subtopicAliases[deckId], requestedPath);
  const path = pathId === "all" ? null : deck.paths.find((candidate) => candidate?.id === pathId);
  if (pathId !== "all" && !path) return { view: "paths", deckId };
  const ready = { view: "ready", deckId, pathId };
  if (requested.view !== "study") return ready;

  const cardId = resolveAlias(cardAliases[deckId], requested.cardId);
  const card = deck.cards.find((candidate) => candidate?.id === cardId);
  // A URL cannot jump into a card outside the selected subtopic.
  if (!card || (path && !path.cardIds?.includes(card.id))) return ready;
  return { view: "study", deckId, pathId, cardId, mode: MODES.has(requested.mode) ? requested.mode : "sequential" };
}

export function formatRoute(route) {
  if (!route || route.view === "topics") return "#/topics";
  if (!validId(route.deckId)) return "#/topics";
  const root = `#/topic/${route.deckId}`;
  if (route.view === "paths") return root;
  if (!validId(route.pathId)) return root;
  const path = `${root}/subtopic/${route.pathId}`;
  if (route.view !== "study") return path;
  if (!validId(route.cardId)) return path;
  const mode = route.mode === "random" ? "?mode=random" : "";
  return `${path}/card/${route.cardId}${mode}`;
}
