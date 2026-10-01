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
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 30;
const MAX_CONCURRENT_REQUESTS = 20;
const MAX_WORDS_PER_PAGE = 1000;
const wordCache = new Map<string, { words: string[]; expiresAt: number }>();
let activeRequests = 0;

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

function getRateLimitIdentity(req: Request) {
  const clientId = req.headers.get("x-client-id")?.trim();
  if (clientId && /^[A-Za-z0-9-]{16,100}$/.test(clientId)) return `client:${clientId}`;

  const address = req.headers.get("cf-connecting-ip")
    ?? req.headers.get("x-real-ip")
    ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "anonymous";
  return `ip:${address}`;
}

async function hashRateLimitIdentity(identity: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`analyze-content:${identity}`));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function consumeRateLimit(req: Request) {
  const bucketKey = `analyze:${await hashRateLimitIdentity(getRateLimitIdentity(req))}`;
  const { data, error } = await supabase
    .rpc("consume_rate_limit", {
      p_bucket_key: bucketKey,
      p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
      p_limit: RATE_LIMIT_MAX_REQUESTS,
    })
    .single();

  if (error || !data) {
    console.error("Rate limit check failed", error);
    return { available: false, allowed: false, retryAfterSeconds: 5 };
  }

  return {
    available: true,
    allowed: data.allowed === true,
    retryAfterSeconds: Number(data.retry_after_seconds) || 0,
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info, x-client-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, ...extraHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  try {
    const { text, countryCode } = await req.json();
    if (typeof text !== "string" || !text.trim() || text.length > 20000 || !ALLOWED_COUNTRIES.has(countryCode)) {
      return jsonResponse({ error: "Invalid request." }, 400);
    }

    if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
      return jsonResponse(
        { error: "The analyzer is busy right now. Please wait a moment and try again." },
        503,
        { "Retry-After": "2" },
      );
    }

    const rateLimit = await consumeRateLimit(req);
    if (!rateLimit.available) {
      return jsonResponse(
        { error: "The analyzer is temporarily unavailable. Please try again shortly." },
        503,
        { "Retry-After": String(rateLimit.retryAfterSeconds) },
      );
    }
    if (!rateLimit.allowed) {
      return jsonResponse(
        { error: "Too many scans. Please wait a moment and try again." },
        429,
        { "Retry-After": String(rateLimit.retryAfterSeconds) },
      );
    }

    activeRequests += 1;
    try {
      const result = analyzeText(text, await getBannedWords(countryCode));
      return jsonResponse({
        found: result.found,
        matchCount: result.found.length,
        highlightedHTML: result.highlightedHTML,
      });
    } finally {
      activeRequests -= 1;
    }
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: "Unable to analyze content." }, 500);
  }
});
