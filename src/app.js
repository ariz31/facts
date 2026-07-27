import {
  buildStudyOrder,
  calculateProgress,
  filterCards,
  nextIndex,
  previousIndex,
} from "./learning-engine.js";
import {
  applyPreset,
  DEFAULT_CARD_DESIGN,
  designToCssVariables,
  normalizeCardDesign,
} from "./card-design.js";
import {
  deleteCardBackground,
  getCardBackground,
  importBackgroundFromUrl,
  saveCardBackground,
} from "./offline-storage.js";

const STORAGE_KEY = "facts-learning-state-v2";
const GESTURE_DISTANCE = 58;

const elements = {
  journeyView: document.querySelector("#journey-view"),
  journeyTitle: document.querySelector("#journey-title"),
  journeyDescription: document.querySelector("#journey-description"),
  journeyTopics: document.querySelector("#journey-topics"),
  journeyPaths: document.querySelector("#journey-paths"),
  journeyReady: document.querySelector("#journey-ready"),
  deckGrid: document.querySelector("#deck-grid"),
  pathGrid: document.querySelector("#path-grid"),
  selectedDeckSummary: document.querySelector("#selected-deck-summary"),
  readySummary: document.querySelector("#ready-summary"),
  backToTopics: document.querySelector("#back-to-topics"),
  backToPaths: document.querySelector("#back-to-paths"),
  startLearning: document.querySelector("#start-learning"),
  journeyCustomize: document.querySelector("#journey-customize"),
  contentArea: document.querySelector("#content-area"),
  deckHeader: document.querySelector("#deck-header"),
  focusView: document.querySelector("#focus-view"),
  overviewView: document.querySelector("#overview-view"),
  studyCard: document.querySelector("#study-card"),
  emptyState: document.querySelector("#empty-state"),
  cardGrid: document.querySelector("#card-grid"),
  connectionStatus: document.querySelector("#connection-status"),
  installApp: document.querySelector("#install-app"),
  openDesignStudio: document.querySelector("#open-design-studio"),
  themeToggle: document.querySelector("#theme-toggle"),
  designStudio: document.querySelector("#design-studio"),
  designPreview: document.querySelector("#design-preview"),
  designMessage: document.querySelector("#design-message"),
  designPreset: document.querySelector("#design-preset"),
  designAccent: document.querySelector("#design-accent"),
  designBackground: document.querySelector("#design-background"),
  designText: document.querySelector("#design-text"),
  designMuted: document.querySelector("#design-muted"),
  designFont: document.querySelector("#design-font"),
  designSpacing: document.querySelector("#design-spacing"),
  designShadow: document.querySelector("#design-shadow"),
  designImageFit: document.querySelector("#design-image-fit"),
  designImagePosition: document.querySelector("#design-image-position"),
  designRadius: document.querySelector("#design-radius"),
  designOverlay: document.querySelector("#design-overlay"),
  designImageEnabled: document.querySelector("#design-image-enabled"),
  radiusOutput: document.querySelector("#radius-output"),
  overlayOutput: document.querySelector("#overlay-output"),
  designImageFile: document.querySelector("#design-image-file"),
  designImageUrl: document.querySelector("#design-image-url"),
  importImageUrl: document.querySelector("#import-image-url"),
  removeBackgroundImage: document.querySelector("#remove-background-image"),
  resetCardDesign: document.querySelector("#reset-card-design"),
};

const persisted = loadPersistedState();
const state = {
  decks: [],
  activeDeckId: persisted.activeDeckId ?? "frontend-programming",
  activePathId: persisted.activePathId ?? "all",
  studyMode: persisted.studyMode ?? "sequential",
  orderedCards: [],
  currentIndex: 0,
  revealedCardIds: new Set(),
  progress: persisted.progress ?? {},
  cardDesigns: persisted.cardDesigns ?? {},
  backgroundUrls: {},
  theme: persisted.theme ?? "system",
  journeyStep: "topics",
  studying: false,
  deferredInstallPrompt: null,
  pointerStart: null,
};

async function loadDecks() {
  const catalogResponse = await fetch("./data/decks.json");
  if (!catalogResponse.ok) throw new Error("Unable to load the topic catalog.");
  const catalog = await catalogResponse.json();

  state.decks = await Promise.all(
    catalog.decks.map(async (deckName) => {
      const response = await fetch(`./data/${deckName}.json`);
      if (!response.ok) throw new Error(`Unable to load ${deckName}.json`);
      return response.json();
    }),
  );
}

function activeDeck() {
  return state.decks.find((deck) => deck.id === state.activeDeckId) ?? state.decks[0];
}

function activePath() {
  if (state.activePathId === "all") return null;
  return activeDeck()?.paths.find((path) => path.id === state.activePathId) ?? null;
}

function activeCard() {
  return state.orderedCards[state.currentIndex] ?? null;
}

function progressForDeck(deckId = state.activeDeckId) {
  return state.progress[deckId] ?? {};
}

function designForDeck(deckId = state.activeDeckId) {
  return normalizeCardDesign(state.cardDesigns[deckId] ?? DEFAULT_CARD_DESIGN);
}

function setJourneyStep(step) {
  state.journeyStep = step;
  const content = {
    topics: ["Choose a topic", "Pick what you want to learn. Each topic is organized as a connected sequence of cards."],
    paths: ["Choose your path", "Select the outcome or foundation you want to study first."],
    ready: ["Ready to learn", "Choose the order, adjust the card design, then enter the distraction-free reader."],
  }[step];

  elements.journeyTitle.textContent = content[0];
  elements.journeyDescription.textContent = content[1];
  elements.journeyTopics.hidden = step !== "topics";
  elements.journeyPaths.hidden = step !== "paths";
  elements.journeyReady.hidden = step !== "ready";

  const order = ["topics", "paths", "ready"];
  const activeIndex = order.indexOf(step);
  document.querySelectorAll("[data-journey-dot]").forEach((dot) => {
    dot.classList.toggle("is-active", order.indexOf(dot.dataset.journeyDot) <= activeIndex);
  });
}

function renderJourney() {
  renderDeckGrid();
  if (activeDeck()) renderPathGrid();
  renderReadySummary();
  syncJourneyModeButtons();
  setJourneyStep(state.journeyStep);
}

function renderDeckGrid() {
  elements.deckGrid.innerHTML = state.decks
    .map((deck) => {
      const progress = calculateProgress(deck.cards, progressForDeck(deck.id));
      return `
        <button class="deck-choice ${deck.id === state.activeDeckId ? "is-selected" : ""}" type="button" data-deck-id="${deck.id}">
          <span class="deck-choice-category">${escapeHtml(deck.category)}</span>
          <strong>${escapeHtml(deck.title)}</strong>
          <p>${escapeHtml(deck.description)}</p>
          <span class="deck-choice-meta">
            <span>${deck.cards.length} cards</span>
            <span>${deck.paths.length} paths</span>
            <span>${progress.percent}% mastered</span>
          </span>
        </button>
      `;
    })
    .join("");

  elements.deckGrid.querySelectorAll("[data-deck-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.activeDeckId = button.dataset.deckId;
      state.activePathId = "all";
      await loadBackgroundForDeck(state.activeDeckId);
      renderPathGrid();
      persistState();
      setJourneyStep("paths");
    });
  });
}

function renderPathGrid() {
  const deck = activeDeck();
  if (!deck) return;

  elements.selectedDeckSummary.innerHTML = `
    <span class="eyebrow">${escapeHtml(deck.category)}</span>
    <h2>${escapeHtml(deck.title)}</h2>
    <p>${escapeHtml(deck.description)}</p>
  `;

  const completeChoice = {
    id: "all",
    title: "Complete topic",
    description: "Follow every card in the author-defined sequence.",
    cardIds: deck.cards.map((card) => card.id),
  };

  elements.pathGrid.innerHTML = [completeChoice, ...deck.paths]
    .map(
      (path, index) => `
        <button class="path-choice" type="button" data-path-id="${path.id}">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <strong>${escapeHtml(path.title)}</strong>
          <p>${escapeHtml(path.description)}</p>
          <small>${path.cardIds.length} cards</small>
        </button>
      `,
    )
    .join("");

  elements.pathGrid.querySelectorAll("[data-path-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activePathId = button.dataset.pathId;
      persistState();
      renderReadySummary();
      setJourneyStep("ready");
    });
  });
}

function renderReadySummary() {
  const deck = activeDeck();
  if (!deck) return;
  const path = activePath();
  const cardCount = path?.cardIds.length ?? deck.cards.length;
  const estimatedMinutes = Math.max(5, Math.round(deck.estimatedMinutes * (cardCount / deck.cards.length)));

  elements.readySummary.innerHTML = `
    <span class="eyebrow">${escapeHtml(deck.title)}</span>
    <h2>${escapeHtml(path?.title ?? "Complete topic")}</h2>
    <p>${escapeHtml(path?.description ?? "Study the complete topic from foundation to application.")}</p>
    <div class="ready-metrics">
      <span><strong>${cardCount}</strong> cards</span>
      <span><strong>${estimatedMinutes}</strong> minutes</span>
      <span><strong>${formatMode(state.studyMode)}</strong> order</span>
    </div>
  `;
}

function syncJourneyModeButtons() {
  document.querySelectorAll("[data-journey-study-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.journeyStudyMode === state.studyMode);
  });
}

function refreshOrder() {
  const deck = activeDeck();
  const cards = filterCards(deck.cards, { pathId: state.activePathId });
  state.orderedCards = buildStudyOrder(cards, state.studyMode);
  state.currentIndex = 0;
}

async function startLearning() {
  refreshOrder();
  state.studying = true;
  state.journeyStep = "ready";
  document.body.classList.add("is-studying");
  elements.journeyView.hidden = true;
  elements.contentArea.hidden = false;
  elements.deckHeader.hidden = true;
  await loadBackgroundForDeck(state.activeDeckId);
  renderFocusCard();
  persistState();
  elements.studyCard.focus({ preventScroll: true });
}

function exitLearning() {
  state.studying = false;
  document.body.classList.remove("is-studying");
  elements.contentArea.hidden = true;
  elements.journeyView.hidden = false;
  renderJourney();
  setJourneyStep("ready");
  window.scrollTo({ top: 0, behavior: "instant" });
}

function renderFocusCard() {
  const card = activeCard();
  const hasCard = Boolean(card);
  elements.emptyState.hidden = hasCard;
  elements.studyCard.hidden = !hasCard;
  if (!hasCard) return;

  const status = progressForDeck()[card.id] ?? "untouched";
  const revealed = state.revealedCardIds.has(card.id);
  elements.studyCard.className = `study-card immersive-card card-type-${card.type} status-${status}`;
  elements.studyCard.innerHTML = `
    <div class="card-topline">
      <button class="card-exit" type="button" data-exit-study aria-label="Return to learning journey">←</button>
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
    <div class="card-minimal-footer">
      <div class="card-progress-controls" aria-label="Learning progress">
        <button type="button" data-card-status="review" class="${status === "review" ? "is-selected" : ""}" aria-label="Mark for review">↺</button>
        <button type="button" data-card-status="mastered" class="${status === "mastered" ? "is-selected" : ""}" aria-label="Mark mastered">✓</button>
      </div>
      <span class="gesture-copy">Tap edges or swipe to move</span>
    </div>
  `;

  applyDesignToElement(elements.studyCard);
  bindCardContentEvents(card);
}

function renderCardBody(card, revealed) {
  if (card.type === "question") {
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
      <ol class="steps-list" ${revealed ? "" : "hidden"}>${card.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
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

function bindCardContentEvents(card) {
  elements.studyCard.querySelector("[data-exit-study]")?.addEventListener("click", exitLearning);
  elements.studyCard.querySelector("[data-reveal-card]")?.addEventListener("click", () => toggleReveal(card.id));

  elements.studyCard.querySelectorAll("[data-card-status]").forEach((button) => {
    button.addEventListener("click", () => setProgress(card.id, button.dataset.cardStatus));
  });

  elements.studyCard.querySelectorAll("[data-answer-index]").forEach((button) => {
    button.addEventListener("click", () => showQuestionFeedback(card, Number(button.dataset.answerIndex)));
  });
}

function showQuestionFeedback(card, selectedIndex) {
  const buttons = [...elements.studyCard.querySelectorAll("[data-answer-index]")];
  const feedback = elements.studyCard.querySelector(".answer-feedback");
  const correct = selectedIndex === card.question.answerIndex;

  buttons.forEach((button, index) => {
    button.disabled = true;
    if (index === card.question.answerIndex) button.classList.add("is-correct");
    if (index === selectedIndex && !correct) button.classList.add("is-incorrect");
  });

  feedback.hidden = false;
  feedback.className = `answer-feedback ${correct ? "is-correct" : "is-incorrect"}`;
  feedback.innerHTML = `<strong>${correct ? "Correct." : "Not quite."}</strong> ${escapeHtml(card.question.explanation)}`;
}

function toggleReveal(cardId) {
  if (state.revealedCardIds.has(cardId)) state.revealedCardIds.delete(cardId);
  else state.revealedCardIds.add(cardId);
  renderFocusCard();
}

function setProgress(cardId, status) {
  state.progress[state.activeDeckId] ??= {};
  const current = state.progress[state.activeDeckId][cardId];
  if (current === status) delete state.progress[state.activeDeckId][cardId];
  else state.progress[state.activeDeckId][cardId] = status;
  persistState();
  renderFocusCard();
}

function goNext() {
  if (!state.orderedCards.length) return;
  if (state.studyMode === "random" && state.currentIndex === state.orderedCards.length - 1) {
    const previousCardId = activeCard()?.id;
    refreshOrder();
    if (state.orderedCards.length > 1 && state.orderedCards[0]?.id === previousCardId) {
      state.orderedCards.push(state.orderedCards.shift());
    }
  } else {
    state.currentIndex = nextIndex(state.currentIndex, state.orderedCards.length);
  }
  renderFocusCard();
}

function goPrevious() {
  state.currentIndex = previousIndex(state.currentIndex, state.orderedCards.length);
  renderFocusCard();
}

function bindGestures() {
  elements.studyCard.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button, input, select, textarea, a")) return;
    state.pointerStart = { x: event.clientX, y: event.clientY, time: Date.now() };
  });

  elements.studyCard.addEventListener("pointerup", (event) => {
    if (!state.pointerStart || event.target.closest("button, input, select, textarea, a")) {
      state.pointerStart = null;
      return;
    }

    const deltaX = event.clientX - state.pointerStart.x;
    const deltaY = event.clientY - state.pointerStart.y;
    const elapsed = Date.now() - state.pointerStart.time;
    state.pointerStart = null;

    if (Math.abs(deltaX) >= GESTURE_DISTANCE && Math.abs(deltaX) > Math.abs(deltaY)) {
      deltaX < 0 ? goNext() : goPrevious();
      return;
    }

    if (Math.abs(deltaY) >= GESTURE_DISTANCE && Math.abs(deltaY) > Math.abs(deltaX)) {
      if (activeCard()) setProgress(activeCard().id, deltaY < 0 ? "mastered" : "review");
      return;
    }

    if (elapsed > 650 || Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10 || window.getSelection()?.toString()) return;
    const bounds = elements.studyCard.getBoundingClientRect();
    const relativeX = (event.clientX - bounds.left) / bounds.width;
    if (relativeX < 0.28) goPrevious();
    else if (relativeX > 0.72) goNext();
    else if (activeCard()?.type !== "question") toggleReveal(activeCard().id);
  });
}

async function loadBackgroundForDeck(deckId) {
  try {
    const blob = await getCardBackground(deckId);
    if (state.backgroundUrls[deckId]) URL.revokeObjectURL(state.backgroundUrls[deckId]);
    state.backgroundUrls[deckId] = blob ? URL.createObjectURL(blob) : "";
  } catch (error) {
    console.warn("Unable to load offline card background.", error);
    state.backgroundUrls[deckId] = "";
  }
}

function applyDesignToElement(element) {
  const variables = designToCssVariables(designForDeck(), state.backgroundUrls[state.activeDeckId]);
  Object.entries(variables).forEach(([name, value]) => element.style.setProperty(name, value));
}

function openDesignStudio() {
  syncDesignControls();
  applyDesignToElement(elements.designPreview);
  elements.designMessage.textContent = `Customizing ${activeDeck()?.title ?? "this topic"}`;
  elements.designStudio.showModal();
}

function syncDesignControls() {
  const design = designForDeck();
  elements.designPreset.value = design.preset;
  elements.designAccent.value = design.accent;
  elements.designBackground.value = design.background;
  elements.designText.value = design.text;
  elements.designMuted.value = design.muted;
  elements.designFont.value = design.font;
  elements.designSpacing.value = design.spacing;
  elements.designShadow.value = design.shadow;
  elements.designImageFit.value = design.imageFit;
  elements.designImagePosition.value = design.imagePosition;
  elements.designRadius.value = design.radius;
  elements.designOverlay.value = design.imageOverlay;
  elements.designImageEnabled.checked = design.imageEnabled;
  elements.radiusOutput.value = `${design.radius}px`;
  elements.overlayOutput.value = `${design.imageOverlay}%`;
}

function updateDesign(patch) {
  state.cardDesigns[state.activeDeckId] = normalizeCardDesign({ ...designForDeck(), ...patch });
  persistState();
  syncDesignControls();
  applyDesignToElement(elements.designPreview);
  if (state.studying) applyDesignToElement(elements.studyCard);
}

function bindDesignStudio() {
  elements.openDesignStudio.addEventListener("click", openDesignStudio);
  elements.journeyCustomize.addEventListener("click", openDesignStudio);

  elements.designPreset.addEventListener("change", () => {
    state.cardDesigns[state.activeDeckId] = applyPreset(designForDeck(), elements.designPreset.value);
    persistState();
    syncDesignControls();
    applyDesignToElement(elements.designPreview);
  });

  const bindings = [
    [elements.designAccent, "accent", "input"],
    [elements.designBackground, "background", "input"],
    [elements.designText, "text", "input"],
    [elements.designMuted, "muted", "input"],
    [elements.designFont, "font", "change"],
    [elements.designSpacing, "spacing", "change"],
    [elements.designShadow, "shadow", "change"],
    [elements.designImageFit, "imageFit", "change"],
    [elements.designImagePosition, "imagePosition", "change"],
  ];
  bindings.forEach(([element, key, eventName]) => element.addEventListener(eventName, () => updateDesign({ [key]: element.value, preset: "custom" })));

  elements.designRadius.addEventListener("input", () => updateDesign({ radius: Number(elements.designRadius.value), preset: "custom" }));
  elements.designOverlay.addEventListener("input", () => updateDesign({ imageOverlay: Number(elements.designOverlay.value), preset: "custom" }));
  elements.designImageEnabled.addEventListener("change", () => updateDesign({ imageEnabled: elements.designImageEnabled.checked }));

  elements.designImageFile.addEventListener("change", async () => {
    const [file] = elements.designImageFile.files;
    if (!file) return;
    try {
      await saveCardBackground(state.activeDeckId, file);
      await loadBackgroundForDeck(state.activeDeckId);
      updateDesign({ imageEnabled: true });
      elements.designMessage.textContent = "Background saved for offline use.";
    } catch (error) {
      elements.designMessage.textContent = error.message;
    } finally {
      elements.designImageFile.value = "";
    }
  });

  elements.importImageUrl.addEventListener("click", async () => {
    const url = elements.designImageUrl.value.trim();
    if (!url) return;
    elements.designMessage.textContent = "Importing image…";
    try {
      await importBackgroundFromUrl(state.activeDeckId, url);
      await loadBackgroundForDeck(state.activeDeckId);
      updateDesign({ imageEnabled: true });
      elements.designMessage.textContent = "Image copied into offline storage.";
      elements.designImageUrl.value = "";
    } catch (error) {
      elements.designMessage.textContent = `Import failed: ${error.message}`;
    }
  });

  elements.removeBackgroundImage.addEventListener("click", async () => {
    await deleteCardBackground(state.activeDeckId);
    await loadBackgroundForDeck(state.activeDeckId);
    applyDesignToElement(elements.designPreview);
    elements.designMessage.textContent = "Background image removed.";
  });

  elements.resetCardDesign.addEventListener("click", async () => {
    delete state.cardDesigns[state.activeDeckId];
    await deleteCardBackground(state.activeDeckId);
    await loadBackgroundForDeck(state.activeDeckId);
    persistState();
    syncDesignControls();
    applyDesignToElement(elements.designPreview);
    elements.designMessage.textContent = "Topic design reset.";
  });
}

function bindJourneyEvents() {
  elements.backToTopics.addEventListener("click", () => setJourneyStep("topics"));
  elements.backToPaths.addEventListener("click", () => setJourneyStep("paths"));
  elements.startLearning.addEventListener("click", startLearning);

  document.querySelectorAll("[data-journey-study-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.studyMode = button.dataset.journeyStudyMode;
      persistState();
      syncJourneyModeButtons();
      renderReadySummary();
    });
  });
}

function bindKeyboard() {
  document.addEventListener("keydown", (event) => {
    if (!state.studying || event.target.closest("button, input, select, textarea")) return;
    if (event.key === "ArrowRight") goNext();
    if (event.key === "ArrowLeft") goPrevious();
    if (event.key === "Escape") exitLearning();
    if (event.key === " ") {
      event.preventDefault();
      if (activeCard()?.type !== "question") toggleReveal(activeCard().id);
    }
    if (event.key.toLowerCase() === "m" && activeCard()) setProgress(activeCard().id, "mastered");
    if (event.key.toLowerCase() === "r" && activeCard()) setProgress(activeCard().id, "review");
  });
}

function bindTheme() {
  elements.themeToggle.addEventListener("click", () => {
    state.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme();
    persistState();
  });
}

function applyTheme() {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme = state.theme === "system" ? (prefersDark ? "dark" : "light") : state.theme;
}

function updateConnectionStatus() {
  elements.connectionStatus.textContent = navigator.onLine ? "Online · offline ready" : "Offline";
  elements.connectionStatus.classList.toggle("is-offline", !navigator.onLine);
}

function bindPwa() {
  window.addEventListener("online", updateConnectionStatus);
  window.addEventListener("offline", updateConnectionStatus);
  updateConnectionStatus();

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
    elements.installApp.hidden = false;
  });

  elements.installApp.addEventListener("click", async () => {
    if (!state.deferredInstallPrompt) return;
    await state.deferredInstallPrompt.prompt();
    state.deferredInstallPrompt = null;
    elements.installApp.hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    elements.installApp.hidden = true;
    state.deferredInstallPrompt = null;
  });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("./sw.js");
    await navigator.serviceWorker.ready;
    updateConnectionStatus();
  } catch (error) {
    console.warn("Service worker registration failed.", error);
    elements.connectionStatus.textContent = navigator.onLine ? "Online" : "Offline";
  }
}

function persistState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeDeckId: state.activeDeckId,
        activePathId: state.activePathId,
        studyMode: state.studyMode,
        progress: state.progress,
        cardDesigns: state.cardDesigns,
        theme: state.theme,
      }),
    );
  } catch (error) {
    console.warn("Unable to save local state.", error);
  }
}

function loadPersistedState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function formatType(type) {
  return { concept: "Concept", fact: "Fact", question: "Question", code: "Code", steps: "Steps", checklist: "Checklist" }[type];
}

function formatStatus(status) {
  return { mastered: "Mastered", review: "Review", untouched: "Not started" }[status];
}

function formatMode(mode) {
  return mode === "random" ? "Random" : "Sequential";
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
  bindJourneyEvents();
  bindGestures();
  bindKeyboard();
  bindTheme();
  bindDesignStudio();
  bindPwa();
  registerServiceWorker();

  try {
    await loadDecks();
    if (!state.decks.some((deck) => deck.id === state.activeDeckId)) state.activeDeckId = state.decks[0].id;
    const deck = activeDeck();
    if (state.activePathId !== "all" && !deck.paths.some((path) => path.id === state.activePathId)) state.activePathId = "all";
    await loadBackgroundForDeck(state.activeDeckId);
    renderJourney();
  } catch (error) {
    elements.journeyView.innerHTML = `<div class="error-panel"><h1>Unable to load learning data</h1><p>${escapeHtml(error.message)}</p><p>Reconnect once so the app can save all topics for offline study.</p></div>`;
  }
}

initialize();
