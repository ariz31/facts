import { expandDeck } from "./topic-expansion.js";
import {
  BUILT_IN_DECK_IDS,
  collectValidImportedDecks,
  IMPORT_LIMITS,
  parseDeckResult,
  validateDeck,
} from "./deck-schema.js";

const IMPORT_KEY = "facts-imported-decks-v1";
const BUILT_INS = new Set(BUILT_IN_DECK_IDS);

if (typeof window !== "undefined" && typeof document !== "undefined") {
  installDataFetchAdapter();
  whenDocumentReady(initializeImporter);
}

export function readImportedDecks(storage = globalThis.localStorage) {
  if (!storage) return { decks: Object.create(null), rejected: [] };
  try {
    const raw = storage.getItem(IMPORT_KEY);
    if (!raw) return { decks: Object.create(null), rejected: [] };
    if (raw.length > IMPORT_LIMITS.maximumJsonCharacters) {
      return { decks: Object.create(null), rejected: ["Imported deck storage exceeds the safe size limit."] };
    }
    return collectValidImportedDecks(JSON.parse(raw));
  } catch (error) {
    return { decks: Object.create(null), rejected: [`Imported deck storage could not be read: ${error.message}`] };
  }
}

export function writeImportedDecks(decks, storage = globalThis.localStorage) {
  if (!storage) throw new Error("Browser storage is unavailable.");
  const validated = collectValidImportedDecks(decks);
  if (validated.rejected.length) throw new Error(validated.rejected[0]);
  const entries = Object.entries(validated.decks);
  if (entries.length > IMPORT_LIMITS.maximumDecks) {
    throw new Error(`You can store at most ${IMPORT_LIMITS.maximumDecks} imported decks.`);
  }
  const serialized = JSON.stringify(Object.fromEntries(entries));
  if (serialized.length > IMPORT_LIMITS.maximumJsonCharacters) {
    throw new Error("Imported decks exceed the browser storage safety limit. Remove an older deck or import fewer cards.");
  }
  try {
    storage.setItem(IMPORT_KEY, serialized);
  } catch {
    throw new Error("The deck could not be saved because browser storage is unavailable or full.");
  }
}

function installDataFetchAdapter() {
  if (window.__factsDataFetchInstalled || typeof window.fetch !== "function") return;
  window.__factsDataFetchInstalled = true;
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

    if (url.origin !== window.location.origin) return nativeFetch(input, init);
    const { decks: imported } = readImportedDecks();

    if (url.pathname.endsWith("/data/decks.json")) {
      const response = await nativeFetch(input, init);
      if (!response.ok) return response;
      const catalog = await response.clone().json();
      const builtInNames = Array.isArray(catalog.decks) ? catalog.decks.filter((name) => BUILT_INS.has(name)) : BUILT_IN_DECK_IDS;
      catalog.decks = [...new Set([...builtInNames, ...Object.keys(imported)])];
      return jsonResponse(catalog, response);
    }

    const match = url.pathname.match(/\/data\/([^/]+)\.json$/);
    if (!match) return nativeFetch(input, init);

    const deckId = decodeURIComponent(match[1]);
    if (Object.hasOwn(imported, deckId)) return jsonResponse(imported[deckId]);

    const response = await nativeFetch(input, init);
    if (!response.ok || !BUILT_INS.has(deckId)) return response;
    const deck = await response.clone().json();
    return jsonResponse(expandDeck(deck), response);
  };
}

function jsonResponse(value, source) {
  const headers = new Headers(source?.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  for (const name of ["Content-Length", "Content-Encoding", "ETag", "Last-Modified"]) headers.delete(name);
  return new Response(JSON.stringify(value), {
    status: source?.status ?? 200,
    statusText: source?.statusText ?? "OK",
    headers,
  });
}

function whenDocumentReady(callback) {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback, { once: true });
  else queueMicrotask(callback);
}

function initializeImporter() {
  const actions = document.querySelector(".topbar-actions");
  if (!actions || document.querySelector("#open-ai-deck-import")) return;

  const button = document.createElement("button");
  button.id = "open-ai-deck-import";
  button.className = "secondary-button compact-button ai-import-button";
  button.type = "button";
  button.textContent = "AI deck import";
  button.setAttribute("aria-haspopup", "dialog");
  actions.insertBefore(button, document.querySelector("#open-design-studio"));

  const dialog = document.createElement("dialog");
  dialog.id = "ai-deck-dialog";
  dialog.className = "ai-deck-dialog";
  dialog.setAttribute("aria-labelledby", "ai-deck-title");
  dialog.innerHTML = `
    <div class="ai-deck-shell">
      <header class="ai-deck-header">
        <div>
          <span class="eyebrow">Model-agnostic content workflow</span>
          <h2 id="ai-deck-title">AI Deck Import</h2>
          <p>Create a strict prompt, use it in any AI model, then validate and import the returned JSON.</p>
        </div>
        <button class="icon-button" type="button" data-close-ai-dialog aria-label="Close AI deck import">×</button>
      </header>
      <div class="ai-deck-body">
        <section class="ai-prompt-section">
          <div class="ai-section-heading"><span>1</span><div><strong>Prepare the prompt</strong><small>Choose the requested deck scope.</small></div></div>
          <div class="ai-prompt-fields">
            <label>Topic<input id="ai-deck-topic" type="text" value="Civil engineering fundamentals" maxlength="180" /></label>
            <label>Audience<select id="ai-deck-audience"><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Mixed levels</option></select></label>
            <label>Cards<select id="ai-deck-count"><option value="25">25</option><option value="50">50</option><option value="100" selected>100</option><option value="200">200</option></select></label>
          </div>
          <label class="ai-textarea-label">Premade prompt<textarea id="ai-deck-prompt" readonly spellcheck="false"></textarea></label>
          <div class="ai-row-actions">
            <button id="refresh-ai-prompt" class="secondary-button" type="button">Refresh prompt</button>
            <button id="copy-ai-prompt" class="primary-button" type="button">Copy prompt</button>
          </div>
        </section>
        <section class="ai-result-section">
          <div class="ai-section-heading"><span>2</span><div><strong>Paste and import</strong><small>Only valid deck JSON is saved.</small></div></div>
          <label class="ai-textarea-label">AI model result<textarea id="ai-deck-result" placeholder="Paste the generated JSON here" spellcheck="false" maxlength="${IMPORT_LIMITS.maximumJsonCharacters}"></textarea></label>
          <p id="ai-import-status" class="ai-import-status" role="status" aria-live="polite"></p>
          <button id="validate-import-deck" class="primary-button" type="button">Validate and import deck</button>
          <div class="imported-decks-panel"><strong>Imported decks</strong><div id="imported-decks-list"></div></div>
        </section>
      </div>
    </div>`;
  document.body.append(dialog);

  button.addEventListener("click", () => {
    refreshPrompt();
    renderImportedDecks();
    dialog.showModal();
  });
  dialog.querySelector("[data-close-ai-dialog]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  for (const selector of ["#ai-deck-topic", "#ai-deck-audience", "#ai-deck-count"]) {
    const control = dialog.querySelector(selector);
    control.addEventListener("input", refreshPrompt);
    control.addEventListener("change", refreshPrompt);
  }
  dialog.querySelector("#refresh-ai-prompt").addEventListener("click", refreshPrompt);
  dialog.querySelector("#copy-ai-prompt").addEventListener("click", copyPrompt);
  dialog.querySelector("#validate-import-deck").addEventListener("click", importDeck);
  refreshPrompt();
  renderImportedDecks();
}

function refreshPrompt() {
  const topic = document.querySelector("#ai-deck-topic")?.value.trim() || "the requested topic";
  const audience = document.querySelector("#ai-deck-audience")?.value || "Mixed levels";
  const count = Number(document.querySelector("#ai-deck-count")?.value) || 100;
  const output = document.querySelector("#ai-deck-prompt");
  if (output) output.value = makePrompt(topic, audience, count);
}

function makePrompt(topic, audience, count) {
  return `Create a complete learning-card deck about "${topic}" for ${audience.toLowerCase()} learners.

Return ONLY valid JSON. Do not use Markdown fences, commentary, placeholders, trailing commas, or references outside the JSON.

Required top-level schema:
{
  "id": "lowercase-kebab-case",
  "title": "Human-readable title",
  "category": "Category",
  "description": "One concise paragraph",
  "estimatedMinutes": 120,
  "paths": [{ "id": "path-id", "title": "Path title", "description": "Purpose", "cardIds": ["card-id"] }],
  "cards": [CARD_OBJECT]
}

Create exactly ${count} cards and at least 3 guided paths. Every card must appear in at least one path. Every card.pathIds entry must point to a path containing that card id. Card ids, path ids, and sequence numbers must be unique. Sequence numbers must be consecutive starting at 1.

Allowed card types and required extra fields:
- concept or fact: content
- question: question.options, question.answerIndex, question.explanation
- code: content, code.language, code.snippet
- steps: content, non-empty steps
- checklist: content, non-empty items

Every card requires id, sequence, type, title, prompt, content, tags, difficulty, and pathIds. difficulty must be beginner, intermediate, or advanced.

Before returning JSON, verify exact card count, unique ids, consecutive sequences, valid answer indexes, required type-specific fields, and bidirectional path references.`;
}

async function copyPrompt() {
  const textarea = document.querySelector("#ai-deck-prompt");
  if (!textarea) return;
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(textarea.value);
    else if (!fallbackCopy(textarea)) throw new Error("Copy is not supported in this browser.");
    setImportStatus("Prompt copied. Paste it into your preferred AI model.", "success");
  } catch (error) {
    setImportStatus(error.message || "The prompt could not be copied. Select the text and copy it manually.", "error");
  }
}

function fallbackCopy(textarea) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  textarea.focus();
  textarea.select();
  const copied = Boolean(document.execCommand?.("copy"));
  textarea.setSelectionRange(start, end);
  return copied;
}

function importDeck() {
  const button = document.querySelector("#validate-import-deck");
  if (button?.disabled) return;
  if (button) button.disabled = true;

  try {
    const deck = parseDeckResult(document.querySelector("#ai-deck-result")?.value ?? "");
    const errors = validateDeck(deck);
    if (errors.length) throw new Error(errors.slice(0, 8).join(" "));
    const requestedCount = Number(document.querySelector("#ai-deck-count")?.value);
    if (Number.isInteger(requestedCount) && deck.cards.length !== requestedCount) {
      throw new Error(`The generated deck contains ${deck.cards.length} cards, but the prompt requested ${requestedCount}.`);
    }

    const { decks: imported } = readImportedDecks();
    const existed = Object.hasOwn(imported, deck.id);
    if (!existed && Object.keys(imported).length >= IMPORT_LIMITS.maximumDecks) {
      throw new Error(`Remove an imported deck before adding more than ${IMPORT_LIMITS.maximumDecks}.`);
    }
    imported[deck.id] = deck;
    writeImportedDecks(imported);
    setImportStatus(`${deck.title} ${existed ? "updated" : "imported"} with ${deck.cards.length} cards. Reloading…`, "success");
    renderImportedDecks();
    setTimeout(() => window.location.reload(), 450);
  } catch (error) {
    setImportStatus(error.message, "error");
    if (button) button.disabled = false;
  }
}

function renderImportedDecks() {
  const container = document.querySelector("#imported-decks-list");
  if (!container) return;
  const { decks: imported, rejected } = readImportedDecks();
  const decks = Object.values(imported);
  if (!decks.length) {
    container.innerHTML = `<p>${rejected.length ? "Stored deck data is invalid and was ignored." : "No custom decks imported yet."}</p>`;
    return;
  }

  container.innerHTML = decks.map((deck) => `
    <div class="imported-deck-row">
      <span><strong>${escapeHtml(deck.title)}</strong><small>${deck.cards.length} cards · ${escapeHtml(deck.id)}</small></span>
      <button type="button" data-delete-imported-deck="${escapeHtml(deck.id)}">Remove</button>
    </div>`).join("");
  container.querySelectorAll("[data-delete-imported-deck]").forEach((removeButton) => {
    removeButton.addEventListener("click", () => {
      try {
        const { decks: next } = readImportedDecks();
        delete next[removeButton.dataset.deleteImportedDeck];
        writeImportedDecks(next);
        removeButton.disabled = true;
        setImportStatus("Imported deck removed. Reloading…", "success");
        setTimeout(() => window.location.reload(), 250);
      } catch (error) {
        setImportStatus(error.message, "error");
      }
    });
  });
}

function setImportStatus(message, tone) {
  const status = document.querySelector("#ai-import-status");
  if (!status) return;
  status.textContent = message ?? "";
  status.className = `ai-import-status${tone ? ` is-${tone}` : ""}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
