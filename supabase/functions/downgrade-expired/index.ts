// Scheduled job: downgrades profiles back to free plan once their canceled
// subscription's grace period (current_period_end) has passed. Also called
// on-demand from the dashboard for immediate consistency.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FREE_LIMIT = 3;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

  const authHeader = req.headers.get('Authorization') ?? '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const isServiceCall = bearer === SERVICE_KEY;

  // Authenticated user (when not service call) — required to call this endpoint
  let callerId: string | null = null;
  if (!isServiceCall) {
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: u, error: uErr } = await userClient.auth.getUser();
    if (uErr || !u?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    callerId = u.user.id;
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // Optional userId in body for on-demand single-user check
  let onlyUserId: string | undefined;
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      if (typeof body?.userId === 'string') onlyUserId = body.userId;
    } catch { /* ignore */ }
  }

  // Non-service callers may only check/downgrade themselves.
  if (!isServiceCall) {
    if (!onlyUserId || onlyUserId !== callerId) {
      onlyUserId = callerId!;
    }
  }

  // Find expired canceled subscriptions
  let q = supabase
    .from('subscriptions')
    .select('user_id, paddle_subscription_id, current_period_end, status')
    .eq('status', 'canceled')
    .lt('current_period_end', new Date().toISOString());
  if (onlyUserId) q = q.eq('user_id', onlyUserId);

  const { data: expired, error } = await q;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  let downgraded = 0;
  for (const row of expired ?? []) {
    // Only downgrade if there's no other active sub for this user
    const { data: active } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', (row as any).user_id)
      .in('status', ['active', 'trialing', 'past_due'])
      .limit(1);
    if (active && active.length > 0) continue;

    await supabase.from('profiles').update({
      plan: 'free',
      analyses_limit: FREE_LIMIT,
      analyses_remaining: FREE_LIMIT,
      period_end: null,
      updated_at: new Date().toISOString(),
    }).eq('user_id', (row as any).user_id);
    downgraded++;
  }

  return new Response(JSON.stringify({ downgraded, checked: expired?.length ?? 0 }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
