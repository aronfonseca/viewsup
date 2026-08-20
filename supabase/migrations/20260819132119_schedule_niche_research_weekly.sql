-- ============================================================
-- Weekly cron job: call niche-research-agent for all niches.
-- Requires a Vault secret named 'cron_shared_secret' holding a
-- random string that also matches the CRON_SHARED_SECRET env var
-- configured for the edge functions (see the functions' auth check).
-- Using a purpose-made shared secret instead of the project's real
-- service_role key means this works even in setups without direct
-- Supabase dashboard access (e.g. Lovable Cloud-managed projects).
-- NEVER commit the actual secret value to a migration file.
-- ============================================================

-- Idempotent: drop any existing job with the same name before recreating it.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'niche-research-weekly') THEN
    PERFORM cron.unschedule('niche-research-weekly');
  END IF;
END $$;

-- Runs every Monday at 06:00 UTC (03:00 America/Sao_Paulo).
SELECT cron.schedule(
  'niche-research-weekly',
  '0 6 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://tbxjtxzokhwobxipcwkb.supabase.co/functions/v1/niche-research-agent',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'cron_shared_secret'
        LIMIT 1
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  ) AS request_id;
  $$
);
