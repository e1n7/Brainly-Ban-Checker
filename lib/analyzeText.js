/**
 * Analyze plain text against a list of banned terms.
 * The returned `found` entries contain the term for server-side use only.
 */
export function analyzeText(text, bannedWords) {
  if (typeof text !== "string" || !text.trim()) {
    return { found: [], highlightedHTML: "" };
  }

  const found = [];
  const lowerText = text.toLocaleLowerCase();

  for (const rawWord of bannedWords) {
    const word = typeof rawWord === "string" ? rawWord.trim() : "";
    const lowerWord = word.toLocaleLowerCase();
    if (!lowerWord) continue;

    let count = 0;
    let searchStart = 0;
    while ((searchStart = lowerText.indexOf(lowerWord, searchStart)) !== -1) {
      count += 1;
      searchStart += lowerWord.length;
    }
    if (count > 0) found.push({ word, count });
  }

  let highlightedHTML = escapeHTML(text).replace(/\r?\n/g, "<br>");
  if (found.length === 0) return { found, highlightedHTML };

  const replacements = [];
  for (const { word } of [...found].sort((a, b) => b.word.length - a.word.length)) {
    const regex = new RegExp(escapeRegExp(word), "giu");
    let match;
    while ((match = regex.exec(text)) !== null) {
      replacements.push({ start: match.index, end: match.index + match[0].length, word: match[0] });
      if (match[0].length === 0) regex.lastIndex += 1;
    }
  }

  replacements.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const filtered = [];
  for (const replacement of replacements) {
    const overlap = filtered.findIndex((item) => replacement.start < item.end && replacement.end > item.start);
    if (overlap === -1) filtered.push(replacement);
    else if (replacement.end - replacement.start > filtered[overlap].end - filtered[overlap].start) filtered[overlap] = replacement;
  }

  let result = text;
  for (const replacement of filtered.sort((a, b) => b.start - a.start)) {
    result = result.slice(0, replacement.start) + "___MARK_START___" + result.slice(replacement.start, replacement.end) + "___MARK_END___" + result.slice(replacement.end);
  }

  highlightedHTML = escapeHTML(result)
    .replace(/\r?\n/g, "<br>")
    .replace(/___MARK_START___/g, '<mark class="highlight">')
    .replace(/___MARK_END___/g, "</mark>");

  return { found, highlightedHTML };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHTML(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
