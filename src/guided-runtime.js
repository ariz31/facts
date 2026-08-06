import { BUILT_IN_DECK_IDS } from "./deck-schema.js";
import { expandGuidedContent, validateGuidedContentSpec } from "./guided-content-expansion.js";

const BUILT_INS = new Set(BUILT_IN_DECK_IDS);
const specPromises = new Map();

if (typeof window !== "undefined" && typeof document !== "undefined") installGuidedContentAdapter();

export function installGuidedContentAdapter() {
  if (window.__factsGuidedContentInstalled || typeof window.fetch !== "function") return;
  window.__factsGuidedContentInstalled = true;
  const innerFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const url = resolveUrl(input);
    if (!url || url.origin !== window.location.origin) return innerFetch(input, init);

    const match = url.pathname.match(/\/data\/([^/]+)\.json$/);
    if (!match) return innerFetch(input, init);

    const deckId = decodeURIComponent(match[1]);
    if (!BUILT_INS.has(deckId)) return innerFetch(input, init);

    const response = await innerFetch(input, init);
    if (!response.ok) return response;

    try {
      const [deck, spec] = await Promise.all([
        response.clone().json(),
        loadGuidedSpec(deckId, innerFetch),
      ]);
      return spec ? jsonResponse(expandGuidedContent(deck, spec), response) : response;
    } catch (error) {
      console.warn(`Unable to apply guided content for ${deckId}.`, error);
      return response;
    }
  };
}

export async function loadGuidedSpec(deckId, fetcher = globalThis.fetch) {
  if (!BUILT_INS.has(deckId)) return null;
  if (specPromises.has(deckId)) return specPromises.get(deckId);

  const promise = (async () => {
    if (typeof fetcher !== "function") throw new Error("Fetch is unavailable.");
    const response = await fetcher(`./data/guided/${encodeURIComponent(deckId)}.json`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Guided catalog returned ${response.status}.`);
    const spec = await response.json();
    const errors = validateGuidedContentSpec(spec, { expectedDeckId: deckId });
    if (errors.length) throw new Error(errors.join(" "));
    return spec;
  })().catch((error) => {
    specPromises.delete(deckId);
    throw error;
  });

  specPromises.set(deckId, promise);
  return promise;
}

function resolveUrl(input) {
  try {
    const value = typeof input === "string" || input instanceof URL ? String(input) : input?.url;
    return value ? new URL(value, window.location.href) : null;
  } catch {
    return null;
  }
}

function jsonResponse(value, source) {
  const headers = new Headers(source.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  for (const name of ["Content-Length", "Content-Encoding", "ETag", "Last-Modified"]) headers.delete(name);
  return new Response(JSON.stringify(value), {
    status: source.status,
    statusText: source.statusText,
    headers,
  });
}
