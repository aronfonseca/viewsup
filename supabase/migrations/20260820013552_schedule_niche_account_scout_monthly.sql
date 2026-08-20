-- ============================================================
-- Monthly cron job: call niche-account-scout for niches that don't
-- yet have enough approved reference accounts (the function itself
-- decides which niches need more via MIN_APPROVED_TARGET). Uses the
-- same 'cron_shared_secret' Vault secret as the other two cron jobs.
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'niche-account-scout-monthly') THEN
    PERFORM cron.unschedule('niche-account-scout-monthly');
  END IF;
END $$;

-- Runs at 08:00 UTC on the 1st of every month (1h after niche-benchmark-monthly).
SELECT cron.schedule(
  'niche-account-scout-monthly',
  '0 8 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://tbxjtxzokhwobxipcwkb.supabase.co/functions/v1/niche-account-scout',
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
