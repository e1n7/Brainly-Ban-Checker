import test from "node:test";
import assert from "node:assert/strict";
import { analyzeText } from "../lib/analyzeText.js";

test("matches regex rules case-insensitively with word-boundary assertions", () => {
  const result = analyzeText("Bimbo bimbology BIMBO!", ["(?<!\\w)bimbo(?!\\w)"]);
  assert.deepEqual(result.found, [{ word: "Bimbo", count: 2 }]);
  assert.equal((result.highlightedHTML.match(/<mark/g) || []).length, 2);
  assert.match(result.highlightedHTML, /<mark class="highlight">Bimbo<\/mark>/);
  assert.match(result.highlightedHTML, /<mark class="highlight">BIMBO<\/mark>/);
  assert.doesNotMatch(result.highlightedHTML, /<mark class="highlight">bimbo<\/mark>logy/);
});

test("continues to match ordinary plain-text patterns", () => {
  const result = analyzeText("Bad BAD okay", ["bad"]);
  assert.deepEqual(result.found, [{ word: "Bad", count: 2 }]);
  assert.equal((result.highlightedHTML.match(/<mark/g) || []).length, 2);
});

test("escapes user HTML before highlighting", () => {
  const result = analyzeText('<script>alert("x")</script> bad', ["bad"]);
  assert.match(result.highlightedHTML, /&lt;script&gt;/);
  assert.doesNotMatch(result.highlightedHTML, /<script>/);
});

test("prefers the longer overlapping regex match for highlighting", () => {
  const result = analyzeText("badword", ["bad", "bad\\w+"]);
  assert.equal((result.highlightedHTML.match(/<mark/g) || []).length, 1);
  assert.match(result.highlightedHTML, /<mark class="highlight">badword<\/mark>/);
});

test("deduplicates identical patterns and skips invalid or risky patterns", () => {
  const result = analyzeText("bimbo", ["(?<!\\w)bimbo", "(?<!\\w)bimbo", "(", "(a+)+$"]);
  assert.deepEqual(result.found, [{ word: "bimbo", count: 1 }]);
  assert.equal((result.highlightedHTML.match(/<mark/g) || []).length, 1);
});

test("ignores zero-width matches and handles empty input or patterns", () => {
  assert.deepEqual(analyzeText("   ", ["bad"]), { found: [], highlightedHTML: "" });
  assert.deepEqual(analyzeText("safe", ["", "  "]), { found: [], highlightedHTML: "safe" });
  assert.deepEqual(analyzeText("abc", ["^", "$"]), { found: [], highlightedHTML: "abc" });
});
