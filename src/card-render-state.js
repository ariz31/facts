const CARD_TYPES = new Set(["concept", "fact", "question", "code", "steps", "checklist"]);
const CARD_STATUSES = new Set(["untouched", "review", "mastered"]);
const MANAGED_PREFIXES = ["card-type-", "status-"];

export function syncStudyCardClasses(element, cardType, status) {
  if (!element?.classList) return;

  for (const className of [...element.classList]) {
    if (MANAGED_PREFIXES.some((prefix) => className.startsWith(prefix))) {
      element.classList.remove(className);
    }
  }

  element.classList.add("study-card", "immersive-card");
  element.classList.add(`card-type-${CARD_TYPES.has(cardType) ? cardType : "concept"}`);
  element.classList.add(`status-${CARD_STATUSES.has(status) ? status : "untouched"}`);
}
