import {
  buildStudyOrder,
  calculateProgress,
  filterCards,
  nextIndex,
  previousIndex,
} from "./learning-engine.js";

const DATASETS = ["frontend-programming", "backend-programming"];
const STORAGE_KEY = "facts-learning-state-v1";

const elements = {
  deckSelect: document.querySelector("#deck-select"),
  pathSelect: document.querySelector("#path-select"),
  pathDescription: document.querySelector("#path-description"),
  typeFilter: document.querySelector("#type-filter"),
  searchInput: document.querySelector("#search-input"),
  deckHeader: document.querySelector("#deck-header"),
  focusView: document.querySelector("#focus-view"),
  overviewView: document.querySelector("#overview-view"),
  studyCard: document.querySelector("#study-card"),
  emptyState: document.querySelector("#empty-state"),
  cardActions: document.querySelector("#card-actions"),
  cardGrid: document.querySelector("#card-grid"),
  previousCard: document.querySelector("#previous-card"),
  nextCard: document.querySelector("#next-card"),
  markReview: document.querySelector("#mark-review"),
  markMastered: document.querySelector("#mark-mastered"),
  progressPercent: document.querySelector("#progress-percent"),
  progressBar: document.querySelector("#progress-bar"),
  masteredCount: document.querySelector("#mastered-count"),
  reviewCount: document.querySelector("#review-count"),
  resetProgress: document.querySelector("#reset-progress"),
  themeToggle: document.querySelector("#theme-toggle"),
};

const persisted = loadPersistedState();
const state = {
  decks: [],
  activeDeckId: persisted.activeDeckId ?? "frontend-programming",
  activePathId: "all",
  studyMode: persisted.studyMode ?? "sequential",
  displayMode: persisted.displayMode ?? "focus",
  cardType: "all",
  query: "",
  orderedCards: [],
  currentIndex: 0,
  revealedCardIds: new Set(),
  progress: persisted.progress ?? {},
  theme: persisted.theme ?? "system",
};

async function loadDecks() {
  const results = await Promise.all(
    DATASETS.map(async (name) => {
      const response = await fetch(`./data/${name}.json`);
      if (!response.ok) throw new Error(`Unable to load ${name}.json`);
      return response.json();
    }),
  );
  state.decks = results;
}

function activeDeck() {
  return state.decks.find((deck) => deck.id === state.activeDeckId) ?? state.decks[0];
}

function activeCard() {
  return state.orderedCards[state.currentIndex] ?? null;
}

function progressForDeck() {
  return state.progress[state.activeDeckId] ?? {};
}

function setProgress(cardId, status) {
  state.progress[state.activeDeckId] ??= {};
  const existing = state.progress[state.activeDeckId][cardId];
  if (existing === status) {
    delete state.progress[state.activeDeckId][cardId];
  } else {
    state.progress[state.activeDeckId][cardId] = status;
  }
  persistState();
  render();
}

function refreshOrder({ preserveCardId = null } = {}) {
  const deck = activeDeck();
  const visibleCards = filterCards(deck.cards, {
    pathId: state.activePathId,
    type: state.cardType,
    query: state.query,
  });

  state.orderedCards = buildStudyOrder(visibleCards, state.studyMode);
  const preservedIndex = preserveCardId
    ? state.orderedCards.findIndex((card) => card.id === preserveCardId)
    : -1;
  state.currentIndex = preservedIndex >= 0 ? preservedIndex : 0;
}

function createDeckOptions() {
  elements.deckSelect.replaceChildren(
    ...state.decks.map((deck) => new Option(deck.title, deck.id, false, deck.id === state.activeDeckId)),
  );
}

function createPathOptions() {
  const deck = activeDeck();
  const options = [new Option("All cards", "all")];
  for (const path of deck.paths) options.push(new Option(path.title, path.id));
  elements.pathSelect.replaceChildren(...options);
  elements.pathSelect.value = state.activePathId;
  updatePathDescription();
}

function updatePathDescription() {
  const deck = activeDeck();
  const path = deck.paths.find((item) => item.id === state.activePathId);
  elements.pathDescription.textContent = path?.description ?? "Study the complete topic in its designed order.";
}

function renderDeckHeader() {
  const deck = activeDeck();
  const completed = calculateProgress(deck.cards, progressForDeck());
  elements.deckHeader.innerHTML = `
    <div>
      <span class="eyebrow">${escapeHtml(deck.category)}</span>
      <h1>${escapeHtml(deck.title)}</h1>
      <p>${escapeHtml(deck.description)}</p>
    </div>
    <div class="deck-summary" aria-label="Topic summary">
      <span><strong>${deck.cards.length}</strong> cards</span>
      <span><strong>${deck.paths.length}</strong> paths</span>
      <span><strong>${deck.estimatedMinutes}</strong> min</span>
      <span><strong>${completed.percent}%</strong> mastered</span>
    </div>
  `;
}

function cardStatus(cardId) {
  return progressForDeck()[cardId] ?? "untouched";
}

function renderFocusCard() {
  const card = activeCard();
  const hasCards = Boolean(card);
  elements.emptyState.hidden = hasCards;
  elements.studyCard.hidden = !hasCards;
  elements.cardActions.hidden = !hasCards;
  if (!hasCards) return;

  const status = cardStatus(card.id);
  const revealed = state.revealedCardIds.has(card.id);
  elements.studyCard.className = `study-card card-type-${card.type} status-${status}`;
  elements.studyCard.dataset.cardId = card.id;
  elements.studyCard.innerHTML = `
    <div class="card-topline">
      <span class="card-type-label">${formatType(card.type)}</span>
      <span class="card-position">${state.currentIndex + 1} / ${state.orderedCards.length}</span>
    </div>
    <div class="card-heading">
      <div>
        <span class="difficulty">${escapeHtml(card.difficulty)}</span>
        <h2>${escapeHtml(card.title)}</h2>
      </div>
      <span class="status-pill">${formatStatus(status)}</span>
    </div>
    <p class="card-prompt">${escapeHtml(card.prompt)}</p>
    ${renderCardBody(card, revealed)}
    <div class="tag-row">${card.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
  `;

  bindDynamicCardEvents(card);
  elements.markReview.classList.toggle("is-selected", status === "review");
  elements.markMastered.classList.toggle("is-selected", status === "mastered");
}

function renderCardBody(card, revealed) {
  if (card.type === "question") return renderQuestion(card);
  if (card.type === "code") {
    return `
      <pre class="code-block"><code>${escapeHtml(card.code.snippet)}</code></pre>
      <button class="reveal-button" type="button" data-reveal-card>${revealed ? "Hide explanation" : "Explain this code"}</button>
      <div class="card-answer" ${revealed ? "" : "hidden"}>${formatText(card.content)}</div>
    `;
  }
  if (card.type === "steps") {
    return `
      <button class="reveal-button" type="button" data-reveal-card>${revealed ? "Hide steps" : "Show steps"}</button>
      <ol class="steps-list" ${revealed ? "" : "hidden"}>${card.steps
        .map((step) => `<li>${escapeHtml(step)}</li>`)
        .join("")}</ol>
      ${revealed && card.content ? `<div class="card-note">${formatText(card.content)}</div>` : ""}
    `;
  }
  if (card.type === "checklist") {
    return `
      <button class="reveal-button" type="button" data-reveal-card>${revealed ? "Hide checklist" : "Open checklist"}</button>
      <ul class="checklist" ${revealed ? "" : "hidden"}>${card.items
        .map((item) => `<li><span aria-hidden="true">✓</span>${escapeHtml(item)}</li>`)
        .join("")}</ul>
      ${revealed && card.content ? `<div class="card-note">${formatText(card.content)}</div>` : ""}
    `;
  }

  return `
    <button class="reveal-button" type="button" data-reveal-card>${revealed ? "Hide answer" : "Reveal answer"}</button>
    <div class="card-answer" ${revealed ? "" : "hidden"}>${formatText(card.content)}</div>
  `;
}

function renderQuestion(card) {
  return `
    <div class="question-options" role="group" aria-label="Answer choices">
      ${card.question.options
        .map(
          (option, index) =>
            `<button type="button" data-answer-index="${index}"><span>${String.fromCharCode(65 + index)}</span>${escapeHtml(option)}</button>`,
        )
        .join("")}
    </div>
    <div class="answer-feedback" hidden></div>
  `;
}

function bindDynamicCardEvents(card) {
  const revealButton = elements.studyCard.querySelector("[data-reveal-card]");
  revealButton?.addEventListener("click", () => toggleReveal(card.id));

  for (const answerButton of elements.studyCard.querySelectorAll("[data-answer-index]")) {
    answerButton.addEventListener("click", () => {
      const selected = Number(answerButton.dataset.answerIndex);
      showQuestionFeedback(card, selected);
    });
  }
}

function showQuestionFeedback(card, selectedIndex) {
  const buttons = [...elements.studyCard.querySelectorAll("[data-answer-index]")];
  const feedback = elements.studyCard.querySelector(".answer-feedback");
  const correct = selectedIndex === card.question.answerIndex;

  for (const [index, button] of buttons.entries()) {
    button.disabled = true;
    if (index === card.question.answerIndex) button.classList.add("is-correct");
    if (index === selectedIndex && !correct) button.classList.add("is-incorrect");
  }

  feedback.hidden = false;
  feedback.className = `answer-feedback ${correct ? "is-correct" : "is-incorrect"}`;
  feedback.innerHTML = `<strong>${correct ? "Correct." : "Not quite."}</strong> ${escapeHtml(card.question.explanation)}`;
}

function toggleReveal(cardId) {
  if (state.revealedCardIds.has(cardId)) state.revealedCardIds.delete(cardId);
  else state.revealedCardIds.add(cardId);
  renderFocusCard();
}

function renderOverview() {
  if (!state.orderedCards.length) {
    elements.cardGrid.innerHTML = `<div class="empty-state"><h2>No cards found</h2><p>Adjust the filters to see cards.</p></div>`;
    return;
  }

  elements.cardGrid.innerHTML = state.orderedCards
    .map((card, index) => {
      const status = cardStatus(card.id);
      return `
        <button class="overview-card status-${status}" type="button" data-overview-index="${index}">
          <span class="overview-card-topline"><span>${formatType(card.type)}</span><span>#${card.sequence}</span></span>
          <strong>${escapeHtml(card.title)}</strong>
          <p>${escapeHtml(card.prompt)}</p>
          <span class="status-pill">${formatStatus(status)}</span>
        </button>
      `;
    })
    .join("");

  for (const button of elements.cardGrid.querySelectorAll("[data-overview-index]")) {
    button.addEventListener("click", () => {
      state.currentIndex = Number(button.dataset.overviewIndex);
      state.displayMode = "focus";
      persistState();
      render();
      elements.studyCard.focus();
    });
  }
}

function renderProgress() {
  const deck = activeDeck();
  const result = calculateProgress(deck.cards, progressForDeck());
  elements.progressPercent.textContent = `${result.percent}%`;
  elements.progressBar.style.width = `${result.percent}%`;
  elements.masteredCount.textContent = result.mastered;
  elements.reviewCount.textContent = result.review;
}

function syncControls() {
  elements.deckSelect.value = state.activeDeckId;
  elements.pathSelect.value = state.activePathId;
  elements.typeFilter.value = state.cardType;
  document.querySelectorAll("[data-study-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.studyMode === state.studyMode);
  });
  document.querySelectorAll("[data-display-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.displayMode === state.displayMode);
  });
  elements.focusView.hidden = state.displayMode !== "focus";
  elements.overviewView.hidden = state.displayMode !== "overview";
}

function render() {
  syncControls();
  updatePathDescription();
  renderDeckHeader();
  renderProgress();
  if (state.displayMode === "focus") renderFocusCard();
  else renderOverview();
}

function goNext() {
  if (!state.orderedCards.length) return;

  if (state.studyMode === "random" && state.currentIndex === state.orderedCards.length - 1) {
    const previousCardId = activeCard()?.id;
    refreshOrder();
    if (state.orderedCards.length > 1 && state.orderedCards[0]?.id === previousCardId) {
      state.orderedCards.push(state.orderedCards.shift());
    }
    state.currentIndex = 0;
  } else {
    state.currentIndex = nextIndex(state.currentIndex, state.orderedCards.length);
  }

  renderFocusCard();
}

function goPrevious() {
  state.currentIndex = previousIndex(state.currentIndex, state.orderedCards.length);
  renderFocusCard();
}

function bindEvents() {
  elements.deckSelect.addEventListener("change", () => {
    state.activeDeckId = elements.deckSelect.value;
    state.activePathId = "all";
    state.cardType = "all";
    state.query = "";
    elements.searchInput.value = "";
    createPathOptions();
    refreshOrder();
    persistState();
    render();
  });

  elements.pathSelect.addEventListener("change", () => {
    state.activePathId = elements.pathSelect.value;
    refreshOrder();
    render();
  });

  elements.typeFilter.addEventListener("change", () => {
    state.cardType = elements.typeFilter.value;
    refreshOrder();
    render();
  });

  elements.searchInput.addEventListener("input", () => {
    state.query = elements.searchInput.value;
    refreshOrder();
    render();
  });

  document.querySelectorAll("[data-study-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      const currentCardId = activeCard()?.id;
      state.studyMode = button.dataset.studyMode;
      refreshOrder({ preserveCardId: currentCardId });
      persistState();
      render();
    });
  });

  document.querySelectorAll("[data-display-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.displayMode = button.dataset.displayMode;
      persistState();
      render();
    });
  });

  elements.previousCard.addEventListener("click", goPrevious);
  elements.nextCard.addEventListener("click", goNext);
  elements.markReview.addEventListener("click", () => activeCard() && setProgress(activeCard().id, "review"));
  elements.markMastered.addEventListener("click", () => activeCard() && setProgress(activeCard().id, "mastered"));

  elements.resetProgress.addEventListener("click", () => {
    if (!window.confirm(`Reset progress for ${activeDeck().title}?`)) return;
    delete state.progress[state.activeDeckId];
    persistState();
    render();
  });

  elements.themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.dataset.theme === "dark";
    state.theme = isDark ? "light" : "dark";
    applyTheme();
    persistState();
  });

  document.addEventListener("keydown", (event) => {
    if (event.target.matches("input, select, button") || state.displayMode !== "focus") return;
    if (event.key === "ArrowRight") goNext();
    if (event.key === "ArrowLeft") goPrevious();
    if (event.key === " ") {
      event.preventDefault();
      if (activeCard()?.type !== "question") toggleReveal(activeCard().id);
    }
    if (event.key.toLowerCase() === "m" && activeCard()) setProgress(activeCard().id, "mastered");
  });
}

function applyTheme() {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolvedTheme = state.theme === "system" ? (prefersDark ? "dark" : "light") : state.theme;
  document.documentElement.dataset.theme = resolvedTheme;
}

function persistState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      activeDeckId: state.activeDeckId,
      studyMode: state.studyMode,
      displayMode: state.displayMode,
      progress: state.progress,
      theme: state.theme,
    }),
  );
}

function loadPersistedState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function formatType(type) {
  return {
    concept: "Concept",
    fact: "Fact",
    question: "Question",
    code: "Code",
    steps: "Steps",
    checklist: "Checklist",
  }[type];
}

function formatStatus(status) {
  return { mastered: "Mastered", review: "Review", untouched: "Not started" }[status];
}

function formatText(text) {
  return escapeHtml(text).replaceAll("\n", "<br />");
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function initialize() {
  applyTheme();
  bindEvents();
  try {
    await loadDecks();
    if (!state.decks.some((deck) => deck.id === state.activeDeckId)) state.activeDeckId = state.decks[0].id;
    createDeckOptions();
    createPathOptions();
    refreshOrder();
    render();
  } catch (error) {
    elements.deckHeader.innerHTML = `<div class="error-panel"><h1>Unable to load learning data</h1><p>${escapeHtml(error.message)}</p></div>`;
    elements.focusView.hidden = true;
  }
}

initialize();
