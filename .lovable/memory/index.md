---
name: index
description: Project memory index
type: reference
---
# Project Memory

## Core
ViralLens AI: Instagram profile audit tool for 'Retention Engineering'. Diagnoses last 10-12 posts.
AI Persona: Senior Digital Strategy Consultant identifying 'Burning Problems' and framing professional solutions.
UI Style: Minimalist dark-themed SaaS aesthetic, blue-cyan-purple gradients, glassmorphism, ScoreRings.
i18n: PT-BR and EN-GB support. UI elements and AI insights dynamically adapt to selected language.
Tech Stack: Supabase (Auth, Edge Functions, Storage, DB RLS), Claude Sonnet 4.5, jspdf/html2canvas for PDF gen.

## Memories
- [Diagnostic Modules](mem://features/diagnostic-modules) — Comprehensive audit modules and premium strategy features (10 Videos, Trend Radar, etc.)
- [Retention Lab](mem://features/retention-lab) — Async video audit (300MB MP4/MOV) with persistent storage + 7-day cleanup + dashboard history
- [User System](mem://auth/user-system) — Supabase Auth, profiles auto-creation trigger, RLS multi-tenant data isolation
- [Branding](mem://features/branding) — Custom dynamic company name via localStorage used in UI/PDFs
- [Benchmarks](mem://features/benchmarks) — Reference benchmarks for gap analysis: @hormozi and @steven
- [Architecture](mem://tech/architecture) — Supabase Edge Functions, Claude Sonnet 4.5, Apify Instagram scraper, 'video-uploads' bucket
- [Niche Learning](mem://features/niche-learning) — profile_history + nicho_insights tables; per-analysis logging, niche aggregation trigger, prior-analysis comparison + cross-niche benchmarks injected into Claude prompt
