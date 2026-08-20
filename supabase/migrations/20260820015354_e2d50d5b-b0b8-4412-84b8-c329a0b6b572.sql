REVOKE ALL ON public.nicho_seed_accounts FROM anon, authenticated;
GRANT ALL ON public.nicho_seed_accounts TO service_role;

DROP POLICY IF EXISTS "No client access to seed accounts" ON public.nicho_seed_accounts;
CREATE POLICY "No client access to seed accounts"
  ON public.nicho_seed_accounts
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);