import { createClient } from 'npm:@supabase/supabase-js@2';
import { getPaddleClient, type PaddleEnv } from '../_shared/paddle.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authed = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: ud } = await authed.auth.getUser();
    if (!ud?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { environment } = await req.json().catch(() => ({ environment: 'sandbox' }));
    const env = (environment || 'sandbox') as PaddleEnv;

    const admin = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: sub } = await admin
      .from('subscriptions')
      .select('paddle_customer_id, paddle_subscription_id')
      .eq('user_id', ud.user.id)
      .eq('environment', env)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.paddle_customer_id) {
      return new Response(JSON.stringify({ error: 'No subscription found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paddle = getPaddleClient(env);
    const session = await paddle.customerPortalSessions.create(
      sub.paddle_customer_id as string,
      sub.paddle_subscription_id ? [sub.paddle_subscription_id as string] : [],
    );

    return new Response(JSON.stringify({ url: session.urls.general.overview }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('customer-portal error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
