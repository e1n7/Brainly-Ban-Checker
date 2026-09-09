import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function analyzeContent(text: string, bannedWords: string[]) {
  if (!text || (typeof text === "string" && !text.trim())) {
    return { found: [], highlightedHTML: "" };
  }

  const lowerText = text.toLowerCase();
  const foundWords: { word: string; count: number }[] = [];

  bannedWords.forEach((word) => {
    const lowerWord = word.toLowerCase();
    if (!lowerWord || !lowerText.includes(lowerWord)) return;

    let count = 0;
    let searchStart = 0;
    while ((searchStart = lowerText.indexOf(lowerWord, searchStart)) !== -1) {
      count += 1;
      searchStart += lowerWord.length;
    }
    foundWords.push({ word, count });
  });

  let highlightedHTML = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  if (foundWords.length > 0) {
    const sorted = [...foundWords].sort((a, b) => b.word.length - a.word.length);
    const replacements: { start: number; end: number; word: string }[] = [];

    sorted.forEach(({ word }) => {
      const regex = new RegExp(escapeRegExp(word), "gi");
      let match;
      while ((match = regex.exec(text)) !== null) {
        replacements.push({
          start: match.index,
          end: match.index + match[0].length,
          word: match[0],
        });
      }
    });

    replacements.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return (b.end - b.start) - (a.end - a.start);
    });

    const filtered: { start: number; end: number; word: string }[] = [];
    for (const replacement of replacements) {
      const overlappingIndex = filtered.findIndex((r) =>
        replacement.start < r.end && replacement.end > r.start
      );
      if (overlappingIndex >= 0) {
        const overlapping = filtered[overlappingIndex];
        const replacementLen = replacement.end - replacement.start;
        const overlappingLen = overlapping.end - overlapping.start;
        if (replacementLen > overlappingLen) filtered[overlappingIndex] = replacement;
      } else {
        filtered.push(replacement);
      }
    }

    filtered.sort((a, b) => b.start - a.start);

    let result = text;
    for (const replacement of filtered) {
      result = result.slice(0, replacement.start) +
        `___MARK_START___${result.slice(replacement.start, replacement.end)}___MARK_END___` +
        result.slice(replacement.end);
    }

    highlightedHTML = result
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>")
      .replace(/___MARK_START___/g, '<mark class="highlight">')
      .replace(/___MARK_END___/g, "</mark>");
  }

  return { found: foundWords, highlightedHTML };
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const { text, countryCode } = await req.json();
    const allowedCountries = ["PH", "US", "BR", "RO"];

    if (typeof text !== "string" || !text.trim() || text.length > 20000 || !allowedCountries.includes(countryCode)) {
      return jsonResponse({ error: "Invalid request." }, 400);
    }

    const { data, error } = await supabase
      .from("ban_words")
      .select("word")
      .eq("country_code", countryCode)
      .eq("enabled", true)
      .limit(5000);

    if (error) throw error;

    const result = analyzeContent(text, data.map((row) => row.word));

    return jsonResponse({
      found: result.found,
      highlightedHTML: result.highlightedHTML,
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: "Unable to analyze content." }, 500);
  }
});
