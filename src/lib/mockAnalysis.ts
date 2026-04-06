import { supabase } from "@/integrations/supabase/client";

export interface Dimension {
  name: string;
  score: number;
  label: string;
  icon: string;
}

export interface ProfileAnalysis {
  url: string;
  username: string;
  overallScore: number;
  dimensions: Dimension[];
  issues: string[];
  patterns: string[];
  improvedHooks: string[];
  rewrittenCaptions: { original: string; rewritten: string }[];
}

export async function analyzeProfile(url: string): Promise<ProfileAnalysis> {
  const { data, error } = await supabase.functions.invoke("analyze", {
    body: { url },
  });

  if (error) {
    throw new Error(error.message || "Analysis failed");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as ProfileAnalysis;
}
