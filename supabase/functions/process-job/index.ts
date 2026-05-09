// Worker that processes a single analysis_jobs row.
// Designed to be triggered by the client right after enqueueing the job.
// The function returns immediately after kicking off background processing
// (EdgeRuntime.waitUntil) so the HTTP request never times out.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Normalised niche list — must mirror the public.profile_niche enum
const NICHE_ENUM = [
  "Imobiliaria", "Fitness", "Beleza", "Moda", "Alimentacao", "Educacao",
  "Tecnologia", "Marketing", "Financas", "Saude", "Coaching", "Ecommerce",
  "Turismo", "Automotivo", "Entretenimento", "Servicos", "B2B", "Lifestyle",
  "Arte", "Outros",
];

const ANALYSIS_SCHEMA = {
  name: "instagram_analysis",
  description: "Lean Instagram audit focused on the most essential retention and content outputs",
  parameters: {
    type: "object",
    properties: {
      nicho: {
        type: "string",
        enum: NICHE_ENUM,
        description: "Detected primary niche of the profile (normalised list).",
      },
      pais: {
        type: "string",
        description: "Best-guess country of the profile (e.g. 'Brasil', 'Portugal', 'United Kingdom'). 'Desconhecido' if not inferrable.",
      },
      overallScore: { type: "number" },
      dimensions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            score: { type: "number" },
            label: { type: "string" },
            icon: { type: "string", enum: ["Zap", "Eye", "MessageCircle", "LayoutGrid", "Heart"] },
          },
          required: ["name", "score", "label", "icon"],
          additionalProperties: false,
        },
      },
      profileHealth: {
        type: "object",
        properties: {
          visualConsistency: {
            type: "object",
            properties: {
              score: { type: "number" },
              hasColorPattern: { type: "boolean" },
              hasFontPattern: { type: "boolean" },
              hostFaceVisible: { type: "boolean" },
              issues: { type: "array", items: { type: "string" } },
              insight: { type: "string" },
            },
            required: ["score", "hasColorPattern", "hasFontPattern", "hostFaceVisible", "issues", "insight"],
            additionalProperties: false,
          },
          bioHook: {
            type: "object",
            properties: {
              hasUSP: { type: "boolean" },
              hasVisibleLink: { type: "boolean" },
              issues: { type: "array", items: { type: "string" } },
              insight: { type: "string" },
            },
            required: ["hasUSP", "hasVisibleLink", "issues", "insight"],
            additionalProperties: false,
          },
          engagementRatio: {
            type: "object",
            properties: {
              ratio: { type: "number" },
              avgLikes: { type: "number" },
              avgComments: { type: "number" },
              healthLabel: { type: "string", enum: ["Healthy", "Average", "Low", "Critical"] },
              issues: { type: "array", items: { type: "string" } },
              insight: { type: "string" },
            },
            required: ["ratio", "avgLikes", "avgComments", "healthLabel", "issues", "insight"],
            additionalProperties: false,
          },
        },
        required: ["visualConsistency", "bioHook", "engagementRatio"],
        additionalProperties: false,
      },
      hookRetention: {
        type: "object",
        properties: {
          score: { type: "number" },
          audienceLostPercent: { type: "number" },
          hasVisualHook: { type: "boolean" },
          hasVerbalHook: { type: "boolean" },
          issues: { type: "array", items: { type: "string" } },
          insight: { type: "string" },
        },
        required: ["score", "audienceLostPercent", "hasVisualHook", "hasVerbalHook", "issues", "insight"],
        additionalProperties: false,
      },
      viralScore: {
        type: "object",
        properties: {
          probability: { type: "number" },
          hookStrengthFactor: { type: "number" },
          editDensityFactor: { type: "number" },
          verdict: { type: "string" },
        },
        required: ["probability", "hookStrengthFactor", "editDensityFactor", "verdict"],
        additionalProperties: false,
      },
      burningProblems: {
        type: "array",
        items: {
          type: "object",
          properties: {
            problem: { type: "string" },
            impact: { type: "string" },
            solution: { type: "string" },
          },
          required: ["problem", "impact", "solution"],
          additionalProperties: false,
        },
      },
      issues: { type: "array", items: { type: "string" } },
      patterns: { type: "array", items: { type: "string" } },
      improvedHooks: { type: "array", items: { type: "string" } },
      rewrittenCaptions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            original: { type: "string" },
            rewritten: { type: "string" },
          },
          required: ["original", "rewritten"],
          additionalProperties: false,
        },
      },
      videoIdeas: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            format: { type: "string", enum: ["Tutorial", "Polêmica", "Comparativo", "Bastidores", "Prova Social"] },
            hookVerbal: { type: "string" },
            structure: {
              type: "object",
              properties: {
                gancho: { type: "string" },
                desenvolvimento: { type: "string" },
                cta: { type: "string" },
              },
              required: ["gancho", "desenvolvimento", "cta"],
              additionalProperties: false,
            },
            bestDay: { type: "string" },
            bestTime: { type: "string" },
            hashtags: { type: "array", items: { type: "string" } },
          },
          required: ["title", "format", "hookVerbal", "structure", "bestDay", "bestTime", "hashtags"],
          additionalProperties: false,
        },
      },
      trendRadar: {
        type: "array",
        minItems: 10,
        maxItems: 10,
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            example: { type: "string" },
            relevance: { type: "string" },
          },
          required: ["title", "description", "example", "relevance"],
          additionalProperties: false,
        },
      },
      scriptSuggestions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            hook: { type: "string" },
            visualDirection: { type: "string" },
            whyItWorks: { type: "string" },
          },
          required: ["title", "hook", "visualDirection", "whyItWorks"],
          additionalProperties: false,
        },
      },
    },
    required: [
      "nicho",
      "pais",
      "overallScore",
      "dimensions",
      "profileHealth",
      "hookRetention",
      "viralScore",
      "burningProblems",
      "issues",
      "patterns",
      "improvedHooks",
      "rewrittenCaptions",
      "videoIdeas",
      "trendRadar",
      "scriptSuggestions",
    ],
    additionalProperties: false,
  },
};

interface PriorAnalysis {
  created_at: string;
  score_geral: number | null;
  hook_strength: number | null;
  retention: number | null;
  engagement: number | null;
  viral_score: number | null;
  problemas_detectados: string[];
}

interface NicheInsightRow {
  nicho: string;
  total_analises: number;
  avg_score_geral: number | null;
  avg_hook_strength: number | null;
  avg_retention: number | null;
  avg_engagement: number | null;
  avg_viral_score: number | null;
  top_problemas: { problema: string; count: number }[];
  top_solucoes: { solucao: string; count: number }[];
  insight_text: string | null;
}

function buildPriorContext(prior: PriorAnalysis | null, isPT: boolean): string {
  if (!prior) return "";
  const date = new Date(prior.created_at).toISOString().slice(0, 10);
  if (isPT) {
    return `\n\nHISTÓRICO DESTE PERFIL (análise anterior em ${date}):
- Score geral anterior: ${prior.score_geral ?? "?"}
- Hook anterior: ${prior.hook_strength ?? "?"} | Retenção: ${prior.retention ?? "?"} | Engajamento: ${prior.engagement ?? "?"} | Viral: ${prior.viral_score ?? "?"}
- Problemas detectados antes: ${(prior.problemas_detectados || []).slice(0, 5).join(" | ") || "(nenhum)"}
INSTRUÇÃO: Compare com a análise atual. Mencione explicitamente em pelo menos 1 burningProblem.solution ou em patterns o que MELHOROU, o que PIOROU e o que SEGUE IGUAL desde a última análise.`;
  }
  return `\n\nPROFILE HISTORY (previous analysis on ${date}):
- Previous overall score: ${prior.score_geral ?? "?"}
- Previous hook: ${prior.hook_strength ?? "?"} | retention: ${prior.retention ?? "?"} | engagement: ${prior.engagement ?? "?"} | viral: ${prior.viral_score ?? "?"}
- Previous problems: ${(prior.problemas_detectados || []).slice(0, 5).join(" | ") || "(none)"}
INSTRUCTION: Compare to the current analysis. Explicitly mention in at least 1 burningProblems.solution or in patterns what IMPROVED, what GOT WORSE and what STAYED THE SAME since last time.`;
}

function buildNicheContext(insight: NicheInsightRow | null, isPT: boolean): string {
  if (!insight || insight.total_analises < 2) return "";
  const top3Problems = (insight.top_problemas || []).slice(0, 3).map(p => `• ${p.problema} (${p.count}x)`).join("\n") || "(sem dados)";
  const top3Solutions = (insight.top_solucoes || []).slice(0, 3).map(s => `• ${s.solucao} (${s.count}x)`).join("\n") || "(sem dados)";
  const avg = (n: number | null) => n == null ? "?" : Number(n).toFixed(1);
  if (isPT) {
    return `\n\nINSIGHTS DO NICHO "${insight.nicho}" (baseado em ${insight.total_analises} análises anteriores):
Médias do nicho — Score geral: ${avg(insight.avg_score_geral)} | Hook: ${avg(insight.avg_hook_strength)} | Retenção: ${avg(insight.avg_retention)} | Engajamento: ${avg(insight.avg_engagement)} | Viral: ${avg(insight.avg_viral_score)}
Top 3 problemas mais comuns no nicho:
${top3Problems}
Top 3 soluções mais sugeridas no nicho:
${top3Solutions}
${insight.insight_text ? `\nResumo estratégico do nicho: ${insight.insight_text}` : ""}
INSTRUÇÃO: Use estes dados reais de outras análises do mesmo nicho para enriquecer suas recomendações. Compare o perfil atual com a média do nicho em pelo menos 1 burningProblem.`;
  }
  return `\n\nNICHE INSIGHTS for "${insight.nicho}" (based on ${insight.total_analises} prior analyses):
Niche averages — Overall: ${avg(insight.avg_score_geral)} | Hook: ${avg(insight.avg_hook_strength)} | Retention: ${avg(insight.avg_retention)} | Engagement: ${avg(insight.avg_engagement)} | Viral: ${avg(insight.avg_viral_score)}
Top 3 most common problems in the niche:
${top3Problems}
Top 3 most suggested solutions in the niche:
${top3Solutions}
${insight.insight_text ? `\nStrategic niche summary: ${insight.insight_text}` : ""}
INSTRUCTION: Use this real data from other analyses in the same niche to enrich your recommendations. Compare the current profile against the niche average in at least 1 burningProblem.`;
}

function buildPrompts(
  username: string,
  url: string,
  lang: string,
  company: string,
  scrapedSummary: string,
  priorContext: string,
  nicheContext: string,
) {
  const isPT = lang === "pt-BR";
  const c = company || "Viewsup Insights";
  const langLine = isPT
    ? "OUTPUT LANGUAGE: ALL text MUST be in Português Brasileiro (PT-BR)."
    : "OUTPUT LANGUAGE: ALL text MUST be in British English (EN-GB).";

  // Strict, data-grounded specificity rules — both languages share the same rules.
  const rulesPT = `REGRAS OBRIGATÓRIAS DE ESPECIFICIDADE (a violação invalida a análise):
1. SEMPRE cite números reais do perfil: quantidade exata de seguidores, média real de likes (avgLikes), média real de comentários (avgComments), e a taxa de engajamento calculada (engagementRate %). Use os números brutos exatos exibidos em "PROFILE METRICS" e "AGGREGATE METRICS".
2. SEMPRE referencie posts específicos pelo SHORTCODE entre crases. Exemplo correto: "seu post \`C1aBcD2\` de 2026-04-12 teve 87 likes, 38% abaixo da sua média de 140".
3. SEMPRE compare a métrica real do perfil com o benchmark do nicho (quando houver dados em "NICHE BENCHMARKS"). Exemplo: "sua taxa de engajamento é 1.2% enquanto a média do nicho ${'${'}nicho${'}'} é 3.5% — um gap de 2.3 p.p.".
4. SEMPRE identifique explicitamente o melhor (⭐BEST) e o pior (🔻WORST) post pelo shortcode em pelo menos 1 burningProblem ou em "patterns", explicando POR QUE com base nos dados (formato, caption, hora, hashtags, comprimento do vídeo).
5. videoIdeas (10 roteiros): cada ideia DEVE ser inspirada em um tema/formato/hook que JÁ funcionou no perfil — cite no campo "whyItWorks" ausente ou na hashtag o shortcode-fonte (ex.: "baseado no padrão do post \`C1aBcD2\` que teve 3x mais engajamento"). NUNCA proponha ideias genéricas desconectadas do histórico.
6. PROIBIDO usar frases vagas como "considere melhorar seu hook", "tente engajar mais", "poste com mais frequência". Toda recomendação DEVE ser ancorada em um número real ou shortcode. Em vez de "melhore seu hook", escreva: "seu post \`X\` teve apenas 4 segundos de retenção implícita (likes/views = 0.8% vs nicho 3%) — substitua os primeiros 3s por um pattern interrupt visual".
7. Se um campo numérico estiver "?" nos dados coletados, declare "dado indisponível" e prossiga — NÃO invente números.
8. burningProblems[].impact DEVE quantificar perda em números reais (ex.: "perda estimada de ~${'~'}450 visualizações por post = ~13.500/mês").
9. improvedHooks: cada hook reescrito DEVE referenciar a caption original do post (shortcode) que está sendo melhorado.
10. rewrittenCaptions: o campo "original" DEVE ser uma caption REAL extraída de "POSTS DETAIL" (não inventada).
11. trendRadar CRITICAL — MANDATORY 5 ITEMS: You MUST return exactly 5 trendRadar items. Returning fewer than 5 or an empty array will FAIL the entire analysis. Each item must be a REAL content format trending specifically in the "${'${'}nicho${'}'}" niche. Examples by niche: Imobiliaria=[neighborhood price comparison reels, mortgage calculator tutorials, luxury property tours, before/after renovation reveals, client testimonial storytelling]; Fitness=[75-day challenge updates, PR attempt videos, supplement honest reviews, transformation side-by-side, coach vs client workout]; Marketing=[client results case studies, tool comparison reviews, campaign behind-the-scenes, fail and lesson videos, trend prediction content]. FORBIDDEN titles: anything generic like hook techniques, visual proof, content series — these are Instagram tactics not niche trends.
12. dimensions DEVE conter EXATAMENTE 5 itens com estes valores fixos no campo "name": "hookRetention", "visualConsistency", "engagement", "contentStrategy", "community". Os "label" correspondentes devem ser "Hook & Retention", "Visual Identity", "Engagement", "Content Strategy", "Community Building".`;

  const rulesEN = `MANDATORY SPECIFICITY RULES (violation invalidates the analysis):
1. ALWAYS cite real profile numbers: exact follower count, real avgLikes, real avgComments, and the computed engagement rate (engagementRate %). Use the exact raw numbers shown in "PROFILE METRICS" and "AGGREGATE METRICS".
2. ALWAYS reference specific posts by SHORTCODE in backticks. Correct example: "your post \`C1aBcD2\` from 2026-04-12 got 87 likes, 38% below your average of 140".
3. ALWAYS compare the real profile metric against the niche benchmark (when "NICHE BENCHMARKS" has data). Example: "your engagement rate is 1.2% while the niche average is 3.5% — a 2.3pp gap".
4. ALWAYS explicitly identify the best (⭐BEST) and worst (🔻WORST) post by shortcode in at least 1 burningProblem or in "patterns", explaining WHY based on the data (format, caption, time, hashtags, video length).
5. videoIdeas (10 scripts): each idea MUST be inspired by a theme/format/hook that ALREADY worked on the profile — cite the source shortcode (e.g. "based on the pattern of post \`C1aBcD2\` which got 3× the engagement"). NEVER propose generic ideas disconnected from history.
6. FORBIDDEN to use vague phrases like "consider improving your hook", "try to engage more". Every recommendation MUST be anchored on a real number or shortcode. Instead of "improve your hook", write: "your post \`X\` had only 4s implied retention (likes/views = 0.8% vs niche 3%) — replace the first 3s with a visual pattern interrupt".
7. If a numeric field is "?" in scraped data, state "data unavailable" and proceed — NEVER fabricate numbers.
8. burningProblems[].impact MUST quantify loss in real numbers (e.g. "~450 lost views/post ≈ 13,500/month").
9. improvedHooks: each rewritten hook MUST reference the original post caption (shortcode) being improved.
10. rewrittenCaptions: the "original" field MUST be a REAL caption extracted from "POSTS DETAIL" (not fabricated).
11. trendRadar CRITICAL — MANDATORY 5 ITEMS: You MUST return exactly 5 trendRadar items. Returning fewer than 5 or an empty array will FAIL the entire analysis. Each item must be a REAL content format trending specifically in the "${'${'}nicho${'}'}" niche. Examples by niche: Imobiliaria=[neighborhood price comparison reels, mortgage calculator tutorials, luxury property tours, before/after renovation reveals, client testimonial storytelling]; Fitness=[75-day challenge updates, PR attempt videos, supplement honest reviews, transformation side-by-side, coach vs client workout]; Marketing=[client results case studies, tool comparison reviews, campaign behind-the-scenes, fail and lesson videos, trend prediction content]. FORBIDDEN titles: anything generic like hook techniques, visual proof, content series — these are Instagram tactics not niche trends.
12. dimensions MUST contain EXACTLY 5 items with these fixed "name" values: "hookRetention", "visualConsistency", "engagement", "contentStrategy", "community". Their human "label" must be "Hook & Retention", "Visual Identity", "Engagement", "Content Strategy", "Community Building".`;

  const systemPrompt = `You are a Senior Digital Strategy Consultant specializing in Video Retention and Social Content Performance.

${langLine}

${isPT ? rulesPT : rulesEN}

You must be completely deterministic in your scoring. Given the same data, always produce the same scores. Base scores strictly on the mathematical data provided (followers, avgLikes, avgComments, engagementRate, post counts), never on subjective interpretation. Use fixed thresholds and rounded integers for every score.

You are auditing a real Instagram profile using REAL scraped data. Be brutally specific, data-driven, realistic, and constructive. Realistic scores (most profiles 35-70, rarely above 80).

ALWAYS classify the profile into one of the normalised niches in the "nicho" enum. Pick the closest match — use "Outros" only as a last resort.

Mention "${c}" naturally in 1-2 burningProblems solutions when relevant.

Return ONLY the fields defined in the tool schema. Keep each text field tight so the full JSON stays compact, but always include the exact numbers and shortcodes required by the rules above.`;

 const userPrompt = isPT
    ? `Faça a auditoria do perfil @${username} (URL: ${url}) com base nos dados REAIS abaixo.

${scrapedSummary}${priorContext}${nicheContext}

TENDÊNCIAS ESPECÍFICAS DO NICHO PARA trendRadar (use como inspiração):
- Imobiliaria: "Tour de imóvel de alto padrão em 60 segundos", "Comparativo de preços por bairro", "Quanto custa morar em [cidade]", "Erros que compradores de primeiro imóvel cometem", "Bastidores de uma negociação imobiliária"
- Fitness: "Treino em 15 minutos para iniciantes", "Antes e depois em 90 dias", "Review honesto de suplemento", "O que eu comeria se começasse do zero", "Erro que impede seu ganho de massa"
- Marketing: "Case de cliente com resultado real em 30 dias", "Ferramentas de IA para marketing em 2026", "Campanha que fracassou e o que aprendi", "Como consegui X seguidores sem pagar anúncio", "Tendência de conteúdo que vai dominar esse mês"
- Advocacia: "Seus direitos que você não sabia que tinha", "O que fazer quando seu chefe faz isso", "Mito vs verdade jurídico", "Como contestar uma multa de trânsito", "Direitos do consumidor ignorados"
- Tecnologia: "Review honesto de [produto]", "IA que vai substituir essa profissão", "Setup de home office por menos de R$X", "App que mudou minha produtividade", "Comparativo de [produto A] vs [produto B]"
INSTRUÇÃO: Gere 5 trends EXCLUSIVAMENTE para o nicho detectado deste perfil. PROIBIDO usar títulos genéricos de Instagram.

LEMBRETE: cite números brutos (seguidores, avgLikes, avgComments, engagementRate%), referencie posts pelo shortcode entre crases, compare com benchmarks do nicho, e baseie os 10 videoIdeas nos posts que JÁ performaram bem neste perfil. Retorne apenas a estrutura definida no schema. Todo o conteúdo DEVE ser em Português Brasileiro.`
    : `Audit the profile @${username} (URL: ${url}) based on the REAL data below.

${scrapedSummary}${priorContext}${nicheContext}

NICHE-SPECIFIC TREND EXAMPLES FOR trendRadar (use as inspiration):
- Imobiliaria/Real Estate: "60-second luxury property tour", "Neighbourhood price comparison", "How much does it cost to live in [city]", "First-time buyer mistakes", "Behind the scenes of a property negotiation"
- Fitness: "15-minute beginner workout", "90-day transformation", "Honest supplement review", "What I'd eat starting from scratch", "The mistake stopping your muscle gain"
- Marketing: "Real client result in 30 days", "AI tools for marketing in 2026", "Campaign that failed and what I learned", "How I got X followers without paid ads", "Content trend dominating this month"
- Legal/Advocacy: "Rights you didn't know you had", "What to do when your boss does this", "Legal myth vs truth", "How to contest a fine", "Consumer rights being ignored"
- Technology: "Honest [product] review", "AI replacing this profession", "Home office setup under £X", "App that changed my productivity", "[Product A] vs [Product B] comparison"
INSTRUCTION: Generate 5 trends EXCLUSIVELY for this profile's detected niche. FORBIDDEN to use generic Instagram titles.

REMINDER: cite raw numbers (followers, avgLikes, avgComments, engagementRate%), reference posts by shortcode in backticks, compare to niche benchmarks, and base the 10 videoIdeas on posts that ALREADY performed well on this profile. Return only the schema-defined structure. ALL content MUST be in British English.`;

// --- Apify Instagram scraping (best-effort; failure is non-fatal) ---
interface ScrapeResult {
  summary: string;
  followers: number | null;
  avgLikes: number | null;
  avgComments: number | null;
  avgViews: number | null;
  engagementRate: number | null; // percent (likes+comments)/followers averaged
  profilePicUrl: string | null;
}

function fmtNum(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(Number(n))) return "?";
  const v = Number(n);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return String(Math.round(v));
}

async function scrapeInstagram(username: string): Promise<ScrapeResult> {
  const APIFY_API_KEY = Deno.env.get("APIFY_API_KEY");
  const empty: ScrapeResult = {
    summary: "Sem dados de scraping disponíveis. Faça uma análise simulada com base no username e boas práticas.",
    followers: null, avgLikes: null, avgComments: null, avgViews: null, engagementRate: null, profilePicUrl: null,
  };
  if (!APIFY_API_KEY) {
    console.log("[Apify] no key — skipping scrape");
    return empty;
  }
  const ac = new AbortController();
  const timeoutId = setTimeout(() => ac.abort(), 90_000);
  try {
    console.log("[Apify] starting scrape for @", username);
    const res = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${APIFY_API_KEY}&timeout=80`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [username] }),
        signal: ac.signal,
      },
    );
    clearTimeout(timeoutId);
    if (!res.ok) {
      console.warn("[Apify] non-OK status:", res.status);
      return empty;
    }
    const items = (await res.json()) as any[];
    const profile = items?.[0];
    if (!profile) return empty;

    const followers = Number.isFinite(profile.followersCount) ? Number(profile.followersCount) : null;
    const latest = (profile.latestPosts || []).slice(0, 12) as any[];

    // Per-post enriched normalisation
    const enriched = latest.map((p: any) => {
      const likes = Number(p.likesCount) || 0;
      const comments = Number(p.commentsCount) || 0;
      const views = Number(p.videoViewCount ?? p.videoPlayCount) || 0;
      const ts = p.timestamp || p.takenAtTimestamp || null;
      const dateIso = ts ? new Date(typeof ts === "number" ? ts * (ts < 1e12 ? 1000 : 1) : ts).toISOString().slice(0, 10) : "?";
      const engagement = likes + comments;
      const erPostPct = followers ? +((engagement / followers) * 100).toFixed(2) : null;
      return {
        shortCode: p.shortCode || p.shortcode || "?",
        url: p.url || (p.shortCode ? `https://www.instagram.com/p/${p.shortCode}/` : "?"),
        type: p.type || p.productType || "?",
        date: dateIso,
        likes, comments, views,
        engagement,
        erPostPct,
        caption: String(p.caption || "").replace(/\s+/g, " ").slice(0, 220),
        hashtags: Array.isArray(p.hashtags) ? p.hashtags.slice(0, 6) : [],
        videoDuration: Number(p.videoDuration) || null,
      };
    });

    const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
    const likesArr = enriched.map(p => p.likes).filter(n => n > 0);
    const commentsArr = enriched.map(p => p.comments).filter(n => n > 0);
    const viewsArr = enriched.map(p => p.views).filter(n => n > 0);
    const avgLikes = avg(likesArr);
    const avgComments = avg(commentsArr);
    const avgViews = avg(viewsArr);
    const engagementRate = followers && (avgLikes != null || avgComments != null)
      ? +(((avgLikes ?? 0) + (avgComments ?? 0)) / followers * 100).toFixed(2)
      : null;

    // Identify best & worst by engagement (likes+comments)
    const sorted = [...enriched].filter(p => p.likes + p.comments > 0).sort((a, b) => b.engagement - a.engagement);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    const postLines = enriched.map((p, i) => {
      const flag = best && p.shortCode === best.shortCode ? " ⭐BEST"
        : worst && p.shortCode === worst.shortCode && enriched.length > 1 ? " 🔻WORST" : "";
      const vs = avgLikes ? ` (${p.likes >= avgLikes ? "+" : ""}${Math.round((p.likes - avgLikes) / Math.max(avgLikes, 1) * 100)}% vs avg)` : "";
      return `[${i + 1}] shortcode=${p.shortCode} | ${p.type} | ${p.date} | likes=${p.likes}${vs} comments=${p.comments} views=${p.views || "—"} | ER=${p.erPostPct ?? "?"}%${flag}
    caption: "${p.caption || "(no caption)"}"${p.hashtags.length ? `\n    hashtags: ${p.hashtags.join(" ")}` : ""}`;
    }).join("\n");

    const summary = `=== PROFILE METRICS (REAL DATA — cite these exact numbers) ===
Username: @${username}
Bio: "${profile.biography || "(empty)"}"
Followers: ${followers ?? "?"} (${fmtNum(followers)}) | Following: ${profile.followsCount ?? "?"} | Total posts: ${profile.postsCount ?? "?"}
Verified: ${!!profile.verified} | Business account: ${!!profile.isBusinessAccount}
External link: ${profile.externalUrl || "(none)"}
Full name: ${profile.fullName || "?"} | Category: ${profile.businessCategoryName || profile.categoryName || "?"}

=== AGGREGATE METRICS (computed from last ${enriched.length} posts) ===
Avg likes per post: ${avgLikes ?? "?"}
Avg comments per post: ${avgComments ?? "?"}
Avg views per video: ${avgViews ?? "?"}
Engagement rate (avg): ${engagementRate ?? "?"}%  ← formula: (avgLikes+avgComments)/followers*100
Best performing post: ${best ? `shortcode=${best.shortCode} on ${best.date} with ${best.likes} likes / ${best.comments} comments (ER ${best.erPostPct}%) — caption: "${best.caption}"` : "n/a"}
Worst performing post: ${worst && enriched.length > 1 ? `shortcode=${worst.shortCode} on ${worst.date} with ${worst.likes} likes / ${worst.comments} comments (ER ${worst.erPostPct}%) — caption: "${worst.caption}"` : "n/a"}

=== POSTS DETAIL (use shortcodes when citing posts) ===
${postLines || "(no posts)"}`;

    return {
      summary,
      followers,
      avgLikes,
      avgComments,
      avgViews,
      engagementRate,
      profilePicUrl: profile.profilePicUrlHD || profile.profilePicUrl || null,
    };
  } catch (e) {
    clearTimeout(timeoutId);
    console.warn("[Apify] failed:", (e as Error).message);
    return empty;
  }
}

// Pull most-recent prior analysis for the same username (any user) for trend comparison
async function fetchPriorAnalysis(admin: any, userId: string, username: string): Promise<PriorAnalysis | null> {
  const { data, error } = await admin
    .from("profile_history")
    .select("created_at, score_geral, hook_strength, retention, engagement, viral_score, problemas_detectados")
    .eq("user_id", userId)
    .ilike("username", username)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn("[history] fetch failed:", error.message);
    return null;
  }
  return data as PriorAnalysis | null;
}

async function fetchNicheInsight(admin: any, nicho: string): Promise<NicheInsightRow | null> {
  const { data, error } = await admin
    .from("nicho_insights")
    .select("*")
    .eq("nicho", nicho)
    .maybeSingle();
  if (error) {
    console.warn("[niche] fetch failed:", error.message);
    return null;
  }
  return data as NicheInsightRow | null;
}

function pickDimensionScore(dimensions: any[], regex: RegExp): number | null {
  if (!Array.isArray(dimensions)) return null;
  const d = dimensions.find((x) => regex.test(String(x?.name || x?.label || "")));
  return d && Number.isFinite(d.score) ? Number(d.score) : null;
}

function isValidTrendRadarItem(item: any): boolean {
  return item
    && typeof item.title === "string" && item.title.trim().length > 0
    && typeof item.description === "string" && item.description.trim().length > 0
    && typeof item.example === "string" && item.example.trim().length > 0
    && typeof item.relevance === "string" && item.relevance.trim().length > 0;
}

const GENERIC_TREND_TITLES = [
  "gancho de contradição", "contradiction hook",
  "prova visual", "visual proof",
  "série curta", "short series",
  "hook", "gancho",
];

function normaliseTrendRadar(raw: any, isPT: boolean, nicho: string, username: string) {
  const candidates = [raw?.trendRadar, raw?.analysis_data?.trendRadar, raw?.analysisData?.trendRadar];
  const trendRadar = candidates.find((value) => Array.isArray(value)) || [];

  const valid = trendRadar.filter((item: any) => {
    if (!isValidTrendRadarItem(item)) return false;
    const titleLower = item.title.toLowerCase();
    const isGeneric = GENERIC_TREND_TITLES.some(g => titleLower.includes(g));
    if (isGeneric) {
      console.warn(`[trendRadar] rejected generic trend: "${item.title}"`);
      return false;
    }
    return true;
  }).slice(0, 5);

  console.log(`[trendRadar] valid=${valid.length} nicho=${nicho} username=${username}`);
  return valid;
}

async function recordHistory(
  admin: any,
  job: any,
  result: any,
  scrape: ScrapeResult,
) {
  try {
    const burning = Array.isArray(result.burningProblems) ? result.burningProblems : [];
    const dims = result.dimensions || [];
    const row = {
      user_id: job.user_id,
      username: result.username,
      instagram_url: job.instagram_url,
      nicho: NICHE_ENUM.includes(result.nicho) ? result.nicho : "Outros",
      pais: typeof result.pais === "string" ? result.pais.slice(0, 60) : null,
      score_geral: Number.isFinite(result.overallScore) ? result.overallScore : null,
      hook_strength: result.hookRetention?.score ?? pickDimensionScore(dims, /hook|gancho/i),
      retention: pickDimensionScore(dims, /reten|retain/i),
      engagement: result.profileHealth?.engagementRatio?.ratio ?? pickDimensionScore(dims, /engaj|engage/i),
      visual_branding: result.profileHealth?.visualConsistency?.score ?? pickDimensionScore(dims, /visual|brand/i),
      storytelling: pickDimensionScore(dims, /story|narrat/i),
      viral_score: result.viralScore?.probability ?? null,
      seguidores: scrape.followers,
      media_views: scrape.avgViews,
      media_likes: scrape.avgLikes ?? result.profileHealth?.engagementRatio?.avgLikes ?? null,
      media_comentarios: scrape.avgComments ?? result.profileHealth?.engagementRatio?.avgComments ?? null,
      problemas_detectados: burning.map((b: any) => String(b?.problem || "").slice(0, 240)).filter(Boolean),
      solucoes_sugeridas: burning.map((b: any) => String(b?.solution || "").slice(0, 240)).filter(Boolean),
    };
    const { error } = await admin.from("profile_history").insert(row);
    if (error) console.warn("[history] insert failed:", error.message);
    else console.log("[history] saved for", row.username, "nicho=", row.nicho);
  } catch (e) {
    console.warn("[history] unexpected error:", (e as Error).message);
  }
}

async function processJob(jobId: string) {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // Load job & flip to processing
  const { data: job, error: loadErr } = await admin
    .from("analysis_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();

  if (loadErr || !job) {
    console.error("[Worker] job not found:", jobId, loadErr?.message);
    return;
  }
  if (job.status !== "pending") {
    console.log("[Worker] job already in status:", job.status);
    return;
  }

  await admin.from("analysis_jobs").update({
    status: "processing",
    started_at: new Date().toISOString(),
  }).eq("id", jobId);

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY");

    const username = job.username as string;
    const isPT = job.language === "pt-BR";

    // Run scrape and prior-history fetch in parallel
    const [scrape, prior] = await Promise.all([
      scrapeInstagram(username),
      fetchPriorAnalysis(admin, job.user_id, username),
    ]);

    // Validate scraped data BEFORE calling Claude — avoid burning tokens with no input
    const hasValidScrape =
      scrape.followers != null &&
      scrape.followers > 0 &&
      (scrape.avgLikes != null || scrape.avgComments != null || scrape.avgViews != null);
    if (!hasValidScrape) {
      const reason = "Apify did not return valid profile data (private profile, invalid username, or scrape failed). Skipping AI call to avoid wasted tokens.";
      console.warn("[Worker] aborting before Claude:", reason);
      throw new Error(reason);
    }

    // Niche insight requires the niche, which we don't know yet → do a 2-pass:
    // pass 1 (cheap) we can skip; instead we ask Claude to pick the niche, then
    // re-prompt with niche context. To avoid 2x AI cost, we send the FULL niche
    // table summary in the first pass: Claude self-selects the niche AND uses it.
    // Here we fetch the full insights table so the model has cross-niche context.
    const { data: allInsights } = await admin
      .from("nicho_insights")
      .select("nicho, total_analises, avg_score_geral, top_problemas, top_solucoes, insight_text")
      .gte("total_analises", 2)
      .order("total_analises", { ascending: false })
      .limit(20);

    // For the prompt we pass a compact map; once the niche is detected we update profile_history.
    const nicheTableSummary = (allInsights ?? []).map((row: any) => {
      const tops = (row.top_problemas ?? []).slice(0, 2).map((p: any) => p.problema).join("; ");
      return `${row.nicho}: ${row.total_analises} análises, score médio ${Number(row.avg_score_geral ?? 0).toFixed(1)}, top problemas: ${tops || "—"}`;
    }).join("\n");

    const priorContext = buildPriorContext(prior, isPT);
    const nicheContext = nicheTableSummary
      ? (isPT
        ? `\n\nDADOS DE NICHOS (referência cruzada):\n${nicheTableSummary}\n\nApós escolher o "nicho" do perfil, use os top problemas/soluções desse nicho específico para enriquecer sua análise.`
        : `\n\nNICHE BENCHMARKS (cross-reference):\n${nicheTableSummary}\n\nAfter picking the profile's "nicho", use that niche's top problems/solutions to enrich your analysis.`)
      : "";

    const { systemPrompt, userPrompt } = buildPrompts(
      username,
      job.instagram_url,
      job.language,
      job.company_name || "Viewsup Insights",
      scrape.summary,
      priorContext,
      nicheContext,
    );

    console.log("[Worker] calling Anthropic for job:", jobId, "| prior=", !!prior, "| niche-rows=", allInsights?.length ?? 0);
    const ac = new AbortController();
    const timeoutId = setTimeout(() => ac.abort(), 240_000);
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
  model: "claude-sonnet-4-5-20250929",
  max_tokens: 8000,
  temperature: 0.1,
  system: systemPrompt,
  tools: [
    {
      type: "web_search_20250305",
      name: "web_search",
    },
    {
      name: ANALYSIS_SCHEMA.name,
      description: ANALYSIS_SCHEMA.description,
      input_schema: ANALYSIS_SCHEMA.parameters,
    }
  ],
  tool_choice: { type: "auto" },
  messages: [{ role: "user", content: userPrompt }],
}),
      signal: ac.signal,
    });
    clearTimeout(timeoutId);

    if (!anthropicRes.ok) {
      const txt = await anthropicRes.text();
      console.error("[Anthropic] error:", anthropicRes.status, txt.slice(0, 500));
      throw new Error(`Anthropic ${anthropicRes.status}`);
    }

    const data = await anthropicRes.json();
    const toolUse = (data.content || []).find((b: any) => b.type === "tool_use");
    if (!toolUse?.input) throw new Error("AI did not return structured analysis");

    const aiInput: any = toolUse.input;
    const analysis = aiInput;
    console.log('trendRadar:', JSON.stringify(analysis.trendRadar));
    const trendRadar = normaliseTrendRadar(analysis, isPT, analysis.nicho || "Outros", username);
    console.log(
      `[Worker] AI fields=${Object.keys(aiInput).join(",")} | trendRadar.length=${Array.isArray(aiInput.trendRadar) ? aiInput.trendRadar.length : "missing"} | normalisedTrendRadar.length=${trendRadar.length} | dimensions.length=${Array.isArray(aiInput.dimensions) ? aiInput.dimensions.length : "missing"}`,
    );

    // Normalise arrays so the frontend never crashes on missing fields
    for (const k of ["dimensions", "issues", "patterns", "improvedHooks", "rewrittenCaptions", "burningProblems", "contentPillars", "videoIdeas", "scriptSuggestions", "hookStyles", "recentPosts"]) {
      if (!Array.isArray(aiInput[k])) aiInput[k] = [];
    }

    const result = {
      url: job.instagram_url,
      username,
      language: job.language,
      ...aiInput,
      trendRadar,
    };

    await admin.from("analysis_jobs").update({
      status: "completed",
      result_data: result,
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);

    // Record into learning system (trigger will recompute nicho_insights)
    await recordHistory(admin, job, result, scrape);

    // Mirror to legacy reports table for dashboard listing
    console.log(`[Worker] profile_pic_url for @${username}:`, scrape.profilePicUrl ?? "(null)");
    try {
      const { error: reportErr } = await admin.from("reports").insert({
        user_id: job.user_id,
        username,
        profile_url: job.instagram_url,
        language: job.language,
        analysis_data: result,
        profile_pic_url: scrape.profilePicUrl,
      });
      if (reportErr) {
        console.warn("[Worker] reports mirror error:", reportErr.message);
      } else {
        console.log(`[Worker] reports row saved with profile_pic_url=${scrape.profilePicUrl ? "yes" : "no"}`);
      }
    } catch (e) {
      console.warn("[Worker] reports mirror failed:", (e as Error).message);
    }

    // Decrement analyses_remaining (skip for unlimited / agency plan)
    try {
      const { data: prof } = await admin
        .from("profiles")
        .select("plan, analyses_remaining")
        .eq("user_id", job.user_id)
        .single();
      if (prof && (prof as any).plan !== "agency" && (prof as any).analyses_remaining > 0) {
        await admin.from("profiles")
          .update({ analyses_remaining: (prof as any).analyses_remaining - 1 })
          .eq("user_id", job.user_id);
        console.log(`[Worker] analyses_remaining decremented for ${job.user_id}`);
      }
    } catch (e) {
      console.warn("[Worker] decrement failed:", (e as Error).message);
    }

    console.log("[Worker] job completed:", jobId);
  } catch (e) {
    const msg = (e as Error).message || "Unknown error";
    console.error("[Worker] job failed:", jobId, msg);
    await admin.from("analysis_jobs").update({
      status: "failed",
      error_message: msg.slice(0, 500),
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);
    // Credit protection: decrement only happens on the success path, so a failure
    // here means the user was NOT charged. Log explicitly for auditability.
    console.log(`[Worker] no credit charged for failed job ${jobId} (analyses_remaining untouched)`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authed = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData, error: authErr } = await authed.auth.getUser();
    if (authErr || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side entitlement check — block if no analyses left (skip for agency)
    const adminEarly = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: entProf } = await adminEarly
      .from("profiles")
      .select("plan, analyses_remaining")
      .eq("user_id", authData.user.id)
      .single();
    if (entProf && (entProf as any).plan !== "agency" && ((entProf as any).analyses_remaining ?? 0) <= 0) {
      return new Response(JSON.stringify({ error: "No analyses remaining. Please upgrade your plan." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (authErr || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { jobId } = await req.json();
    if (!jobId || typeof jobId !== "string") {
      return new Response(JSON.stringify({ error: "jobId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the job belongs to the user (RLS would also block, but be explicit)
    const { data: job } = await authed
      .from("analysis_jobs")
      .select("id, user_id, status")
      .eq("id", jobId)
      .maybeSingle();
    if (!job || job.user_id !== authData.user.id) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Kick off processing in the background — the HTTP response returns immediately,
    // so the client never holds the connection open and there is no idle timeout.
    // @ts-ignore EdgeRuntime is provided by Supabase Edge runtime
    EdgeRuntime.waitUntil(processJob(jobId));

    return new Response(JSON.stringify({ ok: true, jobId }), {
      status: 202,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-job error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
