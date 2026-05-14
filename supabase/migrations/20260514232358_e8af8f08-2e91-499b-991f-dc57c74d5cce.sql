-- Atomic credit consume / refund to prevent race conditions
CREATE OR REPLACE FUNCTION public.consume_analysis_credit(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated int;
BEGIN
  -- Agency plan = unlimited, no decrement needed
  UPDATE public.profiles
  SET analyses_remaining = analyses_remaining - 1,
      updated_at = now()
  WHERE user_id = _user_id
    AND plan <> 'agency'
    AND analyses_remaining > 0;
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated > 0 THEN
    RETURN true;
  END IF;

  -- If user is on agency plan, allow without decrement
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id AND plan = 'agency') THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_analysis_credit(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET analyses_remaining = LEAST(analyses_remaining + 1, analyses_limit),
      updated_at = now()
  WHERE user_id = _user_id
    AND plan <> 'agency';
END;
$$;

-- Restrict execution: only service role should call these directly.
REVOKE ALL ON FUNCTION public.consume_analysis_credit(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_analysis_credit(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_analysis_credit(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_analysis_credit(uuid) TO service_role;