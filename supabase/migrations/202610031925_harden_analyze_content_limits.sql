CREATE TABLE IF NOT EXISTS public.analyze_content_slots (
  slot_id uuid PRIMARY KEY,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS analyze_content_slots_expires_at_idx
  ON public.analyze_content_slots (expires_at);

ALTER TABLE public.analyze_content_slots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.analyze_content_slots FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.acquire_analyze_content_slot(
  p_max_slots integer,
  p_lease_seconds integer
)
RETURNS TABLE (allowed boolean, slot_id uuid, retry_after_seconds integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  request_now timestamptz := clock_timestamp();
  active_slots integer;
  new_slot uuid;
BEGIN
  IF p_max_slots <= 0 OR p_lease_seconds <= 0 THEN RAISE EXCEPTION 'Invalid concurrency parameters'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('analyze_content_slots', 0));
  DELETE FROM public.analyze_content_slots WHERE expires_at <= request_now;
  SELECT count(*) INTO active_slots FROM public.analyze_content_slots WHERE expires_at > request_now;
  IF active_slots >= p_max_slots THEN
    allowed := false; slot_id := NULL; retry_after_seconds := 2; RETURN NEXT; RETURN;
  END IF;
  new_slot := gen_random_uuid();
  INSERT INTO public.analyze_content_slots (slot_id, acquired_at, expires_at)
  VALUES (new_slot, request_now, request_now + make_interval(secs => p_lease_seconds));
  allowed := true; slot_id := new_slot; retry_after_seconds := 0; RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_analyze_content_slot(p_slot_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$ DELETE FROM public.analyze_content_slots WHERE slot_id = p_slot_id; $$;

REVOKE ALL ON FUNCTION public.acquire_analyze_content_slot(integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_analyze_content_slot(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_analyze_content_slot(integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_analyze_content_slot(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_bucket_key text, p_window_seconds integer, p_limit integer
)
RETURNS TABLE (allowed boolean, remaining integer, retry_after_seconds integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  request_now timestamptz := clock_timestamp();
  bucket_start timestamptz;
  current_count integer;
BEGIN
  IF p_window_seconds <= 0 OR p_limit <= 0 OR length(p_bucket_key) = 0 THEN RAISE EXCEPTION 'Invalid rate limit parameters'; END IF;
  DELETE FROM public.rate_limit_buckets WHERE updated_at < request_now - interval '24 hours';
  INSERT INTO public.rate_limit_buckets (bucket_key, window_started, request_count, updated_at)
  VALUES (p_bucket_key, request_now, 1, request_now)
  ON CONFLICT (bucket_key) DO UPDATE
  SET window_started = CASE WHEN rate_limit_buckets.window_started <= request_now - make_interval(secs => p_window_seconds) THEN request_now ELSE rate_limit_buckets.window_started END,
      request_count = CASE WHEN rate_limit_buckets.window_started <= request_now - make_interval(secs => p_window_seconds) THEN 1 ELSE LEAST(rate_limit_buckets.request_count + 1, p_limit + 1) END,
      updated_at = request_now
  RETURNING window_started, request_count INTO bucket_start, current_count;
  allowed := current_count <= p_limit;
  remaining := GREATEST(p_limit - current_count, 0);
  retry_after_seconds := CASE WHEN allowed THEN 0 ELSE GREATEST(1, CEIL(EXTRACT(EPOCH FROM (bucket_start + make_interval(secs => p_window_seconds) - request_now)))::integer) END;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO service_role;
