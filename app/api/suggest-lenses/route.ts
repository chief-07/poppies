import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Domain-resolvable fallback questions across 5 distinct Qloo categories
const DOMAIN_QUESTIONS = [
  { domain: "music", label: "+ 2 AM Soundscape?", query: "What does their 2 AM solitary playlist sound like?" },
  { domain: "objects", label: "+ Worktable Tools?", query: "What tools and everyday objects rest on their worktable?" },
  { domain: "places", label: "+ Sunday Haunt?", query: "Where do they disappear to on Sunday afternoons?" },
  { domain: "books", label: "+ Secret Bookshelf?", query: "What books lean on their secret shelf?" },
  { domain: "contradiction", label: "+ The Contradiction?", query: "What unlikely vice or habit complicates their taste?" },
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
    const hasMusic = lower.includes("playlist") || lower.includes("soundscape") || lower.includes("music") || lower.includes("sound");
    const hasObjects = lower.includes("worktable") || lower.includes("tools") || lower.includes("objects") || lower.includes("jacket");
    const hasPlaces = lower.includes("haunt") || lower.includes("disappear") || lower.includes("walk") || lower.includes("where");
    const hasBooks = lower.includes("book") || lower.includes("shelf") || lower.includes("reading");
    const hasContradiction = lower.includes("contradiction") || lower.includes("vice") || lower.includes("guilty pleasure");

    // Pick available domains that have NOT been covered yet
    const availableFallbacks = DOMAIN_QUESTIONS.filter((d) => {
      if (d.domain === "music" && hasMusic) return false;
      if (d.domain === "objects" && hasObjects) return false;
      if (d.domain === "places" && hasPlaces) return false;
      if (d.domain === "books" && hasBooks) return false;
      if (d.domain === "contradiction" && hasContradiction) return false;
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

Suggest ONE short, crisp scene inquiry question targeting the category: ${targetDomain.toUpperCase()}.

CRITICAL WRITING RULES:
1. Keep the question SHORT, DIRECT, and RESTRAINED (under 12 words).
2. NO wordy or sing-songy melodrama. No purple prose like "sub-zero quiet" or "dead centuries". Simple, dignified, writerly questions.
3. It MUST be an unanswered question starting with "What" or "Where", ending with "?".
4. Label must be 2-3 words starting with "+" and ending with "?" (e.g. "+ 2 AM Soundscape?", "+ Worktable Tools?", "+ Sunday Haunt?").

Examples of the exact tone:
- "+ 2 AM Soundscape?" -> "What does their 2 AM solitary playlist sound like?"
- "+ Worktable Tools?" -> "What tools and everyday objects rest on their worktable?"
- "+ Sunday Haunt?" -> "Where do they disappear to on Sunday afternoons?"
- "+ Secret Shelf?" -> "What books lean on their secret shelf?"
- "+ The Contradiction?" -> "What unlikely vice or habit complicates their taste?"

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

      // Keep it concise: if more than 16 words, fallback to clean domain template
      if (query.split(" ").length > 16) {
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
