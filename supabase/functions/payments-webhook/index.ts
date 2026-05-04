import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyWebhook, EventName, type PaddleEnv } from '../_shared/paddle.ts';

const PLAN_LIMITS: Record<string, { plan: string; limit: number }> = {
  starter_plan: { plan: 'starter', limit: 15 },
  pro_plan: { plan: 'pro', limit: 60 },
  agency_plan: { plan: 'agency', limit: 999999 },
};

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
  }
  return _supabase;
}

async function applyPlanToProfile(
  userId: string,
  productId: string,
  periodEnd: string | null | undefined,
  resetCounter: boolean,
) {
  const tier = PLAN_LIMITS[productId];
  if (!tier) {
    console.warn('Unknown product, skipping profile update:', productId);
    return;
  }
  const update: Record<string, unknown> = {
    plan: tier.plan,
    analyses_limit: tier.limit,
    period_end: periodEnd ?? null,
    updated_at: new Date().toISOString(),
  };
  if (resetCounter) update.analyses_remaining = tier.limit;
  await getSupabase().from('profiles').update(update).eq('user_id', userId);
}

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;
  const userId = customData?.userId;
  if (!userId) { console.error('No userId in customData'); return; }

  const item = items[0];
  const priceId = item.price.importMeta?.externalId;
  const productId = item.product.importMeta?.externalId;
  if (!priceId || !productId) {
    console.warn('Skipping: missing importMeta.externalId');
    return;
  }

  await getSupabase().from('subscriptions').upsert({
    user_id: userId,
    paddle_subscription_id: id,
    paddle_customer_id: customerId,
    product_id: productId,
    price_id: priceId,
    status,
    current_period_start: currentBillingPeriod?.startsAt,
    current_period_end: currentBillingPeriod?.endsAt,
    environment: env,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'paddle_subscription_id' });

  // New subscription → reset counter to plan limit
  await applyPlanToProfile(userId, productId, currentBillingPeriod?.endsAt, true);
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, items, currentBillingPeriod, scheduledChange, customData } = data;

  // Find existing row to detect plan change vs renewal
  const { data: existing } = await getSupabase()
    .from('subscriptions')
    .select('product_id, current_period_start')
    .eq('paddle_subscription_id', id)
    .eq('environment', env)
    .maybeSingle();

  await getSupabase().from('subscriptions')
    .update({
      status,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      cancel_at_period_end: scheduledChange?.action === 'cancel',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', id)
    .eq('environment', env);

  const item = items?.[0];
  const productId = item?.product?.importMeta?.externalId;
  const userId = customData?.userId;
  if (!userId || !productId || status !== 'active') return;

  // Reset counter ONLY when plan changed OR billing period rolled over (renewal).
  // Skips trivial updates like payment-method changes that previously zeroed the quota mid-cycle.
  const planChanged = existing && (existing as any).product_id !== productId;
  const periodChanged = existing && (existing as any).current_period_start !== currentBillingPeriod?.startsAt;
  const shouldReset = !existing || planChanged || periodChanged;

  await applyPlanToProfile(userId, productId, currentBillingPeriod?.endsAt, !!shouldReset);
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  // User keeps access until period end — only mark canceled.
  // Downgrade to free is handled by the scheduled `downgrade-expired` function.
  await getSupabase().from('subscriptions')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('paddle_subscription_id', data.id)
    .eq('environment', env);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const url = new URL(req.url);
  const env = (url.searchParams.get('env') || 'sandbox') as PaddleEnv;

  try {
    const event = await verifyWebhook(req, env);
    console.log('Webhook event:', event.eventType);

    switch (event.eventType) {
      case EventName.SubscriptionCreated:
        await handleSubscriptionCreated(event.data, env); break;
      case EventName.SubscriptionUpdated:
        await handleSubscriptionUpdated(event.data, env); break;
      case EventName.SubscriptionCanceled:
        await handleSubscriptionCanceled(event.data, env); break;
      default:
        console.log('Unhandled event:', event.eventType);
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Webhook error:', e);
    return new Response('Webhook error', { status: 400 });
  }
});
