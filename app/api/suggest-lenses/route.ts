import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Domain-resolvable fallback questions across 6 distinct Qloo categories
const DOMAIN_QUESTIONS = [
  { domain: "books", label: "+ What books are on their shelf?", query: "What books rest on their shelf?" },
  { domain: "contradiction", label: "+ What unlikely habit breaks their routine?", query: "What unlikely habit breaks their quiet routine?" },
  { domain: "wardrobe", label: "+ What clothes do they feel most comfortable in?", query: "What everyday clothes do they feel most comfortable in?" },
  { domain: "music", label: "+ What music do they listen to while working late?", query: "What music do they listen to while working late?" },
  { domain: "objects", label: "+ What everyday tools rest on their desk?", query: "What everyday tools and gear rest on their desk?" },
  { domain: "places", label: "+ Where do they go when they want to be alone?", query: "Where do they go in the city when they want to be alone?" },
];

export async function POST(req: NextRequest) {
  try {
    const { prompt, alreadyAddedCount = 0 } = await req.json();

    if (alreadyAddedCount >= 2) {
      return NextResponse.json({ lens: null });
    }

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 8) {
      return NextResponse.json({ lens: DOMAIN_QUESTIONS[0] });
    }

    const lower = prompt.toLowerCase();

    // Identify which domains are already present in the character text
    const hasMusic = lower.includes("playlist") || lower.includes("soundscape") || lower.includes("music") || lower.includes("sound") || lower.includes("listen") || lower.includes("song");
    const hasObjects = lower.includes("worktable") || lower.includes("tools") || lower.includes("objects") || lower.includes("gear") || lower.includes("desk") || lower.includes("drafting");
    const hasPlaces = lower.includes("haunt") || lower.includes("disappear") || lower.includes("walk") || lower.includes("where") || lower.includes("alone") || lower.includes("spot");
    const hasBooks = lower.includes("book") || lower.includes("shelf") || lower.includes("reading") || lower.includes("author") || lower.includes("novel");
    const hasContradiction = lower.includes("contradiction") || lower.includes("vice") || lower.includes("guilty pleasure") || lower.includes("habit") || lower.includes("routine");
    const hasWardrobe = lower.includes("clothes") || lower.includes("wardrobe") || lower.includes("jacket") || lower.includes("wear") || lower.includes("shoes") || lower.includes("pants");

    // Pick available domains that have NOT been covered yet
    const availableFallbacks = DOMAIN_QUESTIONS.filter((d) => {
      if (d.domain === "music" && hasMusic) return false;
      if (d.domain === "objects" && hasObjects) return false;
      if (d.domain === "places" && hasPlaces) return false;
      if (d.domain === "books" && hasBooks) return false;
      if (d.domain === "contradiction" && hasContradiction) return false;
      if (d.domain === "wardrobe" && hasWardrobe) return false;
      return true;
    });

    const fallbackLens = availableFallbacks[0] || DOMAIN_QUESTIONS[(alreadyAddedCount + 1) % DOMAIN_QUESTIONS.length];

    if (!ai) {
      return NextResponse.json({ lens: fallbackLens });
    }

    // Determine target category for the suggestion
    const targetDomain = fallbackLens.domain;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: `You are the cultural inquiry agent for "Poppies", a studio grounded in Qloo's cultural intelligence API.
Look at this character draft:
"""${prompt.slice(0, 500)}"""

Suggest ONE short, natural scene inquiry question targeting the category: ${targetDomain.toUpperCase()}.

CRITICAL WRITING RULES:
1. Keep the question SHORT, DIRECT, and NATURAL (under 12 words).
2. It MUST be an unanswered question starting with "What" or "Where", ending with "?".
3. Label MUST be the same as the question, prefixed with "+ " (e.g. "+ What books are on their shelf?", "+ What unlikely habit breaks their routine?").
4. Query MUST be the question itself without the "+ ".

Examples of exact phrasing:
- "+ What books are on their shelf?" -> "What books rest on their shelf?"
- "+ What unlikely habit breaks their routine?" -> "What unlikely habit breaks their quiet routine?"
- "+ What music do they listen to while working late?" -> "What music do they listen to while working late?"
- "+ What everyday tools rest on their desk?" -> "What everyday tools and gear rest on their desk?"
- "+ Where do they go when they want to be alone?" -> "Where do they go in the city when they want to be alone?"

Respond ONLY with valid JSON:
{
  "lens": {
    "label": string,
    "query": string
  }
}`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 80,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    let lens = parsed.lens;

    if (lens && typeof lens.label === "string" && typeof lens.query === "string") {
      let query = lens.query.trim();
      let label = lens.label.trim();
      if (!label.startsWith("+")) label = `+ ${label}`;
      if (!label.endsWith("?")) label = `${label}?`;
      if (!query.endsWith("?")) query = `${query}?`;

      // If already asked or too verbose, fallback to clean domain template
      if (lower.includes(query.toLowerCase()) || query.split(" ").length > 16) {
        query = fallbackLens.query;
        label = fallbackLens.label;
      }

      return NextResponse.json({ lens: { label, query } });
    }

    return NextResponse.json({ lens: fallbackLens });
  } catch (error) {
    console.error("Error generating Qloo inquiry lens:", error);
    return NextResponse.json({ lens: DOMAIN_QUESTIONS[0] });
  }
}
