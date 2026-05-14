import type { ProfileAnalysis } from "./mockAnalysis";

/**
 * Static demo dataset used by the /demo route to preview the report layout
 * (and PDF export) without hitting Supabase or running a real analysis.
 */
export const demoAnalysis: ProfileAnalysis = {
  url: "https://www.instagram.com/cliente_demo/",
  username: "cliente_demo",
  language: "pt-BR",
  overallScore: 72,
  dimensions: [
    { name: "hookRetention", label: "Hook & Retention", score: 68, icon: "Zap" },
    { name: "visualConsistency", label: "Visual Identity", score: 81, icon: "Eye" },
    { name: "engagement", label: "Engagement", score: 54, icon: "Heart" },
    { name: "contentStrategy", label: "Content Strategy", score: 76, icon: "LayoutGrid" },
    { name: "community", label: "Community Building", score: 62, icon: "MessageCircle" },
  ],
  profileHealth: {
    visualConsistency: {
      score: 81,
      hasColorPattern: true,
      hasFontPattern: true,
      hostFaceVisible: true,
      issues: [
        "Capas dos Reels variam de paleta nas últimas 4 publicações.",
        "Falta hierarquia tipográfica clara nos títulos.",
      ],
      insight: "Identidade visual forte na grade, mas as capas precisam de um template fixo para acelerar reconhecimento.",
    },
    bioHook: {
      hasUSP: true,
      hasVisibleLink: true,
      issues: ["A bio termina sem CTA claro para o link."],
      insight: "USP está bem comunicada — adicione um verbo de ação ('Baixe o guia') antes do link para subir CTR em 30%+.",
    },
    engagementRatio: {
      ratio: 3.4,
      avgLikes: 1280,
      avgComments: 96,
      healthLabel: "Healthy",
      issues: ["Comentários concentrados em 2 posts virais; média baixa nos demais."],
      insight: "Engajamento médio saudável (3.4%), mas há dependência de 1-2 posts virais. Estratégia precisa distribuir melhor os ganchos.",
    },
  },
  hookRetention: {
    score: 68,
    audienceLostPercent: 42,
    hasVisualHook: true,
    hasVerbalHook: false,
    issues: [
      "Hook verbal só aparece após 2.5s — perda média de 42% da audiência nos primeiros 3s.",
      "Falta padrão de 'pattern interrupt' visual nos 0.5s iniciais.",
    ],
    insight: "Coloque a frase de impacto nos primeiros 0.8s e adicione um zoom-in agressivo no frame 1 para reduzir queda inicial.",
  },
  visualFatigue: {
    score: 74,
    avgSecondsBetweenCuts: 2.8,
    staticSegments: 3,
    issues: ["3 segmentos com mais de 4s sem corte — risco de scroll."],
    insight: "Ritmo geral bom; quebre os segmentos longos com B-roll ou texto animado a cada 2s.",
  },
  safeZoneAudit: {
    score: 65,
    captionsOutOfZone: 4,
    ctasHidden: 1,
    issues: ["Legendas saem da área segura em 4 vídeos.", "CTA escondido pela barra de ações em 1 reel."],
    insight: "Mova legendas para 18% do topo e mantenha CTAs entre 25% e 70% da altura para não serem cortados.",
  },
  audioClarity: {
    score: 79,
    hasBackgroundMusic: true,
    hasSoundEffects: true,
    issues: ["Música de fundo abafa a voz em 2 vídeos."],
    insight: "Reduza música em -8dB durante a fala. SFX bem usados, mantenha.",
  },
  ctaStrength: {
    score: 58,
    avgCtasPerVideo: 0.7,
    issues: ["Apenas 70% dos vídeos têm CTA explícito.", "CTAs genéricos: 'comenta aí' não converte."],
    insight: "Use CTAs ancorados em benefício: 'Comenta GUIA pra receber o PDF' converte 4x mais.",
  },
  benchmarkComparison: {
    hormoziGap: {
      editDensityGap: -34,
      hookAggressivenessGap: -28,
      cutFrequencyGap: -22,
      issues: ["Densidade de cortes 34% abaixo do padrão @hormozi."],
      insight: "Aproxime-se do ritmo Hormozi cortando a cada 1.8s e adicionando zoom dinâmico em cada nova ideia.",
    },
    stevenGap: {
      storytellingGap: -12,
      productionQualityGap: -8,
      emotionalDepthGap: -19,
      issues: ["Profundidade emocional 19% abaixo de @steven."],
      insight: "Insira 1 micro-vulnerabilidade pessoal por vídeo — eleva conexão e tempo de visualização.",
    },
    top3MissingElements: [
      "Hook visual nos primeiros 0.5s",
      "B-roll contextual durante explicações longas",
      "CTA específico no encerramento",
    ],
  },
  captionLanguageQuality: {
    score: 88,
    grammarErrors: 1,
    issues: ["1 erro de concordância em legenda recente."],
    insight: "Linguagem coerente com o público. Revise rapidamente antes de publicar.",
  },
  contentPillars: [
    {
      theme: "Bastidores de Estratégia",
      reasoning: "Posts mostrando processo geram 2.8x mais salvamentos que conteúdo finalizado.",
      exampleHook: "O que ninguém te conta sobre escalar no Instagram em 2026…",
    },
    {
      theme: "Mitos do Mercado",
      reasoning: "Quebra de objeções aumenta tempo médio de visualização em 35%.",
      exampleHook: "Pare de fazer isso se quer crescer organicamente.",
    },
    {
      theme: "Estudos de Caso",
      reasoning: "Prova social com números fecha o ciclo de confiança antes do CTA.",
      exampleHook: "Como tiramos um perfil de 2k para 80k em 90 dias.",
    },
  ],
  burningProblems: [
    {
      problem: "Você está perdendo 42% da audiência nos primeiros 3 segundos",
      impact: "A cada 1.000 visualizações, 420 pessoas saem antes de ouvir sua proposta — isso queima orçamento orgânico e impede que o algoritmo entregue para audiências frias.",
      solution: "Reescreva os ganchos para entregar a tese principal em até 0.8s, combinando texto on-screen + zoom-in agressivo. Veja o exemplo no post `Cx1y8aBpQ4w`.",
    },
    {
      problem: "CTAs genéricos estão capando seu lead-flow",
      impact: "Apenas 7% dos comentários viram conversa — os outros 93% somem porque o CTA não dá uma instrução específica e ancorada em benefício.",
      solution: "Padronize: 'Comenta a palavra X que eu te mando o material'. Aplique nos próximos 5 vídeos e meça a taxa de DMs em 14 dias.",
    },
    {
      problem: "Você depende de 1-2 posts virais por mês",
      impact: "A média ponderada esconde que 80% dos posts entregam menos de 800 visualizações — sua linha base está estagnada e a percepção de autoridade não cresce.",
      solution: "Crie 3 pilares fixos rotativos (ver acima) e distribua o ritmo de cortes Hormozi em 100% dos vídeos para subir a base.",
    },
  ],
  recentPosts: [
    { postUrl: "https://www.instagram.com/p/Cx1y8aBpQ4w/", shortCode: "Cx1y8aBpQ4w", description: "Reel de bastidores com 18k views" },
    { postUrl: "https://www.instagram.com/p/Cy3a2BcDeFg/", shortCode: "Cy3a2BcDeFg", description: "Carrossel de mitos com salvamento alto" },
    { postUrl: "https://www.instagram.com/p/Cz9X4HiJkLm/", shortCode: "Cz9X4HiJkLm", description: "Estudo de caso com CTA fraco" },
  ],
  issues: [],
  patterns: [],
  improvedHooks: [
    "PARE de postar antes de ouvir isso.",
    "Eu cresci 80k em 90 dias fazendo APENAS isto.",
    "O algoritmo do Instagram mudou — e quase ninguém percebeu.",
  ],
  rewrittenCaptions: [
    {
      original: "Mais um conteúdo pra vocês hoje! Espero que gostem, comenta aí o que achou 💛",
      rewritten: "Demorei 3 anos pra entender isto. Se eu soubesse antes, teria economizado R$ 40 mil em tráfego. Comenta GUIA que eu te mando o passo-a-passo no DM.",
    },
    {
      original: "Hoje vou falar sobre engajamento no Instagram e como melhorar seu perfil.",
      rewritten: "Engajamento não é curtida — é tempo de tela. E 9 em cada 10 perfis estão otimizando a métrica errada. Salva esse post antes que o algoritmo esconda.",
    },
  ],
  trendRadar: [
    {
      title: "Hook em formato 'POV reverso'",
      description: "Vídeos que começam com a câmera no ponto de vista do espectador estão gerando 38% mais retenção em nichos B2B.",
      example: "POV: você acabou de descobrir por que seu Reel não passa de 1k views.",
      relevance: "Encaixa diretamente nos seus pilares de Mitos e Bastidores — teste em 2 vídeos esta semana.",
    },
    {
      title: "Carrossel-conversa estilo iMessage",
      description: "Carrosséis simulando troca de mensagens estão dominando salvamentos em conteúdos de estratégia.",
      example: "Print de 'cliente real' perguntando como você dobrou o faturamento dele.",
      relevance: "Ideal para seus estudos de caso — converte autoridade em prova social escaneável.",
    },
  ],
  scriptSuggestions: [
    {
      title: "Por que seu Reel morre em 3 segundos",
      hook: "Se você posta e ninguém vê, NÃO é o algoritmo — é isto aqui.",
      visualDirection: "Zoom-in no rosto + texto vermelho piscando 'PARE' nos primeiros 0.5s.",
      whyItWorks: "Combina pattern interrupt visual com promessa de revelação — ataca diretamente o gap de hook identificado.",
    },
    {
      title: "O CTA que dobrou minhas DMs em 14 dias",
      hook: "Trocar essa palavra na sua legenda mudou tudo.",
      visualDirection: "Split screen mostrando legenda antes/depois com destaque amarelo na palavra-chave.",
      whyItWorks: "Specificity bias + prova rápida; ressoa com o problema de CTAs genéricos.",
    },
  ],
  roiProjection: {
    currentEstimatedReach: 18500,
    projectedReach: 64200,
    growthPercent: 247,
    assumptions: [
      "Implementação consistente dos novos hooks em 100% dos Reels por 60 dias.",
      "Adoção do ritmo de cortes Hormozi (1.8s) e CTAs ancorados.",
      "Frequência mantida de 4 publicações/semana.",
    ],
  },
  viralScore: {
    probability: 64,
    hookStrengthFactor: 58,
    editDensityFactor: 72,
    verdict: "Você está a **dois ajustes** de ter um perfil consistentemente viral: encurtar o hook verbal e padronizar o CTA. Faça isso e o teto sobe em 3x.",
  },
  mentalHeatmap: {
    totalDurationSeconds: 32,
    triggers: [
      { timestampSeconds: 1, type: "zoom", label: "Zoom-in no rosto" },
      { timestampSeconds: 4, type: "text", label: "Texto on-screen 'PARE'" },
      { timestampSeconds: 9, type: "cut", label: "Corte para B-roll" },
      { timestampSeconds: 15, type: "sfx", label: "SFX 'whoosh' transição" },
      { timestampSeconds: 22, type: "zoom", label: "Push-in dramático" },
      { timestampSeconds: 28, type: "text", label: "CTA on-screen" },
    ],
    insight: "Boa distribuição de gatilhos, mas falta um trigger entre 9-15s — o público cai exatamente nessa janela.",
  },
  hookStyles: [
    {
      topic: "Engajamento no Instagram",
      reversePsychology: "NÃO leia este post se você quer continuar com 200 views por Reel.",
      extremeCuriosity: "Descobri o motivo REAL pelo qual o Instagram esconde seus posts — e não é o que te falaram.",
      bruteAuthority: "Depois de auditar 1.200 perfis, eu posso afirmar: você está fazendo isto errado.",
      acidHumor: "Seu perfil tá igual currículo de estagiário em 2008: ninguém quer ler.",
    },
  ],
  soundscapeArchitect: {
    idealGenre: "Lo-fi cinematográfico com pulsos eletrônicos",
    bpmRange: "95-110 BPM",
    retentionSpeed: "Médio-rápido — sustenta atenção sem cansar.",
    trackSuggestions: [
      { title: "Midnight Boardroom", artist: "Kainbeats", bpm: 102, mood: "Confiante" },
      { title: "Slow Hustle", artist: "Lofi Geek", bpm: 96, mood: "Reflexivo" },
      { title: "Neon Strategy", artist: "Sero", bpm: 108, mood: "Energético" },
    ],
    insight: "Música atual está rápida demais (135 BPM) — desce para 100-110 BPM para combinar com tom consultivo.",
  },
  videoIdeas: [
    {
      title: "3 erros que destroem seu Reel nos primeiros 3 segundos",
      format: "Tutorial",
      hookVerbal: "Se você comete esse erro, o algoritmo te enterra.",
      structure: {
        gancho: "Zoom-in + texto 'PARE' nos primeiros 0.5s.",
        desenvolvimento: "Lista os 3 erros com exemplos visuais comparativos.",
        cta: "Comenta REELS pra receber o checklist completo.",
      },
      bestDay: "Terça-feira",
      bestTime: "19h-21h",
      hashtags: ["#instagrammarketing", "#reelsestrategia", "#marketingdigital"],
    },
    {
      title: "O que ninguém te conta sobre engajamento real",
      format: "Polêmica",
      hookVerbal: "Curtida não significa nada. Vou provar.",
      structure: {
        gancho: "Print de métricas chocantes nos 0.8s iniciais.",
        desenvolvimento: "Compara curtidas vs salvamentos em casos reais.",
        cta: "Salva esse post pra revisar antes do próximo Reel.",
      },
      bestDay: "Quinta-feira",
      bestTime: "12h-14h",
      hashtags: ["#engajamentoreal", "#estrategiainstagram", "#crescimentoorganico"],
    },
    {
      title: "Como tirei um perfil de 2k para 80k em 90 dias",
      format: "Prova Social",
      hookVerbal: "Esse cliente quase desistiu — até aplicar isto.",
      structure: {
        gancho: "Print de antes/depois nos primeiros 1s.",
        desenvolvimento: "Mostra o passo-a-passo aplicado.",
        cta: "Comenta CASE pra receber o estudo completo.",
      },
      bestDay: "Sábado",
      bestTime: "10h-12h",
      hashtags: ["#estudodecaso", "#crescimentoinstagram", "#marketingdeperformance"],
    },
  ],
};
