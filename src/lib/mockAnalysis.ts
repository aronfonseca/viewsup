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

export interface VideoIdea {
  title: string;
  format: "Tutorial" | "Polêmica" | "Comparativo" | "Bastidores" | "Prova Social";
  hookVerbal: string;
  structure: { gancho: string; desenvolvimento: string; cta: string };
  bestDay: string;
  bestTime: string;
  hashtags: string[];
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
  videoIdeas: VideoIdea[];
}

/**
 * Enqueue an async analysis job and start the background worker.
 * Returns the jobId immediately — the caller polls analysis_jobs for status.
 *
 * If a recent report (<24h) for the same username exists for this user,
 * returns { cachedReportId } instead, unless `force` is true.
 */
export async function startAnalysisJob(
  url: string,
  language: "pt-BR" | "en-GB" = "pt-BR",
  companyName?: string,
  force = false,
): Promise<{ jobId?: string; cachedReportId?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const username = url.replace(/\/$/, "").split("/").pop() || "unknown";

  if (!force) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: cached } = await supabase
      .from("reports")
      .select("id")
      .eq("user_id", user.id)
      .eq("username", username)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cached?.id) return { cachedReportId: cached.id };
  }

  const { data: job, error: insertErr } = await supabase
    .from("analysis_jobs")
    .insert({
      user_id: user.id,
      instagram_url: url,
      username,
      language,
      company_name: companyName || "Viewsup Insights",
      status: "pending",
    })
    .select("id")
    .single();

  if (insertErr || !job) throw new Error(insertErr?.message || "Failed to create job");

  // Fire-and-forget: trigger the worker. It returns 202 immediately.
  supabase.functions.invoke("process-job", { body: { jobId: job.id } }).catch((e) => {
    console.warn("process-job invoke failed:", e);
  });

  return { jobId: job.id };
}

/**
 * Poll a job until it reaches a terminal state. Resolves with the analysis
 * payload on success, rejects on failure / timeout.
 */
export async function waitForAnalysisJob(
  jobId: string,
  opts: { intervalMs?: number; timeoutMs?: number; onTick?: (status: string) => void } = {},
): Promise<ProfileAnalysis> {
  const interval = opts.intervalMs ?? 5000;
  const timeout = opts.timeoutMs ?? 5 * 60 * 1000; // 5 minutes
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const { data, error } = await supabase
      .from("analysis_jobs")
      .select("status, result_data, error_message")
      .eq("id", jobId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Job not found");

    opts.onTick?.(data.status);

    if (data.status === "completed" && data.result_data) {
      return data.result_data as unknown as ProfileAnalysis;
    }
    if (data.status === "failed") {
      throw new Error(data.error_message || "Analysis failed");
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error("Analysis timed out");
}

/** Convenience wrapper: enqueue + poll. Honours 24h per-profile cache unless `force` is true. */
export async function analyzeProfile(
  url: string,
  language: "pt-BR" | "en-GB" = "pt-BR",
  companyName?: string,
  onStatus?: (status: string) => void,
  force = false,
): Promise<ProfileAnalysis> {
  const { jobId, cachedReportId } = await startAnalysisJob(url, language, companyName, force);
  if (cachedReportId) {
    onStatus?.("completed");
    const { data, error } = await supabase
      .from("reports")
      .select("analysis_data")
      .eq("id", cachedReportId)
      .single();
    if (error || !data?.analysis_data) throw new Error(error?.message || "Cached report not found");
    return data.analysis_data as unknown as ProfileAnalysis;
  }
  return waitForAnalysisJob(jobId!, { onTick: onStatus });
}
