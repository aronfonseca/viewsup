// Lets an admin review AI-suggested reference accounts (nicho_seed_accounts
// with suggested_by='ai') from the Admin UI: list pending ones, approve or
// reject by id. Manually-curated rows (suggested_by='manual') are inserted
// as 'approved' directly via SQL and never show up here.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAILS = new Set([
  "aronfonseca2020@gmail.com",
  "aronfonsecaoficial@gmail.com",
]);

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
    if (!caller || !ADMIN_EMAILS.has((caller.email || "").toLowerCase())) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const body = req.method === "POST" ? await req.json() : {};
    const action = body.action ?? "list";

    if (action === "list") {
      const { data, error } = await admin
        .from("nicho_seed_accounts")
        .select("id, nicho, username, status, suggested_by, reasoning, source, created_at")
        .eq("status", "pending")
        .order("nicho", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return new Response(JSON.stringify({ suggestions: data ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "approve" || action === "reject") {
      const { id } = body;
      if (!id || typeof id !== "string") {
        return new Response(JSON.stringify({ error: "Invalid input" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const status = action === "approve" ? "approved" : "rejected";
      const { error } = await admin
        .from("nicho_seed_accounts")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
