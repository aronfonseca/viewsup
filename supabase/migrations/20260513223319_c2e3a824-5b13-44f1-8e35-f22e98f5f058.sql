
-- Device account tracking for 2-account-per-device limit
CREATE TABLE public.device_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  user_id uuid NOT NULL,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_id, user_id)
);

CREATE INDEX idx_device_accounts_device_id ON public.device_accounts(device_id);
CREATE INDEX idx_device_accounts_ip ON public.device_accounts(ip_address);
CREATE INDEX idx_device_accounts_user_id ON public.device_accounts(user_id);

ALTER TABLE public.device_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own device records"
ON public.device_accounts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage device records"
ON public.device_accounts
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
