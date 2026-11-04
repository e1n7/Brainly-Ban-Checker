import test from "node:test";
import assert from "node:assert/strict";
import { analyzeText } from "../lib/analyzeText.js";

const LEFT_UNICODE_BOUNDARY = "(?<![\\p{L}\\p{M}\\p{N}_])";
const RIGHT_UNICODE_BOUNDARY = "(?![\\p{L}\\p{M}\\p{N}_])";

function unicodeBounded(pattern) {
  return `${LEFT_UNICODE_BOUNDARY}(?:${pattern})${RIGHT_UNICODE_BOUNDARY}`;
}

test("matches substrings case-insensitively after stripping legacy boundaries", () => {
  const result = analyzeText("Bimbo bimbology BIMBO!", ["(?<!\\w)bimbo(?!\\w)"]);
  assert.deepEqual(result.found, [{ word: "Bimbo", count: 3 }]);
  assert.equal((result.highlightedHTML.match(/<mark/g) || []).length, 3);
  assert.match(result.highlightedHTML, /<mark class="highlight">Bimbo<\/mark>/);
  assert.match(result.highlightedHTML, /<mark class="highlight">bimbo<\/mark>logy/);
  assert.match(result.highlightedHTML, /<mark class="highlight">BIMBO<\/mark>/);
});

test("substring matching accepts Unicode-adjacent letters and combining marks", () => {
  const result = analyzeText(
    "BIMBO! ñbimbo bimboñ ăbimbo bimboț n\u0303bimbo bimbo\u0303",
    [unicodeBounded("bimbo")],
  );
  assert.deepEqual(result.found, [{ word: "BIMBO", count: 7 }]);
  assert.equal((result.highlightedHTML.match(/<mark/g) || []).length, 7);
});

test("matches niga inside ibinigay despite stored Unicode and ASCII boundaries", () => {
  const lookaroundRule = unicodeBounded("(?<!\\w)niga");
  const wordBoundaryRule = unicodeBounded("\\bniga");
  assert.deepEqual(analyzeText("ibinigay", [lookaroundRule]).found, [{ word: "niga", count: 1 }]);
  assert.deepEqual(analyzeText("ibinigay", [wordBoundaryRule]).found, [{ word: "niga", count: 1 }]);
});

test("does not strip escaped backslash text or backspace escapes in character classes", () => {
  const escapedLiteral = unicodeBounded(String.raw`\\bniga`);
  assert.deepEqual(analyzeText("ibinigay", [escapedLiteral]).found, []);
  assert.deepEqual(analyzeText("b", [unicodeBounded("[\\b]")]).found, []);
});

test("prefilter preserves alternatives, optional patterns, and Unicode case folds", () => {
  const result = analyzeText("bar bsta boſta!", [
    unicodeBounded("foo|bar"),
    unicodeBounded("bo?sta"),
    unicodeBounded("bosta"),
  ]);
  assert.deepEqual(result.found, [
    { word: "bar", count: 1 },
    { word: "bsta", count: 2 },
    { word: "boſta", count: 1 },
  ]);
});

test("regex safety checks still reject risky patterns after boundaries are stripped", () => {
  assert.deepEqual(analyzeText("aaaa", [unicodeBounded("(a+)+$")]).found, []);
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
