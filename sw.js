const CACHE_PREFIX = "facts-pwa-";
const CACHE_NAME = `${CACHE_PREFIX}v7`;
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./src/styles.css",
  "./src/experience.css",
  "./src/enhancements.css",
  "./src/app.js",
  "./src/runtime-data.js",
  "./src/ui-enhancements.js",
  "./src/card-render-state.js",
  "./src/topic-expansion.js",
  "./src/deck-schema.js",
  "./src/learning-engine.js",
  "./src/card-design.js",
  "./src/offline-storage.js",
  "./data/decks.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(CORE_ASSETS.map((asset) => cacheAsset(cache, asset)));
    try {
      const response = await fetch("./data/decks.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`Catalog returned ${response.status}.`);
      const catalog = await response.json();
      if (Array.isArray(catalog.decks)) {
        await Promise.allSettled(catalog.decks.map((deck) => cacheAsset(cache, `./data/${encodeURIComponent(deck)}.json`)));
      }
    } catch (error) {
      console.warn("Deck pre-cache was incomplete.", error);
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)));
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.headers.has("range")) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(event));
    return;
  }
  event.respondWith(staleWhileRevalidate(event));
});

async function cacheAsset(cache, url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`${url} returned ${response.status}.`);
  await cache.put(url, response);
}

async function networkFirstNavigation(event) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const preload = await event.preloadResponse;
    const response = preload ?? await fetch(event.request);
    if (response?.ok) {
      await cache.put(event.request, response.clone());
      return response;
    }
    const cached = await cache.match(event.request) ?? await cache.match("./index.html") ?? await cache.match("./");
    return cached ?? response ?? offlineResponse();
  } catch {
    return await cache.match(event.request) ?? await cache.match("./index.html") ?? await cache.match("./") ?? offlineResponse();
  }
}

async function staleWhileRevalidate(event) {
  const request = event.request;
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(networkPromise.then(() => undefined));
    return cached;
  }
  return await networkPromise ?? offlineResponse();
}

function offlineResponse() {
  return new Response("Offline", {
    status: 503,
    statusText: "Offline",
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
