// ui-enhancements imports this module after runtime-data has installed its fetch adapter,
// so the guided adapter can safely wrap the existing built-in and imported-deck behavior.
import "./guided-runtime.js";

export function extractCardBackgroundUrl(value = "") {
  return String(value).trim().match(/^url\(["']?(.*?)["']?\)$/)?.[1] ?? "";
}

export function shouldReuseCardBackground(previousUrl, currentUrl) {
  return Boolean(currentUrl && previousUrl === currentUrl);
}
