import test from "node:test";
import assert from "node:assert/strict";
import {
  applyPreset,
  DEFAULT_CARD_DESIGN,
  designToCssVariables,
  normalizeCardDesign,
} from "../src/card-design.js";

test("normalizeCardDesign clamps invalid values", () => {
  const design = normalizeCardDesign({
    accent: "not-a-color",
    radius: 100,
    imageOverlay: -20,
    font: "unknown",
  });

  assert.equal(design.accent, DEFAULT_CARD_DESIGN.accent);
  assert.equal(design.radius, 40);
  assert.equal(design.imageOverlay, 0);
  assert.equal(design.font, DEFAULT_CARD_DESIGN.font);
});

test("applyPreset changes visual properties while preserving image controls", () => {
  const design = applyPreset({ imagePosition: "top", imageFit: "contain" }, "editorial");
  assert.equal(design.preset, "editorial");
  assert.equal(design.font, "serif");
  assert.equal(design.imagePosition, "top");
  assert.equal(design.imageFit, "contain");
});

test("designToCssVariables includes an offline object URL", () => {
  const variables = designToCssVariables(DEFAULT_CARD_DESIGN, "blob:https://example.test/background");
  assert.equal(variables["--card-image"], 'url("blob:https://example.test/background")');
  assert.equal(variables["--card-custom-radius"], "24px");
});
