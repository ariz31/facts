const APP_KEY = "facts-learning-state-v2";
const UI_KEY = "facts-ui-preferences-v1";
const ANIMATIONS = [["none", "None"], ["fade", "Fade"], ["slide", "Slide"], ["zoom", "Gentle zoom"], ["flip", "Soft flip"]];
const PRESETS = {
  classic: ["Classic", "#ffffff", "#315efb", "#14213d"],
  minimal: ["Minimal", "#ffffff", "#111827", "#111827"],
  editorial: ["Editorial", "#fffaf0", "#8b2f2f", "#2d241f"],
  notebook: ["Notebook", "#fffef4", "#1d4ed8", "#1f2937"],
  neon: ["Neon", "#07111f", "#22d3ee", "#ecfeff"],
  photo: ["Photo", "#172033", "#ffffff", "#ffffff"],
};
const DEFAULTS = {
  "frontend-programming": "notebook",
  "backend-programming": "minimal",
  "data-science": "editorial",
  statistics: "classic",
  "python-programming": "notebook",
  "databases-sql": "minimal",
  "machine-learning": "classic",
  cybersecurity: "neon",
  "cloud-devops": "minimal",
  "git-github": "editorial",
};

let animationPreference = normalizeAnimation(read(UI_KEY, {}).animation);
const transitionTimers = new WeakMap();
const backgroundGenerations = new WeakMap();
const decodedImages = new Set();

seedDefaultDesigns();
whenDocumentReady(initializeUiEnhancements);

function read(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function whenDocumentReady(callback) {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback, { once: true });
  else queueMicrotask(callback);
}

function seedDefaultDesigns() {
  const state = read(APP_KEY, {});
  if (!state.cardDesigns || typeof state.cardDesigns !== "object" || Array.isArray(state.cardDesigns)) state.cardDesigns = {};
  let changed = false;
  for (const [deckId, preset] of Object.entries(DEFAULTS)) {
    if (!state.cardDesigns[deckId] || typeof state.cardDesigns[deckId] !== "object") {
      state.cardDesigns[deckId] = { preset };
      changed = true;
    }
  }
  if (changed) write(APP_KEY, state);
}

function initializeUiEnhancements() {
  installRuntimeOverrides();
  injectReadyConfiguration();
  enhanceStudioPresets();
  observeStudyCard();
  observeBackground(document.querySelector("#design-preview"));
  bindRefreshes();
  setAnimation(animationPreference, { persist: false });
  syncPresetButtons();
}

function installRuntimeOverrides() {
  if (document.querySelector("#facts-ui-runtime-overrides")) return;
  const style = document.createElement("style");
  style.id = "facts-ui-runtime-overrides";
  style.textContent = `
    .gesture-copy { animation: none !important; }
    .studio-animation-control { margin-top: -4px; }
    @media (max-width: 760px) {
      .ai-import-button {
        display: inline-grid !important;
        place-items: center;
        min-width: 42px;
        width: 42px;
        padding: 0 !important;
        font-size: 0 !important;
      }
      .ai-import-button::after {
        content: "AI";
        font-size: 0.72rem;
        font-weight: 850;
      }
    }
  `;
  document.head.append(style);
}

function normalizeAnimation(value) {
  return ANIMATIONS.some(([id]) => id === value) ? value : "none";
}

function setAnimation(value, { persist = true } = {}) {
  animationPreference = normalizeAnimation(value);
  if (persist) write(UI_KEY, { ...read(UI_KEY, {}), animation: animationPreference });
  document.querySelectorAll("[data-animation-select]").forEach((select) => {
    select.value = animationPreference;
  });
  document.querySelector("#study-card")?.setAttribute("data-card-motion", animationPreference);
}

function animationOptions() {
  return ANIMATIONS.map(([id, label]) => `<option value="${id}">${label}</option>`).join("");
}

function injectReadyConfiguration() {
  const options = document.querySelector(".ready-options");
  const customize = document.querySelector("#journey-customize");
  if (!options || !customize || document.querySelector("#ready-card-configuration")) return;
  const section = document.createElement("section");
  section.id = "ready-card-configuration";
  section.className = "ready-card-configuration";
  section.innerHTML = `
    <div class="ready-control-heading"><span class="field-label">Default card appearance</span><small>Choose before starting</small></div>
    <div class="preset-chip-grid" data-preset-gallery="ready"></div>
    <label class="animation-control">Card transition<select data-animation-select>${animationOptions()}</select></label>`;
  options.insertBefore(section, customize);
  section.querySelector("[data-animation-select]").addEventListener("change", (event) => setAnimation(event.target.value));
  renderPresetGallery(section.querySelector("[data-preset-gallery]"));
}

function enhanceStudioPresets() {
  const select = document.querySelector("#design-preset");
  if (!select || document.querySelector('[data-preset-gallery="studio"]')) return;
  if (![...select.options].some((option) => option.value === "custom")) select.add(new Option("Custom", "custom"));
  select.classList.add("preset-native-select");
  const gallery = document.createElement("div");
  gallery.className = "preset-card-grid";
  gallery.dataset.presetGallery = "studio";
  select.closest("label")?.insertAdjacentElement("afterend", gallery);

  const motion = document.createElement("label");
  motion.className = "animation-control studio-animation-control";
  motion.innerHTML = `Card transition<select data-animation-select>${animationOptions()}</select>`;
  gallery.insertAdjacentElement("afterend", motion);
  motion.querySelector("select").addEventListener("change", (event) => setAnimation(event.target.value));

  renderPresetGallery(gallery);
  select.addEventListener("change", () => queueMicrotask(syncPresetButtons));
}

function renderPresetGallery(container) {
  if (!container) return;
  container.innerHTML = Object.entries(PRESETS).map(([id, [label, background, accent, text]]) => `
    <button class="preset-choice" type="button" data-preset-choice="${id}" aria-label="Use ${label} preset">
      <span class="preset-swatch" style="--preset-bg:${background};--preset-accent:${accent};--preset-text:${text}"><i></i><b></b><em></em></span>
      <strong>${label}</strong>
    </button>`).join("");
  container.querySelectorAll("[data-preset-choice]").forEach((button) => {
    button.addEventListener("click", () => selectPreset(button.dataset.presetChoice));
  });
  syncPresetButtons();
}

function selectPreset(preset) {
  const select = document.querySelector("#design-preset");
  if (!select || !PRESETS[preset]) return;
  select.value = preset;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  syncPresetButtons(preset);
}

function currentPreset() {
  const state = read(APP_KEY, {});
  const deckId = typeof state.activeDeckId === "string" ? state.activeDeckId : "frontend-programming";
  const preset = state.cardDesigns?.[deckId]?.preset;
  return PRESETS[preset] ? preset : DEFAULTS[deckId] ?? "classic";
}

function syncPresetButtons(forced) {
  const selected = forced ?? currentPreset();
  document.querySelectorAll("[data-preset-choice]").forEach((button) => {
    const active = button.dataset.presetChoice === selected;
    button.classList.toggle("is-selected", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function bindRefreshes() {
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-deck-id], [data-path-id], #back-to-paths, #back-to-topics")) queueMicrotask(syncPresetButtons);
    if (event.target.closest("#open-design-studio, #journey-customize")) queueMicrotask(() => {
      renderPresetGallery(document.querySelector('[data-preset-gallery="studio"]'));
      setAnimation(animationPreference, { persist: false });
      syncPresetButtons();
    });
  });
}

function observeStudyCard() {
  const card = document.querySelector("#study-card");
  if (!card) return;
  let previousPosition = "";
  let previousIndex = 0;
  let previousTotal = 0;
  card.dataset.cardMotion = animationPreference;

  new MutationObserver(() => {
    syncBackground(card);
    const position = card.querySelector(".card-position")?.textContent?.trim() ?? "";
    if (!position || position === previousPosition) return;
    const [indexText, totalText] = position.split("/");
    const index = Number(indexText?.trim()) || 0;
    const total = Number(totalText?.trim()) || 0;
    if (previousPosition) animateCard(card, navigationDirection(previousIndex, previousTotal, index, total));
    previousPosition = position;
    previousIndex = index;
    previousTotal = total;
  }).observe(card, { childList: true, subtree: true, attributes: true, attributeFilter: ["style"] });
  syncBackground(card);
}

function navigationDirection(previousIndex, previousTotal, currentIndex, currentTotal) {
  const total = currentTotal || previousTotal;
  if (total > 1 && previousIndex === total && currentIndex === 1) return "next";
  if (total > 1 && previousIndex === 1 && currentIndex === total) return "previous";
  return currentIndex >= previousIndex ? "next" : "previous";
}

function animateCard(card, direction) {
  card.dataset.cardMotion = animationPreference;
  card.dataset.cardDirection = direction;
  card.classList.remove("is-card-transitioning");
  const previousTimer = transitionTimers.get(card);
  if (previousTimer) clearTimeout(previousTimer);
  if (animationPreference === "none" || globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  void card.offsetWidth;
  card.classList.add("is-card-transitioning");
  transitionTimers.set(card, setTimeout(() => {
    card.classList.remove("is-card-transitioning");
    transitionTimers.delete(card);
  }, 520));
}

function observeBackground(element) {
  if (!element) return;
  new MutationObserver(() => syncBackground(element)).observe(element, { attributes: true, attributeFilter: ["style"] });
  syncBackground(element);
}

function syncBackground(element) {
  const value = element.style.getPropertyValue("--card-image").trim();
  const url = value.match(/^url\(["']?(.*?)["']?\)$/)?.[1];
  const generation = (backgroundGenerations.get(element) ?? 0) + 1;
  backgroundGenerations.set(element, generation);

  if (!url || decodedImages.has(url)) {
    element.classList.add("card-background-ready");
    return;
  }

  element.classList.remove("card-background-ready");
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  const loaded = typeof image.decode === "function"
    ? image.decode().catch(() => waitForImage(image))
    : waitForImage(image);

  loaded.then(() => {
    decodedImages.add(url);
    if (backgroundGenerations.get(element) === generation && currentBackgroundUrl(element) === url) {
      element.classList.add("card-background-ready");
    }
  }).catch(() => {
    if (backgroundGenerations.get(element) === generation && currentBackgroundUrl(element) === url) {
      element.classList.add("card-background-ready");
    }
  });
}

function currentBackgroundUrl(element) {
  const value = element.style.getPropertyValue("--card-image").trim();
  return value.match(/^url\(["']?(.*?)["']?\)$/)?.[1] ?? "";
}

function waitForImage(image) {
  if (image.complete) return image.naturalWidth > 0 ? Promise.resolve() : Promise.reject(new Error("Image failed to load."));
  return new Promise((resolve, reject) => {
    image.addEventListener("load", resolve, { once: true });
    image.addEventListener("error", () => reject(new Error("Image failed to load.")), { once: true });
  });
}
