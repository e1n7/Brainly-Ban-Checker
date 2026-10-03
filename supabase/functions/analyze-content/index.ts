import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { analyzeText } from "./analyzeText.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

const ALLOWED_COUNTRIES = new Set(["PH", "US", "BR", "RO"]);
const WORD_CACHE_TTL_MS = 5 * 60 * 1000;
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 30;
const IP_RATE_LIMIT_MAX_REQUESTS = 120;
const MAX_CONCURRENT_REQUESTS = 20;
const CONCURRENCY_LEASE_SECONDS = 30;
const MAX_WORDS_PER_PAGE = 1000;
const wordCache = new Map<string, { words: string[]; expiresAt: number }>();
const DEFAULT_ALLOWED_ORIGINS = new Set([
  "https://3001-ieoh7kkmg0yp1albdiqkc-5e80eff0.sg2.manus.computer",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
]);

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
  return req.headers.get("cf-connecting-ip")?.trim()
    ?? req.headers.get("x-real-ip")?.trim()
    ?? "unknown";
}

async function hashRateLimitIdentity(identity: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`analyze-content:${identity}`));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function consumeBucket(bucketKey: string, limit: number) {
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_bucket_key: bucketKey,
    p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    p_limit: limit,
  }).single();
  if (error || !data) throw error ?? new Error("Rate limit check returned no data");
  return {
    allowed: data.allowed === true,
    retryAfterSeconds: Number(data.retry_after_seconds) || 0,
  };
}

async function consumeRateLimit(req: Request) {
  try {
    const ipBucket = await consumeBucket(
      `analyze:ip:${await hashRateLimitIdentity(getRateLimitIdentity(req))}`,
      IP_RATE_LIMIT_MAX_REQUESTS,
    );
    const clientId = req.headers.get("x-client-id")?.trim();
    const clientBucket = clientId && /^[A-Za-z0-9-]{16,100}$/.test(clientId)
      ? await consumeBucket(`analyze:client:${await hashRateLimitIdentity(clientId)}`, RATE_LIMIT_MAX_REQUESTS)
      : { allowed: true, retryAfterSeconds: 0 };

    return {
      available: true,
      allowed: ipBucket.allowed && clientBucket.allowed,
      retryAfterSeconds: Math.max(ipBucket.retryAfterSeconds, clientBucket.retryAfterSeconds),
    };
  } catch (error) {
    console.error("Rate limit check failed", error);
    return { available: false, allowed: false, retryAfterSeconds: 5 };
  }
}

function getAllowedOrigins() {
  const configured = Deno.env.get("ALLOWED_ORIGINS")?.split(",").map((origin) => origin.trim()).filter(Boolean);
  return new Set(configured?.length ? configured : DEFAULT_ALLOWED_ORIGINS);
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info, x-client-id",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (origin && getAllowedOrigins().has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }
  return headers;
}

function jsonResponse(req: Request, body: Record<string, unknown>, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), ...extraHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: getCorsHeaders(req) });
  if (req.method !== "POST") return jsonResponse(req, { error: "Method not allowed." }, 405);

  try {
    const { text, countryCode } = await req.json();
    if (typeof text !== "string" || !text.trim() || text.length > 20000 || !ALLOWED_COUNTRIES.has(countryCode)) {
      return jsonResponse(req, { error: "Invalid request." }, 400);
    }

    const { data: slot, error: slotError } = await supabase.rpc("acquire_analyze_content_slot", {
      p_max_slots: MAX_CONCURRENT_REQUESTS,
      p_lease_seconds: CONCURRENCY_LEASE_SECONDS,
    }).single();
    if (slotError || !slot || slot.allowed !== true || !slot.slot_id) {
      return jsonResponse(
        req,
        { error: "The analyzer is busy right now. Please wait a moment and try again." },
        503,
        { "Retry-After": String(Number(slot?.retry_after_seconds) || 2) },
      );
    }

    try {
      const rateLimit = await consumeRateLimit(req);
      if (!rateLimit.available) {
        return jsonResponse(req, { error: "The analyzer is temporarily unavailable. Please try again shortly." }, 503, { "Retry-After": String(rateLimit.retryAfterSeconds) });
      }
      if (!rateLimit.allowed) {
        return jsonResponse(req, { error: "Too many scans. Please wait a moment and try again." }, 429, { "Retry-After": String(rateLimit.retryAfterSeconds) });
      }

      const result = analyzeText(text, await getBannedWords(countryCode));
      return jsonResponse(req, {
        found: result.found,
        matchCount: result.found.length,
        highlightedHTML: result.highlightedHTML,
      });
    } finally {
      await supabase.rpc("release_analyze_content_slot", { p_slot_id: slot.slot_id });
    }
  } catch (error) {
    console.error(error);
    return jsonResponse(req, { error: "Unable to analyze content." }, 500);
  }
});
