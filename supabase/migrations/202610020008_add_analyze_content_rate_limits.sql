CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  bucket_key text PRIMARY KEY,
  window_started timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rate_limit_buckets_updated_at_idx
  ON public.rate_limit_buckets (updated_at);

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rate_limit_buckets FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_bucket_key text,
  p_window_seconds integer,
  p_limit integer
)
RETURNS TABLE (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_now timestamptz := clock_timestamp();
  bucket_start timestamptz;
  current_count integer;
BEGIN
  IF p_window_seconds <= 0 OR p_limit <= 0 OR length(p_bucket_key) = 0 THEN
    RAISE EXCEPTION 'Invalid rate limit parameters';
  END IF;

  INSERT INTO public.rate_limit_buckets (bucket_key, window_started, request_count, updated_at)
  VALUES (p_bucket_key, request_now, 1, request_now)
  ON CONFLICT (bucket_key) DO UPDATE
  SET window_started = CASE
        WHEN rate_limit_buckets.window_started <= request_now - make_interval(secs => p_window_seconds)
          THEN request_now
        ELSE rate_limit_buckets.window_started
      END,
      request_count = CASE
        WHEN rate_limit_buckets.window_started <= request_now - make_interval(secs => p_window_seconds)
          THEN 1
        ELSE LEAST(rate_limit_buckets.request_count + 1, p_limit + 1)
      END,
      updated_at = request_now
  RETURNING window_started, request_count INTO bucket_start, current_count;

  allowed := current_count <= p_limit;
  remaining := GREATEST(p_limit - current_count, 0);
  retry_after_seconds := CASE
    WHEN allowed THEN 0
    ELSE GREATEST(
      1,
      CEIL(EXTRACT(EPOCH FROM (bucket_start + make_interval(secs => p_window_seconds) - request_now)))::integer
    )
  END;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO service_role;
