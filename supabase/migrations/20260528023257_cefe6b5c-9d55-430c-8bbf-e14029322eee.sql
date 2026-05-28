
-- Subscriptions: explicit restrictive deny for non-service roles
CREATE POLICY "Deny insert on subscriptions for non-service roles"
ON public.subscriptions AS RESTRICTIVE FOR INSERT TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "Deny update on subscriptions for non-service roles"
ON public.subscriptions AS RESTRICTIVE FOR UPDATE TO anon, authenticated
USING (false) WITH CHECK (false);

CREATE POLICY "Deny delete on subscriptions for non-service roles"
ON public.subscriptions AS RESTRICTIVE FOR DELETE TO anon, authenticated
USING (false);

-- user_feedbacks: enforce user_id not null and block anon reads
DELETE FROM public.user_feedbacks WHERE user_id IS NULL;
ALTER TABLE public.user_feedbacks ALTER COLUMN user_id SET NOT NULL;

CREATE POLICY "Deny anon reads on user_feedbacks"
ON public.user_feedbacks AS RESTRICTIVE FOR SELECT TO anon
USING (false);
