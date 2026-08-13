import { assembleLessonDeck, isLessonFragmentManifest } from "./lesson-deck.js";

if (typeof window !== "undefined" && typeof window.fetch === "function") installLessonDeckFetchAdapter();

function installLessonDeckFetchAdapter() {
  if (window.__factsLessonDeckFetchInstalled) return;
  window.__factsLessonDeckFetchInstalled = true;
  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    let url;
    try {
      const requestUrl = typeof input === "string" || input instanceof URL ? String(input) : input?.url;
      if (!requestUrl) return nativeFetch(input, init);
      url = new URL(requestUrl, window.location.href);
    } catch {
      return nativeFetch(input, init);
    }

    if (url.origin !== window.location.origin || !url.pathname.endsWith("/data/vibe-coding.json")) {
      return nativeFetch(input, init);
    }

    const response = await nativeFetch(input, init);
    if (!response.ok) return response;
    const manifest = await response.clone().json();
    if (!isLessonFragmentManifest(manifest)) return response;

    const dataBase = new URL("./", url);
    const fragments = await Promise.all(manifest.fragments.map(async (fragmentPath) => {
      const fragmentResponse = await nativeFetch(new URL(fragmentPath, dataBase), init);
      if (!fragmentResponse.ok) throw new Error(`${fragmentPath} returned status ${fragmentResponse.status}`);
      return fragmentResponse.json();
    }));

    const deck = assembleLessonDeck(manifest, fragments);
    const headers = new Headers(response.headers);
    headers.set("Content-Type", "application/json; charset=utf-8");
    for (const name of ["Content-Length", "Content-Encoding", "ETag", "Last-Modified"]) headers.delete(name);
    return new Response(JSON.stringify(deck), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}
