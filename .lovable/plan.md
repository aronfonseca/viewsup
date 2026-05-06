## Diagnóstico

Confirmei pela base de dados que a última análise (`@elever.agencia`, 12:21Z) **completou com sucesso**, mas o `analysis_data` salvo só contém um subconjunto de campos:

```
url, pais, nicho, issues, language, patterns, username, dimensions,
trendRadar, viralScore, overallScore, hookRetention, improvedHooks,
profileHealth, burningProblems, rewrittenCaptions
```

Faltam `roiProjection`, `mentalHeatmap`, `hookStyles`, `soundscapeArchitect`, `videoIdeas`, `scriptSuggestions`, `contentPillars`, `benchmarkComparison`, `visualFatigue`, `safeZoneAudit`, `audioClarity`, `ctaStrength`, `captionLanguageQuality`, `recentPosts` — Claude está omitindo esses blocos opcionais (provável efeito da redução de `max_tokens` para 8000 + prompt determinístico).

A maioria do `Results.tsx` está protegida com `analysis.X && ...`, mas alguns acessos podem disparar erro de renderização que, sem `ErrorBoundary`, derruba toda a árvore React → tela preta. Como o `BrowserRouter` sobrevive mas o `<Routes>` ficou unmounted, navegar para `/dashboard` continua preto até refresh.

Pontos suspeitos no `Results.tsx`:
- L517: `analysis.mentalHeatmap && analysis.mentalHeatmap.triggers.length > 0` → se `triggers` for `undefined` (objeto presente mas sem array), explode.
- L586/590: dentro do `hookStyles.map`, `hs[activeHookStyle]` retorna `undefined` se a chave não existir — não crasha mas pode disparar warning. OK.
- L621: `analysis.soundscapeArchitect.trackSuggestions.length` — se objeto existir sem o array, crasha.
- Acessos a sub-objetos (`hormoziGap.editDensityGap`, `stevenGap.storytellingGap`, `top3MissingElements.map`) sem null-checks dentro de `benchmarkComparison && ...`.
- `analysis.dimensions.map` (L462) e `analysis.issues.map`, `analysis.patterns.map`, `analysis.improvedHooks.map`, `analysis.rewrittenCaptions.map` — assumem arrays.

Quando um destes campos vier como `null`/objeto incompleto, o React derruba a página inteira.

## Plano

### 1. Adicionar `ErrorBoundary` global

Criar `src/components/ErrorBoundary.tsx` (class component) com fallback amigável (botão "Voltar ao painel" → `/dashboard` com `window.location.reload`). Envolver `<Routes>` em `App.tsx` com ele para que um erro em uma rota não derrube o app inteiro — navegar para `/dashboard` voltará a funcionar.

### 2. Defensive rendering em `Results.tsx`

Endurecer todas as guardas que assumem sub-arrays/sub-objetos:
- `mentalHeatmap`: checar `Array.isArray(triggers) && triggers.length > 0` e `totalDurationSeconds > 0`.
- `soundscapeArchitect`: checar `Array.isArray(trackSuggestions)` antes do `.length`.
- `benchmarkComparison`: guardar `hormoziGap`, `stevenGap`, `top3MissingElements` individualmente.
- `dimensions`, `issues`, `patterns`, `improvedHooks`, `rewrittenCaptions`, `burningProblems`, `contentPillars`, `videoIdeas`, `scriptSuggestions`, `hookStyles`: usar `Array.isArray(x) && x.length > 0` antes do `.map`.
- `profileHealth.engagementRatio.issues` e demais subarrays: `(x.issues ?? []).map`.

### 3. Corrigir geração incompleta na `process-job`

Para evitar reincidência, na edge function:
- Marcar como **opcionais no `required`** do `ANALYSIS_SCHEMA` os campos que Claude está omitindo (já são, aparentemente, mas confirmar) — não quebra nada.
- Pós-processar `analysis` no worker: garantir que arrays existam (`analysis.dimensions ??= []`, etc.) antes de salvar em `result`. Isso normaliza dados antigos/incompletos no backend.

### 4. Sanidade visual

Após o deploy, abrir `/dashboard`, clicar em um relatório existente (`@elever.agencia`) e confirmar que renderiza sem tela preta.

## Detalhes técnicos

**ErrorBoundary** — componente classe simples com `componentDidCatch` que loga em console e mostra fallback com `<Button onClick={() => { window.location.href = "/dashboard"; }}>`. Resetar boundary em `location.pathname` change via `key={location.pathname}` no children.

**Normalização no worker** (process-job, antes do `result = {...}`):
```ts
aiInput.dimensions = Array.isArray(aiInput.dimensions) ? aiInput.dimensions : [];
aiInput.issues = Array.isArray(aiInput.issues) ? aiInput.issues : [];
aiInput.patterns = Array.isArray(aiInput.patterns) ? aiInput.patterns : [];
aiInput.improvedHooks = Array.isArray(aiInput.improvedHooks) ? aiInput.improvedHooks : [];
aiInput.rewrittenCaptions = Array.isArray(aiInput.rewrittenCaptions) ? aiInput.rewrittenCaptions : [];
aiInput.burningProblems = Array.isArray(aiInput.burningProblems) ? aiInput.burningProblems : [];
```

Posso prosseguir com a implementação?
