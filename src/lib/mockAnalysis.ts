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

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function analyzeProfile(url: string): Promise<ProfileAnalysis> {
  await delay(2500); // simulate processing

  const username = url.replace(/\/$/, "").split("/").pop() || "unknown";

  return {
    url,
    username,
    overallScore: 62,
    dimensions: [
      { name: "Hook Strength", score: 45, label: "Weak", icon: "Zap" },
      { name: "Visual Clarity", score: 72, label: "Good", icon: "Eye" },
      { name: "Engagement Trigger", score: 38, label: "Low", icon: "MessageCircle" },
      { name: "Content Structure", score: 78, label: "Strong", icon: "LayoutGrid" },
      { name: "Emotional Pull", score: 55, label: "Average", icon: "Heart" },
    ],
    issues: [
      "First lines of captions lack compelling hooks — 7 of 9 posts start with generic statements",
      "No clear call-to-action in 80% of posts",
      "Hashtag strategy is inconsistent — mixing broad and niche tags without pattern",
      "Posting cadence is irregular (gaps of 5+ days detected)",
      "Carousel posts underutilize the final slide for CTAs",
      "Caption length varies wildly (20 to 400+ words) with no consistency",
    ],
    patterns: [
      "Motivational quotes perform 2.3x better than product posts",
      "Posts with faces get 40% more engagement",
      "Reels under 15s have higher completion rates",
      "Posts published between 6-8pm get the most saves",
    ],
    improvedHooks: [
      "Stop scrolling — this one mistake is killing your reach 👇",
      "I analyzed 500 top creators and here's what they ALL do differently",
      "The algorithm didn't change. Your strategy did. Here's proof.",
      "3 things I'd do if I were starting from zero today",
      "Your followers aren't ignoring you — your hooks are boring. Fix it 👇",
    ],
    rewrittenCaptions: [
      {
        original:
          "Had a great day at the office working on new projects. Excited for what's coming! #business #entrepreneur",
        rewritten:
          "I just scrapped a project I spent 3 months on.\n\nHere's why that was the best decision I've ever made 👇\n\nWe were building something nobody asked for. The data was clear — 12 user interviews, zero excitement.\n\nSo instead of doubling down on ego, we pivoted.\n\nResult? 3x more signups in week one.\n\nThe lesson: Kill your darlings faster.\n\n💬 Have you ever had to abandon something you loved? Tell me below.",
      },
      {
        original:
          "Check out our new product launch! Link in bio. #newproduct #launch",
        rewritten:
          "We almost didn't launch this.\n\nAfter 6 months of testing, 47 iterations, and one near-meltdown — it's finally here.\n\nBut here's what nobody tells you about launches:\n\n→ The product is only 20% of success\n→ The story behind it matters more\n→ Your first 100 users define everything\n\nWe're giving early access to the first 50 people who comment "EARLY" below.\n\nNo link-in-bio games. Just comment and we'll DM you.",
      },
      {
        original: "Monday motivation! Let's crush this week 💪 #mondaymotivation",
        rewritten:
          "Monday doesn't care about your motivation.\n\nHere's what actually moves the needle:\n\n1️⃣ Pick ONE task that scares you — do it before 10am\n2️⃣ Block 2 hours with zero notifications\n3️⃣ End the day by writing tomorrow's #1 priority\n\nMotivation fades by Tuesday. Systems carry you through Friday.\n\n🔁 Save this for your next Monday reset.",
      },
    ],
  };
}
