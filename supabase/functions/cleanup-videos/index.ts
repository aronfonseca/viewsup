// Daily cleanup: deletes video files from storage for jobs older than 7 days,
// keeping the analysis row + result_data so users still see their history.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Calculate date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: expired, error } = await admin
    .from("video_jobs")
    .select("id, storage_path")
    .lt("created_at", sevenDaysAgo.toISOString())
    .not("storage_path", "is", null)
    .limit(500);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let removed = 0;
  for (const job of expired ?? []) {
    if (!job.storage_path) continue;
    const { error: rmErr } = await admin.storage.from("video-uploads").remove([job.storage_path]);
    if (rmErr) {
      console.warn(`[cleanup] failed to remove ${job.storage_path}:`, rmErr.message);
      continue;
    }
    await admin.from("video_jobs").update({ storage_path: null }).eq("id", job.id);
    removed++;
  }

  return new Response(JSON.stringify({ scanned: expired?.length ?? 0, removed }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
