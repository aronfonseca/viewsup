// Shared Apify Instagram scraping — used by process-job (per-user paid analysis)
// and niche-benchmark-agent (admin-curated seed accounts for niche benchmarks).
// Best-effort: on any failure this returns an "empty" result rather than throwing,
// callers decide whether an empty scrape is fatal for their use case.

export interface ScrapeResult {
  summary: string;
  followers: number | null;
  avgLikes: number | null;
  avgComments: number | null;
  avgViews: number | null;
  engagementRate: number | null; // percent (likes+comments)/followers averaged
  profilePicUrl: string | null;
}

export function fmtNum(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(Number(n))) return "?";
  const v = Number(n);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return String(Math.round(v));
}

export async function scrapeInstagram(username: string, timeoutMs = 150_000): Promise<ScrapeResult> {
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
  const timeoutId = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const fetchFromActor = async (actor: string, body: unknown): Promise<any[]> => {
      const url = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${APIFY_API_KEY}&timeout=120`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      if (!r.ok) {
        console.warn(`[Apify] ${actor} non-OK status:`, r.status);
        return [];
      }
      return (await r.json()) as any[];
    };

    console.log("[Apify] starting scrape for @", username);
    let items = await fetchFromActor("apify~instagram-profile-scraper", { usernames: [username] });
    let profile = items?.[0];

    // Fallback: primary returned empty → try generic instagram-scraper
    const primaryEmpty = !profile || (!profile.latestPosts?.length && profile.followersCount == null);
    if (primaryEmpty) {
      console.warn("[Apify] primary scraper returned empty — trying fallback apify~instagram-scraper");
      const fbItems = await fetchFromActor("apify~instagram-scraper", {
        directUrls: [`https://www.instagram.com/${username}/`],
        resultsType: "details",
        resultsLimit: 12,
        searchType: "user",
        addParentData: false,
      });
      clearTimeout(timeoutId);
      // instagram-scraper returns items where the first can be the profile with latestPosts,
      // or a flat list of posts referencing ownerUsername.
      const profItem = fbItems.find((x: any) => x && (x.username === username || x.ownerUsername === username) && (x.latestPosts || x.followersCount != null));
      if (profItem) {
        profile = {
          ...profItem,
          latestPosts: profItem.latestPosts || fbItems.filter((x: any) => x?.ownerUsername === username || x?.shortCode || x?.shortcode).slice(0, 12),
        };
      } else {
        // Build a synthetic profile out of raw posts
        const posts = fbItems.filter((x: any) => x && (x.shortCode || x.shortcode));
        if (posts.length) {
          profile = {
            username,
            biography: "",
            followersCount: null,
            followsCount: null,
            postsCount: posts.length,
            verified: false,
            isBusinessAccount: false,
            externalUrl: null,
            fullName: null,
            latestPosts: posts.slice(0, 12),
          };
        }
      }
      if (!profile) {
        console.warn("[Apify] fallback also returned empty");
        return empty;
      }
    } else {
      clearTimeout(timeoutId);
    }

    const followers = Number.isFinite(profile.followersCount) ? Number(profile.followersCount) : null;
    const latest = (profile.latestPosts || []).slice(0, 9) as any[];

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
