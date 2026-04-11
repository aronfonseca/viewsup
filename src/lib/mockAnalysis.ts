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

export interface VisualConsistency extends AdvancedSection {
  hasColorPattern: boolean;
  hasFontPattern: boolean;
  hostFaceVisible: boolean;
}

export interface BioHook {
  hasUSP: boolean;
  hasVisibleLink: boolean;
  issues: string[];
  insight: string;
}

export interface EngagementRatio {
  ratio: number;
  avgLikes: number;
  avgComments: number;
  healthLabel: "Healthy" | "Average" | "Low" | "Critical";
  issues: string[];
  insight: string;
}

export interface ProfileHealth {
  visualConsistency: VisualConsistency;
  bioHook: BioHook;
  engagementRatio: EngagementRatio;
}

export interface HookRetention extends AdvancedSection {
  audienceLostPercent: number;
  hasVisualHook: boolean;
  hasVerbalHook: boolean;
}

export interface VisualFatigue extends AdvancedSection {
  avgSecondsBetweenCuts: number;
  staticSegments: number;
}

export interface SafeZoneAudit extends AdvancedSection {
  captionsOutOfZone: number;
  ctasHidden: number;
}

export interface AudioClarity extends AdvancedSection {
  hasBackgroundMusic: boolean;
  hasSoundEffects: boolean;
}

export interface CtaStrength extends AdvancedSection {
  avgCtasPerVideo: number;
}

export interface BenchmarkGap {
  issues: string[];
  insight: string;
}

export interface HormoziGap extends BenchmarkGap {
  editDensityGap: number;
  hookAggressivenessGap: number;
  cutFrequencyGap: number;
}

export interface StevenGap extends BenchmarkGap {
  storytellingGap: number;
  productionQualityGap: number;
  emotionalDepthGap: number;
}

export interface BenchmarkComparison {
  hormoziGap: HormoziGap;
  stevenGap: StevenGap;
  top3MissingElements: string[];
}

export interface CaptionLanguageQuality extends AdvancedSection {
  grammarErrors: number;
}

export interface ContentPillar {
  theme: string;
  reasoning: string;
  exampleHook: string;
}

export interface BurningProblem {
  problem: string;
  impact: string;
  solution: string;
}

export interface RecentPost {
  postUrl: string;
  shortCode: string;
  description: string;
}

export interface TrendItem {
  title: string;
  description: string;
  example: string;
  relevance: string;
}

export interface ScriptSuggestion {
  title: string;
  hook: string;
  visualDirection: string;
  whyItWorks: string;
}

export interface RoiProjection {
  currentEstimatedReach: number;
  projectedReach: number;
  growthPercent: number;
  assumptions: string[];
}

export interface ViralScore {
  probability: number;
  hookStrengthFactor: number;
  editDensityFactor: number;
  verdict: string;
}

export interface DopamineTrigger {
  timestampSeconds: number;
  type: "zoom" | "sfx" | "cut" | "text";
  label: string;
}

export interface MentalHeatmap {
  totalDurationSeconds: number;
  triggers: DopamineTrigger[];
  insight: string;
}

export interface HookStyleSet {
  topic: string;
  reversePsychology: string;
  extremeCuriosity: string;
  bruteAuthority: string;
  acidHumor: string;
}

export interface TrackSuggestion {
  title: string;
  artist: string;
  bpm: number;
  mood: string;
}

export interface SoundscapeArchitect {
  idealGenre: string;
  bpmRange: string;
  retentionSpeed: string;
  trackSuggestions: TrackSuggestion[];
  insight: string;
}

export interface ProfileAnalysis {
  url: string;
  username: string;
  language: "pt-BR" | "en-GB";
  overallScore: number;
  dimensions: Dimension[];
  profileHealth: ProfileHealth;
  hookRetention: HookRetention;
  visualFatigue: VisualFatigue;
  safeZoneAudit: SafeZoneAudit;
  audioClarity: AudioClarity;
  ctaStrength: CtaStrength;
  benchmarkComparison: BenchmarkComparison;
  captionLanguageQuality: CaptionLanguageQuality;
  contentPillars: ContentPillar[];
  burningProblems: BurningProblem[];
  recentPosts: RecentPost[];
  issues: string[];
  patterns: string[];
  improvedHooks: string[];
  rewrittenCaptions: { original: string; rewritten: string }[];
  trendRadar: TrendItem[];
  scriptSuggestions: ScriptSuggestion[];
  roiProjection: RoiProjection;
  viralScore: ViralScore;
  mentalHeatmap: MentalHeatmap;
  hookStyles: HookStyleSet[];
  soundscapeArchitect: SoundscapeArchitect;
}

export async function analyzeProfile(url: string, language: "pt-BR" | "en-GB" = "pt-BR", companyName?: string): Promise<ProfileAnalysis> {
  const { data, error } = await supabase.functions.invoke("analyze", {
    body: { url, language, companyName: companyName || "ViralLens Insights" },
  });

  if (error) {
    throw new Error(error.message || "Analysis failed");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as ProfileAnalysis;
}
