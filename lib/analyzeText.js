import safeRegex from "safe-regex2";

const REGEX_FLAGS = "giu";
const MAX_PATTERN_LENGTH = 256;
const MAX_REGEX_CACHE_ENTRIES = 5000;
const UNICODE_LEFT_BOUNDARY = "(?<![\\p{L}\\p{M}\\p{N}_])";
const UNICODE_RIGHT_BOUNDARY = "(?![\\p{L}\\p{M}\\p{N}_])";
const regexCache = new Map();
const requiredLiteralCache = new Map();

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
  const prefilterText = normalizeForPrefilter(text);

  for (const rawPattern of bannedPatterns) {
    const pattern = typeof rawPattern === "string" ? rawPattern.trim() : "";
    if (!pattern || seenPatterns.has(pattern)) continue;
    seenPatterns.add(pattern);

    const requiredLiteral = getRequiredLiteral(pattern);
    if (requiredLiteral && !prefilterText.includes(requiredLiteral)) continue;

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

  // Strip only the fixed-width ASCII and Unicode boundary assertions used by
  // the stored profiles for the safety heuristic; keep them for actual matching.
  const safetyCheckPattern = pattern
    .replaceAll(UNICODE_LEFT_BOUNDARY, "")
    .replaceAll(UNICODE_RIGHT_BOUNDARY, "")
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

function getRequiredLiteral(pattern) {
  if (requiredLiteralCache.has(pattern)) return requiredLiteralCache.get(pattern);

  const source = pattern
    .replaceAll(UNICODE_LEFT_BOUNDARY, "")
    .replaceAll(UNICODE_RIGHT_BOUNDARY, "")
    .replace(/\(\?<!\\w\)/g, "")
    .replace(/\(\?!\\w\)/g, "");
  const literal = extractRequiredLiteral(source);
  if (requiredLiteralCache.size < MAX_REGEX_CACHE_ENTRIES) requiredLiteralCache.set(pattern, literal);
  return literal;
}

function extractRequiredLiteral(source) {
  let best = "";
  let run = "";
  const flush = () => {
    if (run.length > best.length) best = run;
    run = "";
  };

  for (let index = 0; index < source.length;) {
    const character = source[index];

    if (character === "\\") {
      flush();
      index = skipRegexEscape(source, index);
      continue;
    }

    if (character === "[") {
      flush();
      index = skipCharacterClass(source, index);
      if (index < 0) return null;
      continue;
    }

    if (character === "(") {
      flush();
      if (source.startsWith("(?:", index)) {
        index += 3;
        continue;
      }
      if (source.startsWith("(?=", index) || source.startsWith("(?!", index)
        || source.startsWith("(?<=", index) || source.startsWith("(?<!", index)) {
        const end = findGroupEnd(source, index);
        if (end < 0) return null;
        index = end + 1;
        continue;
      }
      index += 1;
      continue;
    }

    if (character === ")") {
      flush();
      index += 1;
      continue;
    }

    // Alternatives and quantifiers can make a candidate literal optional.
    // In those cases, skip prefiltering and run the full checked regex.
    if (character === "|" || character === "*" || character === "+"
      || character === "?" || character === "{") return null;

    if (/[A-Za-z0-9]/.test(character)) {
      run += character.toLowerCase();
      index += 1;
      continue;
    }

    flush();
    index += 1;
  }

  flush();
  return best.length >= 3 ? best : null;
}

function skipRegexEscape(source, start) {
  const escaped = source[start + 1];
  if (!escaped) return source.length;

  if ((escaped === "p" || escaped === "P") && source[start + 2] === "{") {
    const end = source.indexOf("}", start + 3);
    return end < 0 ? source.length : end + 1;
  }
  if (escaped === "k" && source[start + 2] === "<") {
    const end = source.indexOf(">", start + 3);
    return end < 0 ? source.length : end + 1;
  }
  if (escaped === "u" && source[start + 2] === "{") {
    const end = source.indexOf("}", start + 3);
    return end < 0 ? source.length : end + 1;
  }
  if (escaped === "u") return Math.min(source.length, start + 6);
  if (escaped === "x") return Math.min(source.length, start + 4);
  if (escaped === "c") return Math.min(source.length, start + 3);
  if (/\d/.test(escaped)) {
    let end = start + 2;
    while (end < source.length && /\d/.test(source[end])) end += 1;
    return end;
  }
  return Math.min(source.length, start + 2);
}

function skipCharacterClass(source, start) {
  for (let index = start + 1; index < source.length;) {
    if (source[index] === "\\") {
      index = skipRegexEscape(source, index);
      continue;
    }
    if (source[index] === "]") return index + 1;
    index += 1;
  }
  return -1;
}

function findGroupEnd(source, start) {
  let depth = 0;
  for (let index = start; index < source.length;) {
    if (source[index] === "\\") {
      index = skipRegexEscape(source, index);
      continue;
    }
    if (source[index] === "[") {
      index = skipCharacterClass(source, index);
      if (index < 0) return -1;
      continue;
    }
    if (source[index] === "(") depth += 1;
    else if (source[index] === ")") {
      depth -= 1;
      if (depth === 0) return index;
    }
    index += 1;
  }
  return -1;
}

function normalizeForPrefilter(text) {
  // ECMAScript /iu also folds long-s and Kelvin sign to ASCII s and k.
  return text.toLowerCase().replaceAll("\u017f", "s").replaceAll("\u212a", "k");
}

function escapeHTML(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
