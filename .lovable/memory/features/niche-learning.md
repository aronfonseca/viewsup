---
name: Niche Learning System
description: profile_history table logs every analysis with niche/scores/problems; nicho_insights aggregates per-niche averages, top problems/solutions, and AI summary; trigger recomputes after each new history row.
type: feature
---
# Niche-based learning system

Each completed `analysis_jobs` row triggers an insert into `public.profile_history` with:
- nicho (enum `profile_niche`, 20 normalised values), pais
- scores: score_geral, hook_strength, retention, engagement, visual_branding, storytelling, viral_score
- profile metrics: seguidores, media_views, media_likes, media_comentarios
- problemas_detectados[] (from burningProblems[].problem)
- solucoes_sugeridas[] (from burningProblems[].solution)

`public.nicho_insights` is keyed by nicho. SQL trigger `recompute_nicho_after_history` calls `recompute_nicho_insights(nicho)` on every insert, refreshing:
- total_analises + averages (score, hook, retention, engagement, viral)
- top_problemas / top_solucoes (top 5 by frequency, JSONB)

`process-job` worker:
1. Fetches prior analysis for same `(user_id, username)` — injects "what improved/worsened" instruction.
2. Fetches compact summary of all niches with ≥2 analyses → Claude self-selects `nicho` (enum) AND uses cross-niche benchmarks in prompt.
3. After Claude returns, `recordHistory()` derives metrics from result + scrape and inserts profile_history row → trigger recomputes aggregates automatically.

`insight_text` column reserved for periodic AI-generated narrative summary (hybrid approach — to be implemented when meaningful volume exists).
