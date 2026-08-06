import assert from "node:assert/strict";
import test from "node:test";
import {
  extractCardBackgroundUrl,
  shouldReuseCardBackground,
} from "../src/card-render-state.js";

test("extractCardBackgroundUrl handles quoted and unquoted CSS urls", () => {
  assert.equal(extractCardBackgroundUrl('url("blob:https://example.test/image")'), "blob:https://example.test/image");
  assert.equal(extractCardBackgroundUrl("url(blob:https://example.test/image)"), "blob:https://example.test/image");
  assert.equal(extractCardBackgroundUrl("none"), "");
});

test("the same decoded background is reused across card rerenders", () => {
  assert.equal(shouldReuseCardBackground("blob:one", "blob:one"), true);
  assert.equal(shouldReuseCardBackground("blob:one", "blob:two"), false);
  assert.equal(shouldReuseCardBackground("", ""), false);
});
