import test from "node:test";
import assert from "node:assert/strict";
import { analyzeText } from "../lib/analyzeText.js";

test("matches terms case-insensitively and counts occurrences", () => {
  const result = analyzeText("Bad BAD okay", ["bad"]);
  assert.deepEqual(result.found, [{ word: "bad", count: 2 }]);
  assert.equal((result.highlightedHTML.match(/<mark/g) || []).length, 2);
});

test("escapes user HTML before highlighting", () => {
  const result = analyzeText('<script>alert("x")</script> bad', ["bad"]);
  assert.match(result.highlightedHTML, /&lt;script&gt;/);
  assert.doesNotMatch(result.highlightedHTML, /<script>/);
});

test("prefers the longer overlapping term for highlighting", () => {
  const result = analyzeText("badword", ["bad", "badword"]);
  assert.equal((result.highlightedHTML.match(/<mark/g) || []).length, 1);
  assert.match(result.highlightedHTML, /<mark class="highlight">badword<\/mark>/);
});

test("ignores empty terms and empty input", () => {
  assert.deepEqual(analyzeText("   ", ["bad"]), { found: [], highlightedHTML: "" });
  assert.deepEqual(analyzeText("safe", ["", "  "]), { found: [], highlightedHTML: "safe" });
});
