-- ============================================================
-- Weekly cron job: call niche-research-agent for all niches.
-- Requires a Vault secret named 'service_role_key' holding the
-- project's service_role key (see manual step below — NEVER commit
-- the actual key value to a migration file).
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
        WHERE name = 'service_role_key'
        LIMIT 1
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  ) AS request_id;
  $$
);
