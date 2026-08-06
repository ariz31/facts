import { expandDeck } from "./topic-expansion.js";

const IMPORT_KEY = "facts-imported-decks-v1";
const BUILT_INS = new Set([
  "frontend-programming", "backend-programming", "data-science", "statistics",
  "python-programming", "databases-sql", "machine-learning", "cybersecurity",
  "cloud-devops", "git-github",
]);
const TYPES = new Set(["concept", "fact", "question", "code", "steps", "checklist"]);
const nativeFetch = window.fetch.bind(window);

window.fetch = async (input, init) => {
  const requestUrl = typeof input === "string" ? input : input?.url;
  const url = new URL(requestUrl, window.location.href);
  const imported = readStore(IMPORT_KEY, {});

  if (url.pathname.endsWith("/data/decks.json")) {
    const response = await nativeFetch(input, init);
    if (!response.ok) return response;
    const catalog = await response.clone().json();
    catalog.decks = [...new Set([...(catalog.decks ?? []), ...Object.keys(imported)])];
    return jsonResponse(catalog, response);
  }

  const match = url.pathname.match(/\/data\/([^/]+)\.json$/);
  if (match) {
    const deckId = decodeURIComponent(match[1]);
    if (imported[deckId]) return jsonResponse(imported[deckId]);
    const response = await nativeFetch(input, init);
    if (!response.ok) return response;
    return jsonResponse(expandDeck(await response.clone().json()), response);
  }

  return nativeFetch(input, init);
};

setTimeout(initializeImporter, 0);

function jsonResponse(value, source) {
  const headers = new Headers(source?.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(value), {
    status: source?.status ?? 200,
    statusText: source?.statusText ?? "OK",
    headers,
  });
}

function readStore(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
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
  dialog.innerHTML = `
    <div class="ai-deck-shell">
      <header class="ai-deck-header">
        <div>
          <span class="eyebrow">Model-agnostic content workflow</span>
          <h2>AI Deck Import</h2>
          <p>Create a strict prompt, use it in any AI model, then validate and import the returned JSON.</p>
        </div>
        <button class="icon-button" type="button" data-close-ai-dialog aria-label="Close AI deck import">×</button>
      </header>
      <div class="ai-deck-body">
        <section class="ai-prompt-section">
          <div class="ai-section-heading"><span>1</span><div><strong>Prepare the prompt</strong><small>Choose the requested deck scope.</small></div></div>
          <div class="ai-prompt-fields">
            <label>Topic<input id="ai-deck-topic" type="text" value="Civil engineering fundamentals" /></label>
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
          <label class="ai-textarea-label">AI model result<textarea id="ai-deck-result" placeholder="Paste the generated JSON here" spellcheck="false"></textarea></label>
          <p id="ai-import-status" class="ai-import-status" role="status"></p>
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
  ["#ai-deck-topic", "#ai-deck-audience", "#ai-deck-count"].forEach((selector) => {
    dialog.querySelector(selector).addEventListener("input", refreshPrompt);
    dialog.querySelector(selector).addEventListener("change", refreshPrompt);
  });
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

Create exactly ${count} cards and at least 3 guided paths. Every card must appear in at least one path. Every card.pathIds entry must point to a path containing that card id. Card ids and sequence numbers must be unique. Sequence numbers must be consecutive starting at 1.

Allowed card types and required extra fields:
- concept or fact: content
- question: question.options, question.answerIndex, question.explanation
- code: content, code.language, code.snippet
- steps: content, non-empty steps
- checklist: content, non-empty items

Every card requires id, sequence, type, title, prompt, content, tags, difficulty, and pathIds. difficulty must be beginner, intermediate, or advanced.

Content requirements:
- Begin with definitions and foundational vocabulary.
- Progress toward mechanisms, examples, comparisons, common mistakes, procedures, and practical checks.
- Keep every card self-contained, accurate, and non-duplicative.
- Make questions unambiguous with one correct answer.
- Include enough informational material for both sequential study and reference use.

Before returning JSON, verify exact card count, unique ids, consecutive sequences, valid answer indexes, required type-specific fields, and bidirectional path references.`;
}

async function copyPrompt() {
  const textarea = document.querySelector("#ai-deck-prompt");
  const status = document.querySelector("#ai-import-status");
  if (!textarea) return;
  try {
    await navigator.clipboard.writeText(textarea.value);
  } catch {
    textarea.select();
    document.execCommand("copy");
  }
  status.textContent = "Prompt copied. Paste it into your preferred AI model.";
  status.className = "ai-import-status is-success";
}

function importDeck() {
  const status = document.querySelector("#ai-import-status");
  try {
    const deck = parseResult(document.querySelector("#ai-deck-result")?.value);
    const errors = validateDeck(deck);
    if (errors.length) throw new Error(errors.slice(0, 8).join(" "));
    const imported = readStore(IMPORT_KEY, {});
    imported[deck.id] = deck;
    writeStore(IMPORT_KEY, imported);
    status.textContent = `${deck.title} imported with ${deck.cards.length} cards. Reloading…`;
    status.className = "ai-import-status is-success";
    renderImportedDecks();
    setTimeout(() => window.location.reload(), 650);
  } catch (error) {
    status.textContent = error.message;
    status.className = "ai-import-status is-error";
  }
}

function parseResult(raw) {
  if (!raw?.trim()) throw new Error("Paste the AI-generated deck JSON first.");
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(cleaned);
    return parsed.deck ?? parsed;
  } catch (error) {
    throw new Error(`The pasted result is not valid JSON: ${error.message}`);
  }
}

function validateDeck(deck) {
  const errors = [];
  if (!deck || typeof deck !== "object" || Array.isArray(deck)) return ["The result must be one deck object."];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(deck.id ?? "")) errors.push("Deck id must use lowercase kebab-case.");
  if (BUILT_INS.has(deck.id)) errors.push("The deck id cannot replace a built-in topic.");
  if (!deck.title?.trim() || !deck.category?.trim() || !deck.description?.trim()) errors.push("Title, category, and description are required.");
  if (!Array.isArray(deck.cards) || !deck.cards.length) errors.push("The deck needs cards.");
  if (!Array.isArray(deck.paths) || !deck.paths.length) errors.push("The deck needs guided paths.");
  if (errors.length) return errors;

  const cardIds = new Set();
  const sequences = new Set();
  const pathIds = new Set(deck.paths.map((path) => path.id));
  for (const path of deck.paths) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path.id ?? "") || !path.title?.trim() || !path.description?.trim()) errors.push(`Invalid path ${path.id ?? "without id"}.`);
    if (!Array.isArray(path.cardIds) || !path.cardIds.length) errors.push(`Path ${path.id ?? "unknown"} needs cardIds.`);
  }

  for (const card of deck.cards) {
    if (!card.id || cardIds.has(card.id)) errors.push(`Duplicate or missing card id ${card.id ?? "unknown"}.`);
    cardIds.add(card.id);
    if (!Number.isInteger(card.sequence) || card.sequence < 1 || sequences.has(card.sequence)) errors.push(`Invalid sequence for ${card.id ?? "unknown"}.`);
    sequences.add(card.sequence);
    if (!TYPES.has(card.type)) errors.push(`Unsupported type for ${card.id ?? "unknown"}.`);
    if (!card.title?.trim() || !card.prompt?.trim() || !Array.isArray(card.tags) || !card.tags.length || !Array.isArray(card.pathIds) || !card.pathIds.length) errors.push(`Missing fields for ${card.id ?? "unknown"}.`);
    if (card.type === "question" && (!Array.isArray(card.question?.options) || card.question.options.length < 2 || !Number.isInteger(card.question.answerIndex) || card.question.answerIndex < 0 || card.question.answerIndex >= card.question.options.length || !card.question.explanation?.trim())) errors.push(`Invalid question data for ${card.id}.`);
    if (card.type === "code" && (!card.code?.language || !card.code?.snippet)) errors.push(`Code card ${card.id} needs language and snippet.`);
    if (card.type === "steps" && !card.steps?.length) errors.push(`Steps card ${card.id} needs steps.`);
    if (card.type === "checklist" && !card.items?.length) errors.push(`Checklist card ${card.id} needs items.`);
    for (const pathId of card.pathIds ?? []) if (!pathIds.has(pathId)) errors.push(`Card ${card.id} references missing path ${pathId}.`);
  }

  const ordered = [...sequences].sort((a, b) => a - b);
  if (ordered.some((value, index) => value !== index + 1)) errors.push("Sequences must be consecutive starting at 1.");
  for (const path of deck.paths) {
    for (const cardId of path.cardIds ?? []) {
      const card = deck.cards.find((candidate) => candidate.id === cardId);
      if (!card) errors.push(`Path ${path.id} references missing card ${cardId}.`);
      else if (!card.pathIds.includes(path.id)) errors.push(`Path ${path.id} and card ${cardId} are not linked both ways.`);
    }
  }
  for (const card of deck.cards) {
    for (const pathId of card.pathIds ?? []) {
      if (!deck.paths.find((path) => path.id === pathId)?.cardIds.includes(card.id)) errors.push(`Card ${card.id} and path ${pathId} are not linked both ways.`);
    }
  }
  return [...new Set(errors)];
}

function renderImportedDecks() {
  const container = document.querySelector("#imported-decks-list");
  if (!container) return;
  const imported = readStore(IMPORT_KEY, {});
  const decks = Object.values(imported);
  if (!decks.length) {
    container.innerHTML = "<p>No custom decks imported yet.</p>";
    return;
  }
  container.innerHTML = decks.map((deck) => `
    <div class="imported-deck-row">
      <span><strong>${escapeHtml(deck.title)}</strong><small>${deck.cards.length} cards · ${escapeHtml(deck.id)}</small></span>
      <button type="button" data-delete-imported-deck="${escapeHtml(deck.id)}">Remove</button>
    </div>`).join("");
  container.querySelectorAll("[data-delete-imported-deck]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = readStore(IMPORT_KEY, {});
      delete next[button.dataset.deleteImportedDeck];
      writeStore(IMPORT_KEY, next);
      renderImportedDecks();
    });
  });
}

function escapeHtml(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
