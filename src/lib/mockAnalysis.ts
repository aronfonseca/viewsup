import { supabase } from "@/integrations/supabase/client";

export interface Dimension {
  name: string;
  score: number;
  label: string;
  icon: string;
}

export interface AdvancedSection {
  score: number;
  issues: string[];
  insight: string;
}

export interface HookRetention extends AdvancedSection {
  audienceLostPercent: number;
}

export interface VisualFatigue extends AdvancedSection {
  avgSecondsBetweenCuts: number;
  staticSegments: number;
}

export interface AudioClarity extends AdvancedSection {
  hasBackgroundMusic: boolean;
  hasSoundEffects: boolean;
}

export interface CtaStrength extends AdvancedSection {
  avgCtasPerVideo: number;
}

export interface BenchmarkComparison {
  comparedTo: string;
  editDensityGap: number;
  captionWordCountAvg: number;
  eliteCaptionWordCountAvg: number;
  issues: string[];
  insight: string;
}

export interface CaptionLanguageQuality extends AdvancedSection {
  grammarErrors: number;
}

export interface ProfileAnalysis {
  url: string;
  username: string;
  overallScore: number;
  dimensions: Dimension[];
  hookRetention: HookRetention;
  visualFatigue: VisualFatigue;
  audioClarity: AudioClarity;
  ctaStrength: CtaStrength;
  benchmarkComparison: BenchmarkComparison;
  captionLanguageQuality: CaptionLanguageQuality;
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
