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

seedDefaultDesigns();
setTimeout(initializeUiEnhancements, 0);

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function seedDefaultDesigns() {
  const state = read(APP_KEY, {});
  state.cardDesigns ??= {};
  let changed = false;
  for (const [deckId, preset] of Object.entries(DEFAULTS)) {
    if (!state.cardDesigns[deckId]) {
      state.cardDesigns[deckId] = { preset };
      changed = true;
    }
  }
  if (changed) write(APP_KEY, state);
}

function initializeUiEnhancements() {
  injectReadyConfiguration();
  enhanceStudioPresets();
  observeStudyCard();
  observeBackground(document.querySelector("#design-preview"));
  bindRefreshes();
  setAnimation(read(UI_KEY, { animation: "none" }).animation);
  syncPresetButtons();
}

function setAnimation(value) {
  const animation = ANIMATIONS.some(([id]) => id === value) ? value : "none";
  write(UI_KEY, { ...read(UI_KEY, {}), animation });
  document.querySelectorAll("[data-animation-select]").forEach((select) => {
    select.value = animation;
  });
  document.querySelector("#study-card")?.setAttribute("data-card-motion", animation);
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
    <label class="animation-control">Card transition<select data-animation-select>${ANIMATIONS.map(([id, label]) => `<option value="${id}">${label}</option>`).join("")}</select></label>`;
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
  renderPresetGallery(gallery);
  select.addEventListener("change", syncPresetButtons);
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
  const deckId = state.activeDeckId ?? "frontend-programming";
  const preset = state.cardDesigns?.[deckId]?.preset;
  return PRESETS[preset] ? preset : DEFAULTS[deckId] ?? "classic";
}

function syncPresetButtons(forced) {
  const selected = forced ?? document.querySelector("#design-preset")?.value ?? currentPreset();
  document.querySelectorAll("[data-preset-choice]").forEach((button) => {
    const active = button.dataset.presetChoice === selected;
    button.classList.toggle("is-selected", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function bindRefreshes() {
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-deck-id], [data-path-id], #back-to-paths, #back-to-topics")) setTimeout(syncPresetButtons, 0);
    if (event.target.closest("#open-design-studio, #journey-customize")) setTimeout(() => {
      renderPresetGallery(document.querySelector('[data-preset-gallery="studio"]'));
      syncPresetButtons();
    }, 0);
  });
}

function observeStudyCard() {
  const card = document.querySelector("#study-card");
  if (!card) return;
  let previousPosition = "";
  let previousIndex = 0;
  card.dataset.cardMotion = read(UI_KEY, { animation: "none" }).animation;
  new MutationObserver(() => {
    syncBackground(card);
    const position = card.querySelector(".card-position")?.textContent?.trim() ?? "";
    if (!position || position === previousPosition) return;
    const index = Number(position.split("/")[0]?.trim()) || 0;
    if (previousPosition) animateCard(card, index >= previousIndex ? "next" : "previous");
    previousPosition = position;
    previousIndex = index;
  }).observe(card, { childList: true, subtree: true, attributes: true, attributeFilter: ["style"] });
  syncBackground(card);
}

function animateCard(card, direction) {
  const animation = read(UI_KEY, { animation: "none" }).animation;
  card.dataset.cardMotion = animation;
  card.dataset.cardDirection = direction;
  card.classList.remove("is-card-transitioning");
  if (animation === "none" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  void card.offsetWidth;
  card.classList.add("is-card-transitioning");
  setTimeout(() => card.classList.remove("is-card-transitioning"), 520);
}

const decodedImages = new Set();
function observeBackground(element) {
  if (!element) return;
  new MutationObserver(() => syncBackground(element)).observe(element, { attributes: true, attributeFilter: ["style"] });
  syncBackground(element);
}

function syncBackground(element) {
  const value = element.style.getPropertyValue("--card-image").trim();
  const url = value.match(/^url\(["']?(.*?)["']?\)$/)?.[1];
  if (!url || decodedImages.has(url)) {
    element.classList.add("card-background-ready");
    return;
  }
  element.classList.remove("card-background-ready");
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  const loaded = image.decode ? image.decode() : new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });
  loaded.then(() => {
    decodedImages.add(url);
    if (element.style.getPropertyValue("--card-image").includes(url)) element.classList.add("card-background-ready");
  }).catch(() => element.classList.add("card-background-ready"));
}
