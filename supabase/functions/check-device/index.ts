// Device-account guard. Limits to 2 distinct user_ids per device.
// Client sends a stable deviceId from localStorage; we capture the IP from
// request headers and check both. If a third user_id tries to register on
// the same device or IP, we reject and the client signs them out.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_ACCOUNTS_PER_DEVICE = 2;
const BLOCK_MESSAGE =
  "Limit of 2 accounts per device reached. Contact support (Aron Fonseca) if you need more access.";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticate the caller using their JWT
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ allowed: false, error: "unauthenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const deviceId = String(body?.deviceId || "").slice(0, 100);
    if (!deviceId || deviceId.length < 8) {
      return new Response(JSON.stringify({ allowed: false, error: "invalid_device_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Capture client IP (best-effort, behind proxies)
    const ip =
      (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "";

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Fetch existing accounts on this device OR this IP
    const { data: rows, error: fetchErr } = await admin
      .from("device_accounts")
      .select("user_id, device_id, ip_address")
      .or(`device_id.eq.${deviceId}${ip ? `,ip_address.eq.${ip}` : ""}`);

    if (fetchErr) {
      console.error("[check-device] fetch error:", fetchErr.message);
      // Fail-open to avoid locking out legit users on infra hiccups
      return new Response(JSON.stringify({ allowed: true, warning: "lookup_failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const distinctUserIds = new Set((rows || []).map((r) => r.user_id));
    const alreadyRegistered = distinctUserIds.has(userId);

    if (!alreadyRegistered && distinctUserIds.size >= MAX_ACCOUNTS_PER_DEVICE) {
      console.log(
        `[check-device] BLOCKED user=${userId} device=${deviceId} ip=${ip} existing=${[...distinctUserIds].join(",")}`,
      );
      return new Response(
        JSON.stringify({ allowed: false, message: BLOCK_MESSAGE }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Upsert the (device_id, user_id) record
    const { error: upsertErr } = await admin
      .from("device_accounts")
      .upsert(
        { device_id: deviceId, user_id: userId, ip_address: ip || null, last_seen_at: new Date().toISOString() },
        { onConflict: "device_id,user_id" },
      );
    if (upsertErr) console.warn("[check-device] upsert failed:", upsertErr.message);

    return new Response(JSON.stringify({ allowed: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[check-device] unexpected:", (e as Error).message);
    return new Response(JSON.stringify({ allowed: true, warning: "exception" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
