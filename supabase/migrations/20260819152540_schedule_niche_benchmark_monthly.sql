-- ============================================================
-- Monthly cron job: call niche-benchmark-agent for all niches
-- that have curated accounts in nicho_seed_accounts (the function
-- itself skips niches with no seed accounts, so this is safe to
-- run even while the table is still empty — it just does nothing).
-- Requires the same Vault secret 'cron_shared_secret' used by the
-- niche-research-weekly cron job (see that migration's comment).
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'niche-benchmark-monthly') THEN
    PERFORM cron.unschedule('niche-benchmark-monthly');
  END IF;
END $$;

-- Runs at 07:00 UTC on the 1st of every month (offset from the weekly
-- niche-research job so the two don't hit Apify/Anthropic at the same time).
SELECT cron.schedule(
  'niche-benchmark-monthly',
  '0 7 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://tbxjtxzokhwobxipcwkb.supabase.co/functions/v1/niche-benchmark-agent',
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
