import safeRegex from "safe-regex2";

const REGEX_FLAGS = "giu";
const MAX_PATTERN_LENGTH = 256;
const MAX_REGEX_CACHE_ENTRIES = 5000;
const regexCache = new Map();

/**
 * Analyze text against regex patterns stored in the private ban_words table.
 * The source profiles use the i, u, and g flags (sometimes in a different order).
 */
export function analyzeText(text, bannedPatterns) {
  if (typeof text !== "string" || !text.trim()) {
    return { found: [], highlightedHTML: "" };
  }

  const found = [];
  const replacements = [];
  const seenPatterns = new Set();

  for (const rawPattern of bannedPatterns) {
    const pattern = typeof rawPattern === "string" ? rawPattern.trim() : "";
    if (!pattern || seenPatterns.has(pattern)) continue;
    seenPatterns.add(pattern);

    const regex = getPatternRegex(pattern);
    if (!regex) continue;

    let count = 0;
    let firstMatch = "";
    regex.lastIndex = 0;

    try {
      let match;
      while ((match = regex.exec(text)) !== null) {
        if (match[0].length === 0) {
          regex.lastIndex = match.index + 1;
          continue;
        }

        count += 1;
        if (!firstMatch) firstMatch = match[0];
        replacements.push({ start: match.index, end: match.index + match[0].length });
      }
    } catch {
      // Malformed or runtime-incompatible patterns are ignored rather than
      // causing an otherwise valid analysis request to fail.
      continue;
    }

    if (count > 0) found.push({ word: firstMatch, count });
  }

  if (found.length === 0) {
    return { found, highlightedHTML: escapeHTML(text).replace(/\r?\n/g, "<br>") };
  }

  replacements.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const filtered = [];
  for (const replacement of replacements) {
    const overlap = filtered.findIndex((item) => replacement.start < item.end && replacement.end > item.start);
    if (overlap === -1) filtered.push(replacement);
    else if (replacement.end - replacement.start > filtered[overlap].end - filtered[overlap].start) {
      filtered[overlap] = replacement;
    }
  }

  let highlightedHTML = "";
  let cursor = 0;
  for (const replacement of filtered.sort((a, b) => a.start - b.start)) {
    highlightedHTML += escapeHTML(text.slice(cursor, replacement.start)).replace(/\r?\n/g, "<br>");
    highlightedHTML += `<mark class="highlight">${escapeHTML(text.slice(replacement.start, replacement.end)).replace(/\r?\n/g, "<br>")}</mark>`;
    cursor = replacement.end;
  }
  highlightedHTML += escapeHTML(text.slice(cursor)).replace(/\r?\n/g, "<br>");

  return { found, highlightedHTML };
}

function getPatternRegex(pattern) {
  if (pattern.length > MAX_PATTERN_LENGTH) return null;
  if (regexCache.has(pattern)) return regexCache.get(pattern);

  // These two fixed-width word-boundary assertions are used by the source
  // profiles. Remove them only for the safety heuristic; retain the original
  // pattern for actual matching.
  const safetyCheckPattern = pattern
    .replace(/\(\?<!\\w\)/g, "")
    .replace(/\(\?!\\w\)/g, "");

  let regex = null;
  try {
    if (safeRegex(safetyCheckPattern)) regex = new RegExp(pattern, REGEX_FLAGS);
  } catch {
    regex = null;
  }

  if (regexCache.size < MAX_REGEX_CACHE_ENTRIES) regexCache.set(pattern, regex);
  return regex;
}

function escapeHTML(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
