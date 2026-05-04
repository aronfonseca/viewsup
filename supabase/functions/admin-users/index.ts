import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "aronfonseca2020@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const caller = userData.user;
    if (!caller || caller.email?.toLowerCase() !== ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const body = req.method === "POST" ? await req.json() : {};
    const action = body.action ?? "list";

    if (action === "list") {
      const { data: profiles, error: pErr } = await admin
        .from("profiles")
        .select("user_id, display_name, plan, analyses_remaining, analyses_limit, created_at, period_end")
        .order("created_at", { ascending: false });
      if (pErr) throw pErr;

      // Fetch emails via auth admin (paginate up to 1000)
      const emailMap: Record<string, string> = {};
      let page = 1;
      while (true) {
        const { data: list, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw error;
        for (const u of list.users) emailMap[u.id] = u.email ?? "";
        if (list.users.length < 1000) break;
        page += 1;
        if (page > 20) break;
      }

      const users = (profiles ?? []).map((p) => ({
        ...p,
        email: emailMap[p.user_id] ?? "",
      }));
      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_plan") {
      const { user_id, plan } = body;
      const allowed = ["free", "starter", "pro", "agency"];
      if (!user_id || !allowed.includes(plan)) {
        return new Response(JSON.stringify({ error: "Invalid input" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const limits: Record<string, number> = { free: 3, starter: 15, pro: 60, agency: 999999 };
      const limit = limits[plan];
      const { error } = await admin.from("profiles").update({
        plan,
        analyses_limit: limit,
        analyses_remaining: limit,
        updated_at: new Date().toISOString(),
      }).eq("user_id", user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_analyses") {
      const { user_id, analyses_remaining } = body;
      if (!user_id || typeof analyses_remaining !== "number") {
        return new Response(JSON.stringify({ error: "Invalid input" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await admin.from("profiles").update({
        analyses_remaining,
        updated_at: new Date().toISOString(),
      }).eq("user_id", user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
