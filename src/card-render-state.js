import "./guided-runtime.js";

export function extractCardBackgroundUrl(value = "") {
  return String(value).trim().match(/^url\(["']?(.*?)["']?\)$/)?.[1] ?? "";
}

export function shouldReuseCardBackground(previousUrl, currentUrl) {
  return Boolean(currentUrl && previousUrl === currentUrl);
}
