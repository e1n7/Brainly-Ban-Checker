import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { analyzeText } from "../../../lib/analyzeText.js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

const ALLOWED_COUNTRIES = new Set(["PH", "US", "BR", "RO"]);
const WORD_CACHE_TTL_MS = 5 * 60 * 1000;
const RATE_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;
const MAX_WORDS_PER_PAGE = 1000;
const wordCache = new Map<string, { words: string[]; expiresAt: number }>();
const rateLimit = new Map<string, { count: number; windowStartedAt: number }>();

async function getBannedWords(countryCode: string) {
  const cached = wordCache.get(countryCode);
  if (cached && cached.expiresAt > Date.now()) return cached.words;

  const words: string[] = [];
  for (let offset = 0; ; offset += MAX_WORDS_PER_PAGE) {
    const { data, error } = await supabase
      .from("ban_words")
      .select("word")
      .eq("country_code", countryCode)
      .eq("enabled", true)
      .range(offset, offset + MAX_WORDS_PER_PAGE - 1);
    if (error) throw error;
    words.push(...(data ?? []).map((row) => row.word));
    if (!data || data.length < MAX_WORDS_PER_PAGE) break;
  }

  wordCache.set(countryCode, { words, expiresAt: Date.now() + WORD_CACHE_TTL_MS });
  return words;
}

function getClientKey(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function isRateLimited(key: string) {
  const now = Date.now();
  const current = rateLimit.get(key);
  if (!current || now - current.windowStartedAt >= RATE_WINDOW_MS) {
    rateLimit.set(key, { count: 1, windowStartedAt: now });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

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
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);
  if (isRateLimited(getClientKey(req))) {
    return jsonResponse({ error: "Too many requests. Please try again later." }, 429);
  }

  try {
    const { text, countryCode } = await req.json();
    if (typeof text !== "string" || !text.trim() || text.length > 20000 || !ALLOWED_COUNTRIES.has(countryCode)) {
      return jsonResponse({ error: "Invalid request." }, 400);
    }

    const result = analyzeText(text, await getBannedWords(countryCode));
    // Never return the private terms. Only aggregate counts are public.
    return jsonResponse({
      found: result.found.map(({ count }) => ({ count })),
      matchCount: result.found.length,
      highlightedHTML: result.highlightedHTML,
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: "Unable to analyze content." }, 500);
  }
});
